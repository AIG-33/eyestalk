import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, Image,
  TouchableOpacity, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/use-profile';
import { AGE_RANGES, INTEREST_OPTIONS, MAX_INTERESTS } from '@eyestalk/shared/constants';
import { useTheme, typography, spacing, shadows, radius, component } from '@/theme';
import type { ThemeColors } from '@/theme';

const MAX_BIO = 300;

export default function EditProfileScreen() {
  const { t, i18n } = useTranslation();
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const isRu = i18n.language === 'ru';
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname);
      setBio(profile.bio || '');
      setAgeRange(profile.age_range);
      setInterests(profile.interests || []);
    }
  }, [profile]);

  const handleAvatarPress = () => {
    uploadAvatar.mutate(undefined, {
      onError: (err) => {
        if (err.message !== 'cancelled') Alert.alert(t('common.error'), err.message);
      },
    });
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) => {
      if (prev.includes(interest)) return prev.filter((i) => i !== interest);
      if (prev.length >= MAX_INTERESTS) return prev;
      return [...prev, interest];
    });
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert(isRu ? 'Ошибка' : 'Error', isRu ? 'Никнейм не может быть пустым' : 'Nickname cannot be empty');
      return;
    }
    const payload = {
      nickname: nickname.trim(),
      age_range: ageRange,
      interests,
      bio: bio.trim() || null,
    };
    updateProfile.mutate(payload, {
      onSuccess: () => {
        Alert.alert(
          t('profile.saved'),
          '',
          [{ text: 'OK', onPress: () => router.canGoBack() ? router.back() : router.replace('/(app)/map') }],
        );
      },
      onError: (err: any) => Alert.alert(isRu ? 'Ошибка' : 'Error', err.message),
    });
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/map')} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={c.text.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('profile.editProfile')}</Text>
        <TouchableOpacity onPress={handleSave} disabled={updateProfile.isPending}>
          <Text style={[s.saveText, updateProfile.isPending && { opacity: 0.4 }]}>
            {isRu ? 'Сохранить' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Avatar */}
        <View style={s.avatarSection}>
          <TouchableOpacity onPress={handleAvatarPress} style={{ position: 'relative', marginBottom: spacing.md }}>
            <LinearGradient
              colors={c.gradient.primary as unknown as [string, string]}
              style={s.avatarRing}
            >
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={s.avatarImage} />
              ) : (
                <View style={s.avatarFallback}>
                  <Text style={s.avatarInitial}>
                    {(profile?.nickname || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </LinearGradient>
            <View style={s.cameraOverlay}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={s.changePhotoText}>{t('profile.changeAvatar')}</Text>
          {uploadAvatar.isPending && (
            <Text style={s.uploadingText}>{t('common.loading')}</Text>
          )}
        </View>

        {/* Nickname */}
        <View style={s.section}>
          <Text style={s.label}>{t('profile.nickname')}</Text>
          <TextInput
            style={s.input}
            value={nickname}
            onChangeText={setNickname}
            maxLength={30}
            placeholderTextColor={c.text.tertiary}
            placeholder={isRu ? 'Ваш никнейм' : 'Your nickname'}
          />
        </View>

        {/* Bio */}
        <View style={s.section}>
          <Text style={s.label}>{isRu ? 'О себе' : 'About me'}</Text>
          <Text style={s.fieldHint}>
            {isRu
              ? 'Расскажите немного о себе — это поможет людям узнать вас'
              : 'Tell a little about yourself — it helps people get to know you'}
          </Text>
          <TextInput
            style={[s.input, s.textArea]}
            value={bio}
            onChangeText={setBio}
            maxLength={MAX_BIO}
            multiline
            numberOfLines={4}
            placeholderTextColor={c.text.tertiary}
            placeholder={isRu ? 'Напишите что-нибудь о себе...' : 'Write something about yourself...'}
            textAlignVertical="top"
          />
          <Text style={s.charCount}>{bio.length}/{MAX_BIO}</Text>
        </View>

        {/* Age Range */}
        <View style={s.section}>
          <Text style={s.label}>{t('profile.ageRange')}</Text>
          <View style={s.chipGrid}>
            {AGE_RANGES.map((range) => (
              <TouchableOpacity
                key={range}
                style={[s.chip, ageRange === range && s.chipActive]}
                onPress={() => setAgeRange(range)}
              >
                <Text style={[s.chipText, ageRange === range && s.chipTextActive]}>
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Interests */}
        <View style={s.section}>
          <Text style={s.label}>
            {t('profile.interests')} ({interests.length}/{MAX_INTERESTS})
          </Text>
          <Text style={s.fieldHint}>{t('profile.interestsHint')}</Text>
          <View style={s.chipGrid}>
            {INTEREST_OPTIONS.map((interest) => (
              <TouchableOpacity
                key={interest}
                style={[s.chip, interests.includes(interest) && s.chipActive]}
                onPress={() => toggleInterest(interest)}
              >
                <Text style={[s.chipText, interests.includes(interest) && s.chipTextActive]}>
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

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingTop: 52, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
      borderBottomWidth: 1, borderBottomColor: borderColor,
    },
    backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    headerTitle: {
      fontSize: typography.size.headingMd, fontWeight: typography.weight.bold,
      color: c.text.primary,
    },
    saveText: {
      color: c.accent.primary, fontSize: typography.size.headingSm,
      fontWeight: typography.weight.bold,
    },
    avatarSection: { alignItems: 'center', marginBottom: spacing['2xl'] },
    avatarRing: {
      width: component.avatar.xl + 8, height: component.avatar.xl + 8,
      borderRadius: (component.avatar.xl + 8) / 2,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarImage: {
      width: component.avatar.xl, height: component.avatar.xl,
      borderRadius: component.avatar.xl / 2,
      borderWidth: 3, borderColor: c.bg.primary,
    },
    avatarFallback: {
      width: component.avatar.xl, height: component.avatar.xl,
      borderRadius: component.avatar.xl / 2,
      backgroundColor: c.bg.tertiary,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 3, borderColor: c.bg.primary,
    },
    avatarInitial: {
      fontSize: 36, fontWeight: typography.weight.bold, color: c.text.primary,
    },
    cameraOverlay: {
      position: 'absolute', bottom: 2, right: 2,
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: c.accent.primary,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: c.bg.primary,
    },
    changePhotoText: {
      fontSize: typography.size.bodyMd, color: c.accent.primary,
      fontWeight: typography.weight.semibold,
    },
    uploadingText: {
      fontSize: typography.size.bodySm, color: c.accent.warning, marginTop: spacing.sm,
    },
    content: { padding: spacing.xl, paddingBottom: 60 },
    section: { marginBottom: spacing['2xl'] },
    label: {
      fontSize: typography.size.label, fontWeight: typography.weight.semibold,
      color: c.text.secondary, marginBottom: spacing.sm,
      textTransform: 'uppercase', letterSpacing: 1,
    },
    fieldHint: {
      fontSize: typography.size.bodySm, color: c.text.tertiary,
      marginBottom: spacing.md, lineHeight: typography.size.bodySm * 1.5,
    },
    input: {
      height: 52, backgroundColor: c.bg.tertiary,
      borderWidth: 1, borderColor: c.bg.surface,
      borderRadius: radius.lg, paddingHorizontal: spacing.lg,
      fontSize: typography.size.bodyLg, color: c.text.primary,
    },
    textArea: {
      height: 120, paddingTop: spacing.md, paddingBottom: spacing.md,
      textAlignVertical: 'top',
    },
    charCount: {
      fontSize: typography.size.micro, color: c.text.tertiary,
      textAlign: 'right', marginTop: spacing.xs,
    },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
      borderRadius: radius.full, backgroundColor: c.bg.tertiary,
      borderWidth: 1, borderColor: c.bg.surface,
    },
    chipActive: {
      backgroundColor: c.accent.primary, borderColor: c.accent.primary,
      ...shadows.glowPrimary,
    },
    chipText: {
      color: c.text.secondary, fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.medium,
    },
    chipTextActive: { color: '#FFFFFF' },
  });
}
