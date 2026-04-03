import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

interface Achievement {
  id: string;
  slug: string;
  category: string;
  icon: string;
  threshold: number;
  token_reward: number;
  sort_order: number;
  progress: number;
  unlocked_at: string | null;
  is_unlocked: boolean;
}

export function useAchievements() {
  const session = useAuthStore((s) => s.session);

  return useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const res = await api.get('/achievements');
      return res.achievements;
    },
    enabled: !!session,
  });
}

export function useCheckAchievements() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/achievements', { action: 'check' });
      return res.newly_unlocked as Achievement[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
