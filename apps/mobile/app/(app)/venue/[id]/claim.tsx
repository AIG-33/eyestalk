import { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { useLocation } from '@/hooks/use-location';
import { useVenueDetail } from '@/hooks/use-venues';
import { getDistanceMeters, formatDistance } from '@/lib/geo';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { haptic } from '@/lib/haptics';
import { useTheme, typography, spacing, radius, type ThemeColors } from '@/theme';

/** The claimant must physically be at (or right next to) the venue. */
const CLAIM_MAX_DISTANCE_METERS = 200;

export default function ClaimVenueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const session = useAuthStore((st) => st.session);
  const { location } = useLocation();
  const queryClient = useQueryClient();

  const { data: venue } = useVenueDetail(id);

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [proof, setProof] = useState<{ base64: string; uri: string; ext: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: existingClaim, isLoading: claimLoading } = useQuery({
    queryKey: ['venue-claim', id, session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_claims')
        .select('id, status, created_at')
        .eq('venue_id', id)
        .eq('user_id', session!.user.id)
        .eq('status', 'pending')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!session,
  });

  const distance = useMemo(() => {
    if (!location || !venue) return null;
    return getDistanceMeters(
      location.latitude, location.longitude,
      Number((venue as any).latitude), Number((venue as any).longitude),
    );
  }, [location, venue]);

  const isAtVenue = distance !== null && distance <= CLAIM_MAX_DISTANCE_METERS;
  const canSubmit =
    !!session && isAtVenue && !!proof &&
    (phone.trim().length >= 5 || email.trim().length >= 5) &&
    !submitting;

  const pickProof = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) return;
    const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
    setProof({ base64: asset.base64, uri: asset.uri, ext: ext === 'jpg' ? 'jpeg' : ext });
  };

  const handleSubmit = async () => {
    if (!session || !proof || distance === null) return;
    setSubmitting(true);
    haptic.medium();

    try {
      const filePath = `${session.user.id}/${id}_${Date.now()}.${proof.ext}`;
      const { error: uploadError } = await supabase.storage
        .from('claim-proofs')
        .upload(filePath, decode(proof.base64), { contentType: `image/${proof.ext}` });
      if (uploadError) throw uploadError;

      const { error } = await supabase.from('venue_claims').insert({
        venue_id: id,
        user_id: session.user.id,
        contact_phone: phone.trim() || null,
        contact_email: email.trim() || null,
        message: message.trim() || null,
        proof_path: filePath,
        distance_m: Math.round(distance),
      } as any);
      if (error) throw error;

      haptic.success();
      queryClient.invalidateQueries({ queryKey: ['venue-claim', id] });
      Alert.alert(
        t('claimVenue.submittedTitle'),
        t('claimVenue.submittedBody'),
        [{ text: t('common.ok', { defaultValue: 'OK' }), onPress: () => router.back() }],
      );
    } catch (err: any) {
      haptic.error();
      Alert.alert(t('common.error'), err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return (
      <View style={s.container}>
        <ScreenHeader title={t('claimVenue.title')} />
        <View style={s.centered}>
          <Text style={s.hintText}>{t('claimVenue.signInRequired')}</Text>
        </View>
      </View>
    );
  }

  if (existingClaim) {
    return (
      <View style={s.container}>
        <ScreenHeader title={t('claimVenue.title')} />
        <View style={s.centered}>
          <Text style={s.pendingEmoji}>⏳</Text>
          <Text style={s.pendingTitle}>{t('claimVenue.pendingTitle')}</Text>
          <Text style={s.hintText}>{t('claimVenue.pendingBody')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScreenHeader title={t('claimVenue.title')} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.venueName}>{(venue as any)?.name ?? ''}</Text>
        <Text style={s.intro}>{t('claimVenue.intro')}</Text>

        {/* Presence check: you must be standing at the venue to claim it */}
        <View style={[s.presenceCard, isAtVenue && s.presenceCardOk]}>
          <Ionicons
            name={isAtVenue ? 'checkmark-circle' : 'location-outline'}
            size={22}
            color={isAtVenue ? c.accent.success : c.accent.warning}
          />
          <Text style={s.presenceText}>
            {distance === null
              ? t('claimVenue.locating')
              : isAtVenue
                ? t('claimVenue.atVenue')
                : t('claimVenue.tooFar', { distance: formatDistance(distance) })}
          </Text>
        </View>

        <Input
          label={t('claimVenue.phone')}
          value={phone}
          onChangeText={setPhone}
          placeholder="+971 50 123 4567"
          keyboardType="phone-pad"
          maxLength={30}
        />
        <Input
          label={t('claimVenue.email')}
          value={email}
          onChangeText={setEmail}
          placeholder="owner@venue.com"
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={200}
        />
        <Input
          label={t('claimVenue.message')}
          value={message}
          onChangeText={setMessage}
          placeholder={t('claimVenue.messagePlaceholder')}
          multiline
          numberOfLines={3}
          style={{ height: 88, paddingTop: 12, textAlignVertical: 'top' }}
          maxLength={500}
        />

        {/* Proof photo: business license, utility bill, staff badge, etc. */}
        <Text style={s.sectionLabel}>{t('claimVenue.proof')}</Text>
        <Text style={s.proofHint}>{t('claimVenue.proofHint')}</Text>
        <TouchableOpacity style={s.proofCard} onPress={pickProof} activeOpacity={0.8}>
          {proof ? (
            <Image source={{ uri: proof.uri }} style={s.proofImage} />
          ) : (
            <View style={s.proofPlaceholder}>
              <Ionicons name="camera-outline" size={32} color={c.text.tertiary} />
              <Text style={s.proofPlaceholderText}>{t('claimVenue.addProof')}</Text>
            </View>
          )}
        </TouchableOpacity>

        <Button
          title={t('claimVenue.submit')}
          onPress={handleSubmit}
          disabled={!canSubmit || claimLoading}
          loading={submitting}
        />
        <Text style={s.footnote}>{t('claimVenue.footnote')}</Text>
      </ScrollView>
    </View>
  );
}

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },
    centered: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      padding: spacing.xl, gap: spacing.md,
    },
    scroll: { padding: spacing.xl, paddingBottom: 120 },
    venueName: {
      fontSize: typography.size.headingLg, fontWeight: typography.weight.extrabold,
      color: c.text.primary, marginBottom: spacing.sm,
    },
    intro: {
      color: c.text.secondary, fontSize: typography.size.bodyMd,
      lineHeight: typography.size.bodyMd * 1.5, marginBottom: spacing.xl,
    },
    presenceCard: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      padding: spacing.lg, borderRadius: radius.lg,
      backgroundColor: isDark ? 'rgba(255,217,61,0.08)' : 'rgba(255,190,0,0.08)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,217,61,0.25)' : 'rgba(200,150,0,0.25)',
      marginBottom: spacing.xl,
    },
    presenceCardOk: {
      backgroundColor: isDark ? 'rgba(0,229,160,0.08)' : 'rgba(0,201,141,0.08)',
      borderColor: isDark ? 'rgba(0,229,160,0.25)' : 'rgba(0,201,141,0.25)',
    },
    presenceText: {
      flex: 1, color: c.text.secondary, fontSize: typography.size.bodyMd,
      lineHeight: typography.size.bodyMd * 1.4,
    },
    sectionLabel: {
      color: c.text.secondary, fontSize: typography.size.bodySm,
      fontWeight: typography.weight.semibold, marginBottom: spacing.xs,
    },
    proofHint: {
      color: c.text.tertiary, fontSize: typography.size.bodySm,
      lineHeight: typography.size.bodySm * 1.4, marginBottom: spacing.sm,
    },
    proofCard: {
      borderRadius: radius.xl, overflow: 'hidden',
      borderWidth: 1.5, borderColor, borderStyle: 'dashed',
      backgroundColor: c.bg.secondary, marginBottom: spacing.xl,
    },
    proofImage: { width: '100%', height: 200 },
    proofPlaceholder: {
      height: 140, alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    },
    proofPlaceholderText: {
      color: c.text.tertiary, fontSize: typography.size.bodyMd,
    },
    pendingEmoji: { fontSize: 48 },
    pendingTitle: {
      color: c.text.primary, fontSize: typography.size.headingMd,
      fontWeight: typography.weight.bold,
    },
    hintText: {
      color: c.text.secondary, fontSize: typography.size.bodyMd,
      textAlign: 'center', lineHeight: typography.size.bodyMd * 1.5,
    },
    footnote: {
      marginTop: spacing.lg, color: c.text.tertiary,
      fontSize: typography.size.bodySm, textAlign: 'center',
      lineHeight: typography.size.bodySm * 1.5,
    },
  });
}
