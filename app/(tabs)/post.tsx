import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores';
import { DIETARY_TAGS } from '@/lib/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '@/lib/theme';

export default function PostScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [portions, setPortions] = useState('1');
  const [location, setLocation] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageUri) return null;

    const ext = imageUri.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${ext}`;

    const response = await fetch(imageUri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('meal-images')
      .upload(fileName, blob, { contentType: `image/${ext}` });

    if (error) {
      console.log('[v0] Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage.from('meal-images').getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handlePost = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your meal');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadImage();
      }

      const { error } = await supabase.from('meals').insert({
        user_id: user?.id,
        title: title.trim(),
        description: description.trim() || null,
        portions: parseInt(portions) || 1,
        location: location.trim() || null,
        dietary_tags: selectedTags,
        image_url: imageUrl,
        is_available: true,
      });

      if (error) throw error;

      Alert.alert('Success', 'Your meal has been posted!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/feed') },
      ]);

      // Reset form
      setTitle('');
      setDescription('');
      setPortions('1');
      setLocation('');
      setSelectedTags([]);
      setImageUri(null);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={48} color={colors.textMuted} />
              <Text style={styles.imageText}>Add a photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          <Input
            label="Title"
            placeholder="What did you make?"
            value={title}
            onChangeText={setTitle}
          />

          <Input
            label="Description"
            placeholder="Tell us about your meal..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="Portions"
                placeholder="1"
                value={portions}
                onChangeText={setPortions}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Location"
                placeholder="Neighborhood"
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          <Text style={styles.label}>Dietary Tags</Text>
          <View style={styles.tagsContainer}>
            {DIETARY_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, selectedTags.includes(tag) && styles.tagActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title="Share Meal"
            onPress={handlePost}
            loading={loading}
            disabled={!title.trim()}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    padding: spacing.md,
  },
  imagePicker: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.xl,
  },
  imageText: {
    marginTop: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  form: {
    flex: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginBottom: spacing.sm,
    fontWeight: fontWeight.medium,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  tagTextActive: {
    color: colors.white,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});