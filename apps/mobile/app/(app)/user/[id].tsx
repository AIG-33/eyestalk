import { useMemo } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, Dimensions, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useProfilePhotos, usePhotoAccessStatus } from '@/hooks/use-photos';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar } from '@/components/ui/avatar';
import { Tag } from '@/components/ui/tag';
import { useTheme, typography, spacing, radius, component } from '@/theme';
import type { ThemeColors } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_GAP = 6;
const PHOTO_COLS = 3;
const PHOTO_SIZE = (SCREEN_WIDTH - spacing.xl * 2 - PHOTO_GAP * (PHOTO_COLS - 1)) / PHOTO_COLS;

export default function UserProfileScreen() {
  const { id: userId } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const isRu = i18n.language === 'ru';
  const isOwnProfile = userId === session?.user.id;

  const { data: profile } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, age_range, avatar_url, interests, is_verified')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: photos = [] } = useProfilePhotos(userId);
  const { data: hasAccess } = usePhotoAccessStatus(userId);

  const publicPhotos = photos.filter((p) => p.is_public);
  const privatePhotos = photos.filter((p) => !p.is_public);
  const visiblePrivatePhotos = hasAccess ? privatePhotos : [];
  const hiddenCount = hasAccess ? 0 : privatePhotos.length;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/map' as any)}
          style={s.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={c.text.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {profile?.nickname || '...'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Avatar + info */}
      <View style={s.profileSection}>
        <LinearGradient
          colors={c.gradient.primary as unknown as [string, string]}
          style={s.avatarGradient}
        >
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, { backgroundColor: c.bg.secondary, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={s.avatarInitial}>
                {(profile?.nickname || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </LinearGradient>

        <Text style={s.nickname}>{profile?.nickname}</Text>

        {profile?.age_range && (
          <Text style={s.ageRange}>{profile.age_range}</Text>
        )}

        {profile?.interests && profile.interests.length > 0 && (
          <View style={s.interests}>
            {profile.interests.map((interest: string) => (
              <Tag key={interest} label={t(`interests.${interest}`, { defaultValue: interest })} variant="intention" />
            ))}
          </View>
        )}
      </View>

      {/* Photos */}
      {(publicPhotos.length > 0 || visiblePrivatePhotos.length > 0 || hiddenCount > 0) && (
        <View style={s.photosSection}>
          <Text style={s.sectionTitle}>
            {isRu ? 'Фото' : 'Photos'}
          </Text>

          <View style={s.grid}>
            {publicPhotos.map((photo) => (
              <View key={photo.id} style={s.photoCard}>
                <Image source={{ uri: photo.photo_url }} style={s.photoImage} />
              </View>
            ))}

            {visiblePrivatePhotos.map((photo) => (
              <View key={photo.id} style={s.photoCard}>
                <Image source={{ uri: photo.photo_url }} style={s.photoImage} />
                <View style={s.privateBadge}>
                  <Ionicons name="lock-open" size={10} color="#FFF" />
                </View>
              </View>
            ))}

            {hiddenCount > 0 && (
              <View style={[s.photoCard, s.hiddenCard]}>
                <Ionicons name="lock-closed" size={28} color={c.text.tertiary} />
                <Text style={s.hiddenText}>+{hiddenCount}</Text>
                <Text style={s.hiddenHint}>
                  {isRu ? 'Приватные' : 'Private'}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.md,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
      flex: 1, textAlign: 'center',
      fontSize: typography.size.headingMd, fontWeight: typography.weight.extrabold,
      color: c.text.primary,
    },
    profileSection: { alignItems: 'center', marginBottom: spacing.xl },
    avatarGradient: {
      width: 120, height: 120, borderRadius: 60,
      alignItems: 'center', justifyContent: 'center', padding: 3,
      marginBottom: spacing.lg,
    },
    avatar: {
      width: 114, height: 114, borderRadius: 57,
      borderWidth: 3, borderColor: c.bg.primary,
    },
    avatarInitial: {
      color: c.text.primary, fontSize: 44, fontWeight: '700' as const,
    },
    nickname: {
      fontSize: typography.size.headingLg, fontWeight: typography.weight.extrabold,
      color: c.text.primary, marginBottom: spacing.xs,
    },
    ageRange: {
      fontSize: typography.size.bodyMd, color: c.text.secondary, marginBottom: spacing.md,
    },
    interests: {
      flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
      justifyContent: 'center', paddingHorizontal: spacing['3xl'],
    },
    photosSection: { paddingHorizontal: spacing.xl },
    sectionTitle: {
      fontSize: typography.size.label, fontWeight: typography.weight.semibold,
      color: c.text.secondary, textTransform: 'uppercase', letterSpacing: 1,
      marginBottom: spacing.md,
    },
    grid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: PHOTO_GAP,
    },
    photoCard: {
      width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: radius.md,
      overflow: 'hidden', borderWidth: 1, borderColor,
    },
    photoImage: { width: '100%', height: '100%' },
    privateBadge: {
      position: 'absolute', top: 4, right: 4,
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: 'rgba(0,229,160,0.7)', alignItems: 'center', justifyContent: 'center',
    },
    hiddenCard: {
      alignItems: 'center', justifyContent: 'center', gap: 4,
      backgroundColor: c.bg.secondary,
    },
    hiddenText: {
      color: c.text.tertiary, fontSize: typography.size.bodyLg,
      fontWeight: typography.weight.bold,
    },
    hiddenHint: {
      color: c.text.tertiary, fontSize: typography.size.micro,
    },
  });
}
