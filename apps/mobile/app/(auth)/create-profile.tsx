import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { AGE_RANGES, INTEREST_OPTIONS } from '@eyestalk/shared/constants';

export default function CreateProfileScreen() {
  const { t } = useTranslation();
  const [nickname, setNickname] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const session = useAuthStore((s) => s.session);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) return prev.filter((i) => i !== interest);
      if (prev.length >= 5) return prev;
      return [...prev, interest];
    });
  };

  const handleCreateProfile = async () => {
    if (!nickname.trim() || !ageRange) return;

    setLoading(true);
    setError('');

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: session?.user.id,
      nickname: nickname.trim(),
      age_range: ageRange,
      interests: selectedInterests,
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    router.replace('/(app)/(tabs)/map');
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>{t('profile.createTitle')}</Text>
      <Text style={styles.subtitle}>{t('profile.createSubtitle')}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>{t('profile.nickname')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('profile.nicknamePlaceholder')}
          placeholderTextColor="#999"
          value={nickname}
          onChangeText={setNickname}
          maxLength={30}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('profile.ageRange')}</Text>
        <View style={styles.chipContainer}>
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
          {t('profile.interests')} ({selectedInterests.length}/5)
        </Text>
        <View style={styles.chipContainer}>
          {INTEREST_OPTIONS.map((interest) => (
            <TouchableOpacity
              key={interest}
              style={[styles.chip, selectedInterests.includes(interest) && styles.chipActive]}
              onPress={() => toggleInterest(interest)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedInterests.includes(interest) && styles.chipTextActive,
                ]}
              >
                {t(`interests.${interest}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCreateProfile}
        disabled={loading || !nickname.trim() || !ageRange}
      >
        <Text style={styles.buttonText}>
          {loading ? t('common.loading') : t('profile.continue')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0E17',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFE',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A7A9BE',
    marginBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A7A9BE',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#1A1929',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFE',
    borderWidth: 1,
    borderColor: '#2A2940',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1A1929',
    borderWidth: 1,
    borderColor: '#2A2940',
  },
  chipActive: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  chipText: {
    color: '#A7A9BE',
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFE',
  },
  button: {
    backgroundColor: '#6C5CE7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFE',
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
});
