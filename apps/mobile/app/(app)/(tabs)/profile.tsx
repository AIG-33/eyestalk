import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/stores/auth.store';
import { useProfile, useUploadAvatar } from '@/hooks/use-profile';
import { useActiveCheckin } from '@/hooks/use-checkin';
import { supabase } from '@/lib/supabase';
import { Tag } from '@/components/ui/tag';
import { colors, typography, spacing, shadows, radius, component } from '@/theme';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const clearSession = useAuthStore((s) => s.clearSession);
  const { data: profile } = useProfile();
  const { data: activeCheckin } = useActiveCheckin();
  const uploadAvatar = useUploadAvatar();

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
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Ambient background */}
      <LinearGradient
        colors={['rgba(124,111,247,0.08)', 'transparent']}
        style={styles.ambientGlow}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push('/(app)/settings' as any)}
        >
          <Ionicons name="settings-outline" size={22} color={colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/(app)/edit-profile' as any)}
        >
          <Ionicons name="create-outline" size={22} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Avatar XL with gradient ring */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarOuter}>
          <LinearGradient
            colors={colors.gradient.primary}
            style={styles.avatarRing}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
              />
            ) : (
              <View style={[styles.avatarFallback, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
                <Text style={styles.avatarInitial}>
                  {(profile?.nickname || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </LinearGradient>
          <View style={styles.cameraOverlay}>
            <Ionicons name="camera" size={16} color="#FFF" />
          </View>
        </TouchableOpacity>

        <Text style={styles.nickname}>{profile?.nickname || '...'}</Text>
        <Text style={styles.email}>{session?.user.email}</Text>

        {/* Intention tags */}
        {profile?.interests && profile.interests.length > 0 && (
          <View style={styles.tagRow}>
            {profile.interests.map((interest) => (
              <Tag
                key={interest}
                label={t(`interests.${interest}`, { defaultValue: interest })}
                variant="intention"
              />
            ))}
          </View>
        )}
      </View>

      {/* Bento stats row */}
      <View style={styles.bentoRow}>
        <TouchableOpacity
          style={[styles.bentoCard, styles.bentoLarge]}
          onPress={() => router.push('/(app)/tokens' as any)}
        >
          <Text style={styles.bentoLabel}>{t('profile.tokenBalance')}</Text>
          <Text style={styles.bentoValue}>🪙 {profile?.token_balance || 0}</Text>
          <Text style={styles.bentoHintText}>{t('profile.tapToViewTokens')}</Text>
        </TouchableOpacity>
      </View>

      {/* Active check-in */}
      {activeCheckin && (
        <TouchableOpacity
          style={styles.checkinCard}
          onPress={() => router.push(`/(app)/venue/${activeCheckin.venue_id}` as any)}
        >
          <View style={[styles.checkinDot, shadows.glowSuccess]} />
          <Text style={styles.checkinText}>
            {t('venue.checkedIn')} — {(activeCheckin as any).venues?.name}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.accent.success} />
        </TouchableOpacity>
      )}

      {/* Menu */}
      <View style={styles.menuSection}>
        <MenuItem
          icon="create-outline"
          label={t('profile.editProfile')}
          hint={t('profile.editProfileHint')}
          onPress={() => router.push('/(app)/edit-profile' as any)}
        />
        <MenuItem
          icon="wallet-outline"
          label={t('profile.tokens')}
          hint={t('profile.tokenBalanceHint')}
          value={`${profile?.token_balance || 0}`}
          onPress={() => router.push('/(app)/tokens' as any)}
        />
        <MenuItem
          icon="globe-outline"
          label={t('profile.language')}
          hint={t('profile.languageHint')}
          value={i18n.language === 'ru' ? 'Русский' : 'English'}
          onPress={toggleLanguage}
        />
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color={colors.accent.error} />
        <Text style={styles.signOutText}>{t('auth.signOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MenuItem({ icon, label, value, hint, onPress }: {
  icon: string; label: string; value?: string; hint?: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={20} color={colors.text.secondary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.menuLabel}>{label}</Text>
        {hint && <Text style={styles.menuHint}>{hint}</Text>}
      </View>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  scroll: { paddingBottom: 40 },
  ambientGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 250,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 56, paddingHorizontal: spacing.xl,
  },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bg.secondary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  editBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bg.secondary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  avatarSection: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing['2xl'] },
  avatarOuter: { position: 'relative', marginBottom: spacing.lg },
  avatarRing: {
    width: 130, height: 130, borderRadius: 65,
    alignItems: 'center', justifyContent: 'center',
    padding: 3,
  },
  avatar: { borderWidth: 3, borderColor: colors.bg.primary },
  avatarFallback: {
    backgroundColor: colors.bg.secondary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.bg.primary,
  },
  avatarInitial: { color: colors.text.primary, fontSize: 44, fontWeight: '700' },
  cameraOverlay: {
    position: 'absolute', bottom: 4, right: 4,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.accent.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.bg.primary,
    ...shadows.glowPrimary,
  },
  nickname: {
    fontSize: typography.size.headingLg, fontWeight: typography.weight.extrabold,
    color: colors.text.primary, marginBottom: spacing.xs,
  },
  email: {
    fontSize: typography.size.bodySm, color: colors.text.secondary, marginBottom: spacing.md,
  },
  tagRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  bentoRow: {
    paddingHorizontal: spacing.xl, marginBottom: spacing.md,
  },
  bentoCard: {
    backgroundColor: colors.bg.secondary, borderRadius: radius.xl,
    padding: spacing.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  bentoLarge: {
    borderColor: 'rgba(124,111,247,0.2)',
  },
  bentoLabel: {
    fontSize: typography.size.bodySm, color: colors.text.secondary, marginBottom: spacing.sm,
    textTransform: 'uppercase', letterSpacing: typography.letterSpacing.caps,
    fontWeight: typography.weight.semibold,
  },
  bentoValue: {
    fontSize: typography.size.displayLg, fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
  },
  bentoHintText: {
    fontSize: typography.size.bodySm, color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  checkinCard: {
    marginHorizontal: spacing.xl, padding: spacing.lg,
    backgroundColor: 'rgba(0,229,160,0.06)', borderRadius: radius.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1, borderColor: 'rgba(0,229,160,0.15)',
  },
  checkinDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent.success,
  },
  checkinText: {
    flex: 1, color: colors.accent.success,
    fontSize: typography.size.bodyMd, fontWeight: typography.weight.semibold,
  },
  menuSection: {
    marginHorizontal: spacing.xl, backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  menuLabel: {
    fontSize: typography.size.bodyLg, color: colors.text.primary,
    fontWeight: typography.weight.medium,
  },
  menuHint: {
    fontSize: typography.size.bodySm, color: colors.text.tertiary,
    marginTop: 2, lineHeight: typography.size.bodySm * 1.4,
  },
  menuValue: {
    fontSize: typography.size.bodyMd, color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  signOutBtn: {
    marginHorizontal: spacing.xl, padding: spacing.lg,
    backgroundColor: colors.bg.secondary, borderRadius: radius.xl,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(255,71,87,0.15)',
  },
  signOutText: {
    color: colors.accent.error, fontSize: typography.size.bodyLg,
    fontWeight: typography.weight.semibold,
  },
});
