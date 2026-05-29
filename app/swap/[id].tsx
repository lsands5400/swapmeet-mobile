import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores';
import { Meal } from '@/lib/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { colors, spacing, fontSize, borderRadius, fontWeight } from '@/lib/theme';

export default function SwapScreen() {
  const { id: mealId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMeal = async () => {
      const { data } = await supabase
        .from('meals')
        .select('*, profiles(*)')
        .eq('id', mealId)
        .single();

      if (data) {
        setMeal(data);
      }
    };

    fetchMeal();
  }, [mealId]);

  const handleSwapRequest = async () => {
    if (!user || !meal) return;

    setLoading(true);

    try {
      // Create swap request
      const { error: swapError } = await supabase.from('swap_requests').insert({
        requester_id: user.id,
        meal_id: meal.id,
        message: message.trim() || null,
        status: 'pending',
      });

      if (swapError) throw swapError;

      // Find or create conversation
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(participant_1.eq.${user.id},participant_2.eq.${meal.user_id}),and(participant_1.eq.${meal.user_id},participant_2.eq.${user.id})`
        )
        .single();

      let conversationId = existingConv?.id;

      if (!conversationId) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            participant_1: user.id,
            participant_2: meal.user_id,
          })
          .select('id')
          .single();

        conversationId = newConv?.id;
      }

      // Send initial message
      if (conversationId) {
        const swapMessage = message.trim()
          ? `Hi! I'd like to swap for your "${meal.title}". ${message}`
          : `Hi! I'd like to swap for your "${meal.title}".`;

        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: swapMessage,
        });

        await supabase
          .from('conversations')
          .update({ last_message: swapMessage, last_message_at: new Date().toISOString() })
          .eq('id', conversationId);
      }

      Alert.alert('Request Sent!', 'Your swap request has been sent. Check your messages!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!meal) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.mealPreview}>
        {meal.image_urls && (
          <Image source={{ uri: meal.image_urls }} style={styles.mealImage} contentFit="cover" />
        )}
        <View style={styles.mealInfo}>
          <Text style={styles.mealTitle}>{meal.title}</Text>
          <Text style={styles.mealAuthor}>by {meal.profiles?.full_name || 'Anonymous'}</Text>
          {meal.description && <Text style={styles.mealDescription}>{meal.description}</Text>}
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.sectionTitle}>Send a message (optional)</Text>
        <Input
          placeholder="Tell them what you'd like to swap, or just say hi!"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        <Button
          title="Send Swap Request"
          onPress={handleSwapRequest}
          loading={loading}
          style={styles.submitButton}
        />

        <Text style={styles.hint}>
          This will send a message to {meal.profiles?.full_name || 'the meal creator'} and create a
          swap request.
        </Text>
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
    padding: spacing.md,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealPreview: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  mealImage: {
    width: '100%',
    height: 200,
  },
  mealInfo: {
    padding: spacing.md,
  },
  mealTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  mealAuthor: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  mealDescription: {
    fontSize: fontSize.md,
    color: colors.text,
    marginTop: spacing.sm,
  },
  form: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: spacing.md,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});