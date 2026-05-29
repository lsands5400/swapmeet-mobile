import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { Profile, Meal } from './types';
import { supabase } from './supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  fetchProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  setSession: (session) => {
    set({ session, user: session?.user ?? null, isLoading: false });
  },
  setProfile: (profile) => set({ profile }),
  fetchProfile: async () => {
  const { user } = get();
  if (!user) {
    console.log('[v0] No user found, skipping profile fetch');
    return;
  }

  console.log('[v0] Fetching profile for user:', user.id);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  console.log('[v0] Profile fetch result:', { data, error });

  if (data) {
    set({ profile: data });
  } else if (error) {
    console.log('[v0] Profile fetch error:', error.message);
    // Profile might not exist yet - create it
    if (error.code === 'PGRST116') {
      console.log('[v0] Profile not found, creating one...');
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: user.id })
        .select()
        .single();
      
      if (newProfile) {
        set({ profile: newProfile });
      }
    }
  }
},
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
}));

interface MealsState {
  meals: Meal[];
  isLoading: boolean;
  fetchMeals: () => Promise<void>;
  toggleLike: (mealId: string) => Promise<void>;
}

export const useMealsStore = create<MealsState>((set, get) => ({
  meals: [],
  isLoading: false,
  fetchMeals: async () => {
    set({ isLoading: true });
    const userId = useAuthStore.getState().user?.id;

    const { data } = await supabase
      .from('meals')
      .select(`
        *,
        profiles (*),
        likes (id, user_id),
        comments (id)
      `)
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (data) {
      const mealsWithCounts = data.map((meal: any) => ({
        ...meal,
        likes_count: meal.likes?.length || 0,
        comments_count: meal.comments?.length || 0,
        is_liked: meal.likes?.some((like: any) => like.user_id === userId) || false,
      }));
      set({ meals: mealsWithCounts });
    }
    set({ isLoading: false });
  },
  toggleLike: async (mealId: string) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const { meals } = get();
    const meal = meals.find((m) => m.id === mealId);
    if (!meal) return;

    if (meal.is_liked) {
      await supabase.from('likes').delete().eq('meal_id', mealId).eq('user_id', userId);
    } else {
      await supabase.from('likes').insert({ meal_id: mealId, user_id: userId });
    }

    set({
      meals: meals.map((m) =>
        m.id === mealId
          ? {
              ...m,
              is_liked: !m.is_liked,
              likes_count: m.is_liked ? (m.likes_count || 1) - 1 : (m.likes_count || 0) + 1,
            }
          : m
      ),
    });
  },
}));