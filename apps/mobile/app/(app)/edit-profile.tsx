import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/use-profile';
import { AGE_RANGES, INTEREST_OPTIONS, MAX_INTERESTS } from '@eyestalk/shared/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { colors, typography, spacing, shadows, radius, component } from '@/theme';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const [nickname, setNickname] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  const handleAvatarPress = () => {
    uploadAvatar.mutate(undefined, {
      onError: (err) => {
        if (err.message !== 'cancelled') {
          Alert.alert(t('common.error'), err.message);
        }
      },
    });
  };

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname);
      setAgeRange(profile.age_range);
      setInterests(profile.interests || []);
    }
  }, [profile]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) => {
      if (prev.includes(interest)) return prev.filter((i) => i !== interest);
      if (prev.length >= MAX_INTERESTS) return prev;
      return [...prev, interest];
    });
  };

  const handleSave = () => {
    if (!nickname.trim()) return;
    updateProfile.mutate(
      { nickname: nickname.trim(), age_range: ageRange, interests },
      {
        onSuccess: () => { Alert.alert(t('profile.saved')); router.canGoBack() ? router.back() : router.replace('/(app)/map'); },
        onError: (err) => Alert.alert(t('common.error'), err.message),
      },
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/map')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.editProfile')}</Text>
        <TouchableOpacity onPress={handleSave} disabled={updateProfile.isPending}>
          <Text style={[styles.saveText, updateProfile.isPending && { opacity: 0.4 }]}>
            {t('common.save')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageHint}>{t('profile.editProfileHint')}</Text>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarOuter}>
            <LinearGradient colors={colors.gradient.primary} style={styles.avatarRing}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarFallback}>
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
          <Text style={styles.changePhotoText}>{t('profile.changeAvatar')}</Text>
          <Text style={styles.changePhotoHint}>{t('profile.changeAvatarHint')}</Text>
          {uploadAvatar.isPending && (
            <Text style={styles.uploadingText}>{t('common.loading')}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('profile.nickname')}</Text>
          <Text style={styles.fieldHint}>{t('profile.nicknameHint')}</Text>
          <Input
            value={nickname}
            onChangeText={setNickname}
            maxLength={30}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('profile.ageRange')}</Text>
          <Text style={styles.fieldHint}>{t('profile.ageRangeHint')}</Text>
          <View style={styles.chipGrid}>
            {AGE_RANGES.map((range) => (
              <TouchableOpacity
                key={range}
                style={[styles.chip, ageRange === range && styles.chipActive]}
                onPress={() => setAgeRange(range)}
              >
                <Text style={[styles.chipText, ageRange === range && styles.chipTextActive]}>
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>
            {t('profile.interests')} ({interests.length}/{MAX_INTERESTS})
          </Text>
          <Text style={styles.fieldHint}>{t('profile.interestsHint')}</Text>
          <View style={styles.chipGrid}>
            {INTEREST_OPTIONS.map((interest) => (
              <TouchableOpacity
                key={interest}
                style={[styles.chip, interests.includes(interest) && styles.chipActive]}
                onPress={() => toggleInterest(interest)}
              >
                <Text style={[styles.chipText, interests.includes(interest) && styles.chipTextActive]}>
                  {t(`interests.${interest}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontSize: typography.size.headingMd, fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  saveText: {
    color: colors.accent.primary, fontSize: typography.size.headingSm,
    fontWeight: typography.weight.bold,
  },
  avatarSection: { alignItems: 'center', marginBottom: spacing['3xl'] },
  avatarOuter: { position: 'relative', marginBottom: spacing.md },
  avatarRing: {
    width: component.avatar.xl + 8, height: component.avatar.xl + 8,
    borderRadius: (component.avatar.xl + 8) / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImage: {
    width: component.avatar.xl, height: component.avatar.xl,
    borderRadius: component.avatar.xl / 2, borderWidth: 3, borderColor: colors.bg.primary,
  },
  avatarFallback: {
    width: component.avatar.xl, height: component.avatar.xl,
    borderRadius: component.avatar.xl / 2, backgroundColor: colors.bg.tertiary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.bg.primary,
  },
  avatarInitial: {
    fontSize: 36, fontWeight: typography.weight.bold, color: colors.text.primary,
  },
  cameraOverlay: {
    position: 'absolute', bottom: 2, right: 2, width: 32, height: 32,
    borderRadius: 16, backgroundColor: colors.accent.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg.primary,
  },
  changePhotoText: {
    fontSize: typography.size.bodyMd, color: colors.accent.primary,
    fontWeight: typography.weight.semibold,
  },
  changePhotoHint: {
    fontSize: typography.size.bodySm, color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  uploadingText: {
    fontSize: typography.size.bodySm, color: colors.accent.warning, marginTop: spacing.sm,
  },
  content: { padding: spacing.xl, paddingBottom: 40 },
  pageHint: {
    fontSize: typography.size.bodyMd, color: colors.text.secondary,
    marginBottom: spacing['2xl'], lineHeight: typography.size.bodyMd * 1.5,
  },
  fieldHint: {
    fontSize: typography.size.bodySm, color: colors.text.tertiary,
    marginBottom: spacing.md, lineHeight: typography.size.bodySm * 1.4,
  },
  section: { marginBottom: spacing['2xl'] },
  label: {
    fontSize: typography.size.label, fontWeight: typography.weight.semibold,
    color: colors.text.secondary, marginBottom: spacing.md,
    textTransform: 'uppercase', letterSpacing: typography.letterSpacing.caps,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radius.full, backgroundColor: colors.bg.tertiary,
    borderWidth: 1, borderColor: colors.bg.surface,
  },
  chipActive: {
    backgroundColor: colors.accent.primary, borderColor: colors.accent.primary,
    ...shadows.glowPrimary,
  },
  chipText: {
    color: colors.text.secondary, fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.medium,
  },
  chipTextActive: { color: '#FFFFFF' },
});
