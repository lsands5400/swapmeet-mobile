import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, setProfile, signOut } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [neighborhood, setneighborhood] = useState(profile?.neighborhood || '');
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>(profile?.dietary_preferences || []);
  const [loading, setLoading] = useState(false);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && profile) {
      const uri = result.assets[0].uri;
      const ext = uri.split('.').pop();
      const fileName = `${profile.id}/avatar.${ext}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true, contentType: `image/${ext}` });

      if (!error) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', profile.id);
        setProfile({ ...profile, avatar_url: urlData.publicUrl });
      }
    }
  };

  const toggleDietaryPref = (tag: string) => {
    setDietaryPrefs((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!profile) return;

    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: fullName,
        bio,
        neighborhood,
        dietary_preferences: dietaryPrefs,
      })
      .eq('id', profile.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setProfile({
        ...profile,
        display_name: fullName,
        bio,
        neighborhood,
        dietary_preferences: dietaryPrefs,
      });
      setEditing(false);
    }

    setLoading(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={editing ? pickAvatar : undefined}>
          <Image
            source={{ uri: profile?.avatar_url || 'https://via.placeholder.com/120' }}
            style={styles.avatar}
          />
          {editing && (
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={16} color={colors.white} />
            </View>
          )}
        </TouchableOpacity>

        {!editing ? (
          <>
            <Text style={styles.name}>{profile?.display_name || 'Add your name'}</Text>
            <Text style={styles.email}>{profile?.email}</Text>
            {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
            {profile?.neighborhood && (
              <View style={styles.neighborhoodRow}>
                <Ionicons name="location" size={16} color={colors.textSecondary} />
                <Text style={styles.neighborhood}>{profile.neighborhood}</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.editForm}>
            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
            />
            <Input
              label="Bio"
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              multiline
            />
            <Input
              label="Neighborhood"
              value={neighborhood}
              onChangeText={setneighborhood}
              placeholder="Your neighborhood"
            />
          </View>
        )}
      </View>

      {editing && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Preferences</Text>
          <View style={styles.tagsContainer}>
            {DIETARY_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, dietaryPrefs.includes(tag) && styles.tagActive]}
                onPress={() => toggleDietaryPref(tag)}
              >
                <Text style={[styles.tagText, dietaryPrefs.includes(tag) && styles.tagTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {!editing && profile?.dietary_preferences && profile.dietary_preferences.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Preferences</Text>
          <View style={styles.tagsContainer}>
            {profile.dietary_preferences.map((tag) => (
              <View key={tag} style={[styles.tag, styles.tagActive]}>
                <Text style={[styles.tagText, styles.tagTextActive]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {editing ? (
          <>
            <Button title="Save Changes" onPress={handleSave} loading={loading} />
            <Button
              title="Cancel"
              onPress={() => setEditing(false)}
              variant="outline"
              style={styles.secondaryButton}
            />
          </>
        ) : (
          <>
            <Button title="Edit Profile" onPress={() => setEditing(true)} />
            <Button
              title="Sign Out"
              onPress={handleSignOut}
              variant="ghost"
              style={styles.signOutButton}
              textStyle={styles.signOutText}
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  email: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  bio: {
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  neighborhoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  neighborhood: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  editForm: {
    width: '100%',
    marginTop: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  actions: {
    marginTop: spacing.lg,
  },
  secondaryButton: {
    marginTop: spacing.sm,
  },
  signOutButton: {
    marginTop: spacing.md,
  },
  signOutText: {
    color: colors.error,
  },
});