import { Redirect } from 'expo-router';
import { useAuthStore } from '@/lib/stores';

export default function Index() {
  const { session, isLoading } = useAuthStore();

  if (isLoading) return null;

  return <Redirect href={session ? '/(tabs)/feed' : '/(auth)/login'} />;
}