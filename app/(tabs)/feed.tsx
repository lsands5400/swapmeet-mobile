import React, { useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text } from 'react-native';
import { useMealsStore } from '@/lib/stores';
import { MealCard } from '@/components/MealCard';
import { colors, spacing, fontSize } from '@/lib/theme';

export default function FeedScreen() {
  const { meals, isLoading, fetchMeals } = useMealsStore();

  useEffect(() => {
    fetchMeals();
  }, []);

  if (!isLoading && meals.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No meals available yet</Text>
        <Text style={styles.emptySubtext}>Be the first to share a meal!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={meals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MealCard meal={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchMeals} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  list: {
    padding: spacing.md,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.text,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});