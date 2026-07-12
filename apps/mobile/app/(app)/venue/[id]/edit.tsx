import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VenueAccessFields } from '@/components/venue/VenueAccessFields';
import { VENUE_EMOJI, VENUE_TYPE_KEYS } from '@/lib/venue-constants';
import { haptic } from '@/lib/haptics';
import { toggleCheckinMethod, toggleCheckoutPolicy } from '@/lib/checkin-options';
import {
  DEFAULT_CHECKIN_METHODS,
  DEFAULT_CHECKOUT_POLICY,
  type CheckinMethod,
  type CheckoutPolicy,
} from '@eyestalk/shared/constants';
import { useTheme, typography, spacing, radius, type ThemeColors } from '@/theme';

export default function EditVenueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const session = useAuthStore((st) => st.session);
  const queryClient = useQueryClient();

  const { data: venue, isLoading } = useQuery({
    queryKey: ['venue-edit', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('id, owner_id, name, type, description, venue_kind, checkin_methods, checkout_policy')
        .eq('id', id)
        .single();
      if (error) throw error;
      // The check-in code lives in venue_secrets (owner-readable via RLS).
      const { data: secret } = await supabase
        .from('venue_secrets')
        .select('checkin_code')
        .eq('venue_id', id)
        .maybeSingle();
      return { ...(data as any), checkin_code: (secret as any)?.checkin_code ?? '' };
    },
  });

  const [name, setName] = useState('');
  const [type, setType] = useState('other');
  const [description, setDescription] = useState('');
  const [checkinMethods, setCheckinMethods] = useState<CheckinMethod[]>([...DEFAULT_CHECKIN_METHODS]);
  const [checkoutPolicy, setCheckoutPolicy] = useState<CheckoutPolicy[]>([...DEFAULT_CHECKOUT_POLICY]);
  const [checkinCode, setCheckinCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const isOwner = !!session && venue?.owner_id === session.user.id;
  const isPopup = venue?.venue_kind === 'popup';

  // Seed the form from the loaded venue exactly once.
  useEffect(() => {
    if (!venue || seeded) return;
    setName(venue.name ?? '');
    setType(venue.type ?? 'other');
    setDescription(venue.description ?? '');
    const m = Array.isArray(venue.checkin_methods) && venue.checkin_methods.length > 0
      ? (venue.checkin_methods as CheckinMethod[])
      : [...DEFAULT_CHECKIN_METHODS];
    setCheckinMethods(m);
    const p = Array.isArray(venue.checkout_policy) && venue.checkout_policy.length > 0
      ? (venue.checkout_policy as CheckoutPolicy[])
      : [...DEFAULT_CHECKOUT_POLICY];
    setCheckoutPolicy(p);
    setCheckinCode(venue.checkin_code ?? '');
    setSeeded(true);
  }, [venue, seeded]);

  const codeRequiredButMissing =
    checkinMethods.includes('code') && checkinCode.trim().length < 3;

  const canSubmit =
    !!venue &&
    isOwner &&
    name.trim().length >= 2 &&
    checkinMethods.length >= 1 &&
    !codeRequiredButMissing &&
    !saving;

  const handleSave = async () => {
    if (!venue || !isOwner) return;
    setSaving(true);
    haptic.medium();

    const policy = isPopup
      ? checkoutPolicy
      : checkoutPolicy.filter((p) => p !== 'venue_close');

    const { error } = await supabase
      .from('venues')
      .update({
        name: name.trim(),
        type,
        description: description.trim() || null,
        checkin_methods: checkinMethods,
        checkout_policy: policy.length > 0 ? policy : [...DEFAULT_CHECKOUT_POLICY],
      } as any)
      .eq('id', venue.id);

    if (error) {
      setSaving(false);
      haptic.error();
      Alert.alert(t('common.error'), error.message);
      return;
    }

    if (checkinMethods.includes('code') && checkinCode.trim()) {
      await supabase
        .from('venue_secrets')
        .upsert({ venue_id: venue.id, checkin_code: checkinCode.trim() } as any);
    }

    setSaving(false);
    haptic.success();
    queryClient.invalidateQueries({ queryKey: ['venue', venue.id] });
    queryClient.invalidateQueries({ queryKey: ['venue-edit', venue.id] });
    queryClient.invalidateQueries({ queryKey: ['venues'] });
    Alert.alert(t('editVenue.savedTitle'), t('editVenue.savedBody'), [
      { text: t('common.ok'), onPress: () => router.back() },
    ]);
  };

  if (isLoading) {
    return (
      <View style={s.container}>
        <ScreenHeader title={t('editVenue.title')} />
        <View style={s.centered}>
          <Text style={s.mutedText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (!venue || !isOwner) {
    return (
      <View style={s.container}>
        <ScreenHeader title={t('editVenue.title')} />
        <View style={s.centered}>
          <Text style={s.mutedText}>{t('editVenue.notOwner')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScreenHeader title={t('editVenue.title')} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Input
          label={t('createVenue.name')}
          value={name}
          onChangeText={setName}
          placeholder={t('createVenue.namePlaceholder')}
          maxLength={100}
        />

        <View style={s.section}>
          <Text style={s.sectionLabel}>{t('createVenue.type')}</Text>
          <View style={s.chipRow}>
            {VENUE_TYPE_KEYS.map((vt) => (
              <TouchableOpacity
                key={vt}
                style={[s.chip, type === vt && s.chipActive]}
                onPress={() => setType(vt)}
              >
                <Text style={[s.chipText, type === vt && s.chipTextActive]}>
                  {VENUE_EMOJI[vt]} {t(`venueTypes.${vt}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Input
          label={t('createVenue.description')}
          value={description}
          onChangeText={setDescription}
          placeholder={t('createVenue.descriptionPlaceholder')}
          multiline
          numberOfLines={3}
          style={{ height: 88, paddingTop: 12, textAlignVertical: 'top' }}
          maxLength={500}
        />

        <VenueAccessFields
          methods={checkinMethods}
          onToggleMethod={(m) => setCheckinMethods((cur) => toggleCheckinMethod(cur, m))}
          checkoutPolicy={checkoutPolicy}
          onTogglePolicy={(p) => setCheckoutPolicy((cur) => toggleCheckoutPolicy(cur, p))}
          code={checkinCode}
          onChangeCode={setCheckinCode}
          allowVenueClose={isPopup}
        />

        <Button
          title={t('editVenue.save')}
          onPress={handleSave}
          disabled={!canSubmit}
          loading={saving}
        />
      </ScrollView>
    </View>
  );
}

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },
    scroll: { padding: spacing.xl, paddingBottom: 120 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    mutedText: { color: c.text.secondary, fontSize: typography.size.bodyMd, textAlign: 'center' },
    section: { marginBottom: spacing.lg },
    sectionLabel: {
      color: c.text.secondary,
      fontSize: typography.size.bodySm,
      fontWeight: typography.weight.semibold,
      marginBottom: spacing.sm,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor,
      backgroundColor: c.bg.secondary,
    },
    chipActive: {
      borderColor: c.accent.primary,
      backgroundColor: isDark ? 'rgba(124,111,247,0.16)' : 'rgba(124,111,247,0.10)',
    },
    chipText: { color: c.text.secondary, fontSize: typography.size.bodySm },
    chipTextActive: { color: c.accent.primaryLight, fontWeight: typography.weight.semibold },
  });
}
