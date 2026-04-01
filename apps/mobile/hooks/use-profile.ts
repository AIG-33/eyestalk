import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

interface Profile {
  id: string;
  nickname: string;
  age_range: string;
  avatar_url: string | null;
  interests: string[];
  is_verified: boolean;
  is_banned: boolean;
  token_balance: number;
}

export function useProfile() {
  const session = useAuthStore((s) => s.session);

  return useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<Profile | null> => {
      if (!session) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!session,
  });
}

export function useUpdateProfile() {
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: {
      nickname?: string;
      age_range?: string;
      interests?: string[];
      avatar_url?: string | null;
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session!.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUploadAvatar() {
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<string> => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets[0].base64) {
        throw new Error('cancelled');
      }

      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop() || 'jpg';
      const filePath = `${session!.user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(asset.base64), {
          contentType: `image/${ext}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', session!.user.id);

      return avatarUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useTokenHistory() {
  const session = useAuthStore((s) => s.session);

  return useQuery({
    queryKey: ['tokens', 'history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!session,
  });
}
