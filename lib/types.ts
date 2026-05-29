export interface Profile {
  id: string;
  display_name: string | null;  // Changed from full_name
  avatar_url: string | null;
  bio: string | null;
  zip_code: string | null;       // Added
  neighborhood: string | null;   // Changed from location
  dietary_preferences: string[];
  created_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  portions: number;
  dietary_tags: string[];
  cuisine_type: string | null;
  available_from: string | null;
  available_until: string | null;
  location: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

export interface SwapRequest {
  id: string;
  requester_id: string;
  meal_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  requester?: Profile;
  meal?: Meal;
}

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  other_user?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}

export interface Like {
  id: string;
  user_id: string;
  meal_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  meal_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export const DIETARY_TAGS = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'halal',
  'kosher',
  'keto',
  'paleo',
] as const;

export type DietaryTag = (typeof DIETARY_TAGS)[number];