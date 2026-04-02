import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';

export interface ProfilePhoto {
  id: string;
  user_id: string;
  photo_url: string;
  is_public: boolean;
  sort_order: number;
  created_at: string;
}

export function useProfilePhotos(userId?: string) {
  const session = useAuthStore((s) => s.session);
  const targetId = userId || session?.user.id;

  return useQuery({
    queryKey: ['profile-photos', targetId],
    queryFn: async (): Promise<ProfilePhoto[]> => {
      const { data, error } = await supabase
        .from('profile_photos')
        .select('*')
        .eq('user_id', targetId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as ProfilePhoto[];
    },
    enabled: !!targetId,
  });
}

export function useUploadPhoto() {
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ProfilePhoto> => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets[0].base64) {
        throw new Error('cancelled');
      }

      const asset = result.assets[0];
      const userId = session!.user.id;
      const photoId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const ext = asset.uri.split('.').pop() || 'jpg';
      const filePath = `${userId}/${photoId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, decode(asset.base64), {
          contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      const { data: existing } = await supabase
        .from('profile_photos')
        .select('sort_order')
        .eq('user_id', userId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

      const { data, error } = await supabase
        .from('profile_photos')
        .insert({
          user_id: userId,
          photo_url: `${publicUrl}?t=${Date.now()}`,
          is_public: true,
          sort_order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ProfilePhoto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-photos', session!.user.id] });
    },
  });
}

export function useDeletePhoto() {
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photo: ProfilePhoto) => {
      // Extract file path from URL
      const url = new URL(photo.photo_url.split('?')[0]);
      const pathParts = url.pathname.split('/profile-photos/');
      if (pathParts[1]) {
        await supabase.storage
          .from('profile-photos')
          .remove([decodeURIComponent(pathParts[1])]);
      }

      const { error } = await supabase
        .from('profile_photos')
        .delete()
        .eq('id', photo.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-photos', session!.user.id] });
    },
  });
}

export function useTogglePhotoVisibility() {
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, isPublic }: { photoId: string; isPublic: boolean }) => {
      const { error } = await supabase
        .from('profile_photos')
        .update({ is_public: isPublic })
        .eq('id', photoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-photos', session!.user.id] });
    },
  });
}

export function useGrantPhotoAccess() {
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (grantedToId: string) => {
      const { error } = await supabase
        .from('photo_access_grants')
        .upsert(
          { owner_id: session!.user.id, granted_to_id: grantedToId },
          { onConflict: 'owner_id,granted_to_id' },
        );
      if (error) throw error;
    },
    onSuccess: (_data, grantedToId) => {
      queryClient.invalidateQueries({ queryKey: ['photo-access', session!.user.id, grantedToId] });
    },
  });
}

export function useRevokePhotoAccess() {
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (grantedToId: string) => {
      const { error } = await supabase
        .from('photo_access_grants')
        .delete()
        .eq('owner_id', session!.user.id)
        .eq('granted_to_id', grantedToId);
      if (error) throw error;
    },
    onSuccess: (_data, grantedToId) => {
      queryClient.invalidateQueries({ queryKey: ['photo-access', session!.user.id, grantedToId] });
    },
  });
}

export function usePhotoAccessStatus(ownerUserId: string) {
  const session = useAuthStore((s) => s.session);

  return useQuery({
    queryKey: ['photo-access', ownerUserId, session?.user.id],
    queryFn: async (): Promise<boolean> => {
      if (!session || ownerUserId === session.user.id) return true;
      const { data } = await supabase
        .from('photo_access_grants')
        .select('id')
        .eq('owner_id', ownerUserId)
        .eq('granted_to_id', session.user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!session && !!ownerUserId,
  });
}

export function usePhotoAccessGrants() {
  const session = useAuthStore((s) => s.session);

  return useQuery({
    queryKey: ['photo-access-grants', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photo_access_grants')
        .select('granted_to_id, created_at')
        .eq('owner_id', session!.user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!session,
  });
}
