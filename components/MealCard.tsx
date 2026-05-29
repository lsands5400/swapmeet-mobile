import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Meal } from '@/lib/types';
import { colors, borderRadius, fontSize, fontWeight, spacing } from '@/lib/theme';
import { useMealsStore } from '@/lib/stores';

const { width } = Dimensions.get('window');

interface MealCardProps {
  meal: Meal;
}

export function MealCard({ meal }: MealCardProps) {
  const router = useRouter();
  const toggleLike = useMealsStore((state) => state.toggleLike);

  const handleLike = () => {
    toggleLike(meal.id);
  };

  const handleSwap = () => {
    router.push(`/swap/${meal.id}`);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={() => {}}>
        <Image
          source={{ uri: meal.profiles?.avatar_url || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <View style={styles.headerText}>
          <Text style={styles.userName}>{meal.profiles?.full_name || 'Anonymous'}</Text>
          <Text style={styles.location}>{meal.location || 'Location not set'}</Text>
        </View>
      </TouchableOpacity>

      {meal.image_url && (
        <Image source={{ uri: meal.image_url }} style={styles.image} contentFit="cover" />
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{meal.title}</Text>
        {meal.description && <Text style={styles.description}>{meal.description}</Text>}

        <View style={styles.tags}>
          {meal.dietary_tags?.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Ionicons
              name={meal.is_liked ? 'heart' : 'heart-outline'}
              size={24}
              color={meal.is_liked ? colors.error : colors.textSecondary}
            />
            <Text style={styles.actionText}>{meal.likes_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.actionText}>{meal.comments_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.swapButton} onPress={handleSwap}>
            <Ionicons name="swap-horizontal" size={20} color={colors.white} />
            <Text style={styles.swapText}>Request Swap</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  headerText: {
    marginLeft: spacing.sm,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  location: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  image: {
    width: '100%',
    height: width - spacing.md * 2,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  tag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  tagText: {
    fontSize: fontSize.xs,
    color: colors.primaryDark,
    fontWeight: fontWeight.medium,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  actionText: {
    marginLeft: spacing.xs,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginLeft: 'auto',
  },
  swapText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
    marginLeft: spacing.xs,
  },
});