import { View, Text, TouchableOpacity, ScrollView, Image, Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/auth.store';
import { useProfile, useUploadAvatar } from '@/hooks/use-profile';
import { useActiveCheckin } from '@/hooks/use-checkin';
import { useProfilePhotos } from '@/hooks/use-photos';
import { supabase } from '@/lib/supabase';
import { Tag } from '@/components/ui/tag';
import { useTheme, typography, spacing, shadows, radius, component } from '@/theme';
import { useUIStore } from '@/stores/ui.store';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { c, isDark } = useTheme();
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const session = useAuthStore((s) => s.session);
  const clearSession = useAuthStore((s) => s.clearSession);
  const { data: profile } = useProfile();
  const { data: activeCheckin } = useActiveCheckin();
  const uploadAvatar = useUploadAvatar();
  const { data: photos = [] } = useProfilePhotos(session?.user.id);

  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const borderColorFaint = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clearSession();
    router.replace('/(auth)/sign-in');
  };

  const handleAvatarPress = () => {
    uploadAvatar.mutate(undefined, {
      onError: (err) => {
        if (err.message !== 'cancelled') Alert.alert(t('common.error'), err.message);
      },
    });
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ru' ? 'en' : 'ru');
  };

  const avatarSize = component.avatar.xl;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg.primary }} contentContainerStyle={{ paddingBottom: 40 }}>
      <LinearGradient
        colors={[isDark ? 'rgba(124,111,247,0.08)' : 'rgba(108,92,231,0.06)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 250 }}
      />

      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: spacing.xl }}>
        <TouchableOpacity
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.bg.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor }}
          onPress={() => router.push('/(app)/settings' as any)}
        >
          <Ionicons name="settings-outline" size={22} color={c.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.bg.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor }}
          onPress={() => router.push('/(app)/edit-profile' as any)}
        >
          <Ionicons name="create-outline" size={22} color={c.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={{ alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing['2xl'] }}>
        <TouchableOpacity onPress={handleAvatarPress} style={{ position: 'relative', marginBottom: spacing.lg }}>
          <LinearGradient
            colors={c.gradient.primary as unknown as [string, string]}
            style={{ width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center', padding: 3 }}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, borderWidth: 3, borderColor: c.bg.primary }}
              />
            ) : (
              <View style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: c.bg.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: c.bg.primary }}>
                <Text style={{ color: c.text.primary, fontSize: 44, fontWeight: '700' }}>
                  {(profile?.nickname || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </LinearGradient>
          <View style={{
            position: 'absolute', bottom: 4, right: 4,
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: c.accent.primary, alignItems: 'center', justifyContent: 'center',
            borderWidth: 2, borderColor: c.bg.primary,
            ...shadows.glowPrimary,
          }}>
            <Ionicons name="camera" size={16} color="#FFF" />
          </View>
        </TouchableOpacity>

        <Text style={{ fontSize: typography.size.headingLg, fontWeight: typography.weight.extrabold, color: c.text.primary, marginBottom: spacing.xs }}>
          {profile?.nickname || '...'}
        </Text>
        <Text style={{ fontSize: typography.size.bodySm, color: c.text.secondary, marginBottom: spacing.md }}>
          {session?.user.email}
        </Text>

        {profile?.interests && profile.interests.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', paddingHorizontal: spacing['3xl'] }}>
            {profile.interests.map((interest) => (
              <Tag key={interest} label={t(`interests.${interest}`, { defaultValue: interest })} variant="intention" />
            ))}
          </View>
        )}
      </View>

      {/* Token balance */}
      <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.md }}>
        <TouchableOpacity
          style={{ backgroundColor: c.bg.secondary, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: isDark ? 'rgba(124,111,247,0.2)' : 'rgba(108,92,231,0.15)' }}
          onPress={() => router.push('/(app)/tokens' as any)}
        >
          <Text style={{ fontSize: typography.size.bodySm, color: c.text.secondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: typography.letterSpacing.caps, fontWeight: typography.weight.semibold }}>
            {t('profile.tokenBalance')}
          </Text>
          <Text style={{ fontSize: typography.size.displayLg, fontWeight: typography.weight.extrabold, color: c.text.primary }}>
            🪙 {profile?.token_balance || 0}
          </Text>
          <Text style={{ fontSize: typography.size.bodySm, color: c.text.tertiary, marginTop: spacing.sm }}>
            {t('profile.tapToViewTokens')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active check-in */}
      {activeCheckin && (
        <TouchableOpacity
          style={{
            marginHorizontal: spacing.xl, padding: spacing.lg,
            backgroundColor: 'rgba(0,229,160,0.06)', borderRadius: radius.lg,
            flexDirection: 'row', alignItems: 'center', gap: spacing.md,
            marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(0,229,160,0.15)',
          }}
          onPress={() => router.push(`/(app)/venue/${activeCheckin.venue_id}` as any)}
        >
          <View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent.success }, shadows.glowSuccess]} />
          <Text style={{ flex: 1, color: c.accent.success, fontSize: typography.size.bodyMd, fontWeight: typography.weight.semibold }}>
            {t('venue.checkedIn')} — {(activeCheckin as any).venues?.name}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={c.accent.success} />
        </TouchableOpacity>
      )}

      {/* Photo preview */}
      {photos.length > 0 && (
        <TouchableOpacity
          style={{ marginHorizontal: spacing.xl, marginBottom: spacing.md }}
          onPress={() => router.push('/(app)/my-photos' as any)}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {photos.slice(0, 4).map((photo) => (
              <View key={photo.id} style={{ flex: 1, aspectRatio: 1, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor }}>
                <Image source={{ uri: photo.photo_url }} style={{ width: '100%', height: '100%' }} />
                {!photo.is_public && (
                  <View style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="lock-closed" size={9} color="#FFF" />
                  </View>
                )}
              </View>
            ))}
            {photos.length > 4 && (
              <View style={{ flex: 1, aspectRatio: 1, borderRadius: radius.lg, backgroundColor: c.bg.secondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor }}>
                <Text style={{ color: c.text.tertiary, fontSize: typography.size.bodyMd, fontWeight: typography.weight.bold }}>+{photos.length - 4}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* Menu */}
      <View style={{ marginHorizontal: spacing.xl, backgroundColor: c.bg.secondary, borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.xl, borderWidth: 1, borderColor }}>
        <MenuItem icon="images-outline" label={i18n.language === 'ru' ? 'Мои фото' : 'My Photos'} hint={i18n.language === 'ru' ? 'Загрузите дополнительные фото' : 'Upload additional photos'} value={`${photos.length}`} onPress={() => router.push('/(app)/my-photos' as any)} c={c} borderColor={borderColorFaint} />
        <MenuItem icon="create-outline" label={t('profile.editProfile')} hint={t('profile.editProfileHint')} onPress={() => router.push('/(app)/edit-profile' as any)} c={c} borderColor={borderColorFaint} />
        <MenuItem icon="wallet-outline" label={t('profile.tokens')} hint={t('profile.tokenBalanceHint')} value={`${profile?.token_balance || 0}`} onPress={() => router.push('/(app)/tokens' as any)} c={c} borderColor={borderColorFaint} />
        <MenuItem icon="trophy-outline" label={t('achievements.title', { defaultValue: i18n.language === 'ru' ? 'Достижения' : 'Achievements' })} hint={t('achievements.profileHint', { defaultValue: i18n.language === 'ru' ? 'Бейджи, стрики и прогресс' : 'Badges, streaks, and progress' })} onPress={() => router.push('/(app)/achievements' as any)} c={c} borderColor={borderColorFaint} />
        <MenuItem
          icon={isDark ? 'moon-outline' : 'sunny-outline'}
          label={i18n.language === 'ru' ? 'Тема' : 'Theme'}
          value={isDark ? (i18n.language === 'ru' ? 'Тёмная' : 'Dark') : (i18n.language === 'ru' ? 'Светлая' : 'Light')}
          onPress={toggleTheme}
          c={c} borderColor={borderColorFaint}
        />
        <MenuItem icon="globe-outline" label={t('profile.language')} hint={t('profile.languageHint')} value={i18n.language === 'ru' ? 'Русский' : 'English'} onPress={toggleLanguage} c={c} borderColor={borderColorFaint} />
        <MenuItem icon="settings-outline" label={i18n.language === 'ru' ? 'Настройки' : 'Settings'} onPress={() => router.push('/(app)/settings' as any)} c={c} borderColor={borderColorFaint} />
        <MenuItem icon="business-outline" label={t('profile.createVenue')} hint={t('profile.createVenueHint')} onPress={() => {
          const baseUrl = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/api\/v1\/?$/, '');
          Linking.openURL(`${baseUrl}/dashboard/create-venue`);
        }} c={c} borderColor={borderColorFaint} />
      </View>

      <TouchableOpacity
        style={{
          marginHorizontal: spacing.xl, padding: spacing.lg,
          backgroundColor: c.bg.secondary, borderRadius: radius.xl,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
          borderWidth: 1, borderColor: 'rgba(255,71,87,0.15)',
        }}
        onPress={handleSignOut}
      >
        <Ionicons name="log-out-outline" size={20} color={c.accent.error} />
        <Text style={{ color: c.accent.error, fontSize: typography.size.bodyLg, fontWeight: typography.weight.semibold }}>
          {t('auth.signOut')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MenuItem({ icon, label, value, hint, onPress, c, borderColor }: {
  icon: string; label: string; value?: string; hint?: string; onPress: () => void;
  c: any; borderColor: string;
}) {
  return (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: borderColor }}
      onPress={onPress} activeOpacity={0.7}
    >
      <Ionicons name={icon as any} size={20} color={c.text.secondary} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: typography.size.bodyLg, color: c.text.primary, fontWeight: typography.weight.medium }}>{label}</Text>
        {hint && <Text style={{ fontSize: typography.size.bodySm, color: c.text.tertiary, marginTop: 2 }}>{hint}</Text>}
      </View>
      {value && <Text style={{ fontSize: typography.size.bodyMd, color: c.text.secondary, marginRight: spacing.sm }}>{value}</Text>}
      <Ionicons name="chevron-forward" size={16} color={c.text.tertiary} />
    </TouchableOpacity>
  );
}
