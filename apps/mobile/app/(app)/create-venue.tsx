import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Share,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { useLocation } from '@/hooks/use-location';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VenueLocationPicker } from '@/components/venue/VenueLocationPicker';
import { VENUE_EMOJI, VENUE_TYPE_KEYS } from '@/lib/venue-constants';
import { PRIMARY_LAUNCH_CITY } from '@/lib/launch-cities';
import { haptic } from '@/lib/haptics';
import { useTheme, typography, spacing, radius, type ThemeColors } from '@/theme';

type VenueKind = 'community' | 'popup';

const POPUP_DURATIONS = [6, 12, 24, 48] as const;
const DEFAULT_POPUP_HOURS = 24;
/** Pop-ups get a generous geofence — "my place" GPS pins are imprecise. */
const POPUP_GEOFENCE_METERS = 150;
const COMMUNITY_GEOFENCE_METERS = 75;

export default function CreateVenueScreen() {
  const { t } = useTranslation();
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const session = useAuthStore((st) => st.session);
  const { location, loading: locationLoading } = useLocation();
  const queryClient = useQueryClient();

  const [kind, setKind] = useState<VenueKind>('community');
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('other');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [popupHours, setPopupHours] = useState<number>(DEFAULT_POPUP_HOURS);
  const [saving, setSaving] = useState(false);

  // The venue point. Defaults to the user's GPS, but they can drag the map to
  // pin the exact spot (a building entrance, a specific corner, etc.).
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );

  // Seed the picked point from the user's GPS as soon as we have a fix, unless
  // they've already moved the pin themselves.
  const userMovedPin = useRef(false);
  useEffect(() => {
    if (location && !userMovedPin.current && !coords) {
      setCoords({ latitude: location.latitude, longitude: location.longitude });
    }
  }, [location, coords]);

  const pickerSeed = coords
    ?? (location
      ? { latitude: location.latitude, longitude: location.longitude }
      : { latitude: PRIMARY_LAUNCH_CITY.latitude, longitude: PRIMARY_LAUNCH_CITY.longitude });

  const canSubmit =
    !!coords && name.trim().length >= 2 && address.trim().length >= 3 && !saving;

  const shareVenue = async (venueId: string, venueName: string) => {
    try {
      await Share.share({
        message: t('createVenue.shareMessage', { name: venueName }) +
          `\nhttps://eyestalk.app/venue/${venueId}`,
      });
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const handleCreate = async () => {
    if (!session) {
      Alert.alert(
        t('auth.guestCheckinTitle'),
        t('createVenue.guestBody'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.signUp'), onPress: () => router.push('/(auth)/sign-up' as any) },
        ],
      );
      return;
    }
    if (!coords) return;
    setSaving(true);
    haptic.medium();

    const expiresAt =
      kind === 'popup'
        ? new Date(Date.now() + popupHours * 3600_000).toISOString()
        : null;

    const { data, error } = await supabase
      .from('venues')
      .insert({
        owner_id: session.user.id,
        name: name.trim(),
        type,
        description: description.trim() || null,
        address: address.trim(),
        latitude: Math.round(coords.latitude * 1e6) / 1e6,
        longitude: Math.round(coords.longitude * 1e6) / 1e6,
        geofence_radius: kind === 'popup' ? POPUP_GEOFENCE_METERS : COMMUNITY_GEOFENCE_METERS,
        venue_kind: kind,
        expires_at: expiresAt,
      } as any)
      .select('id, name')
      .single();

    setSaving(false);

    if (error) {
      haptic.error();
      Alert.alert(t('common.error'), error.message);
      return;
    }

    const created = data as unknown as { id: string; name: string };

    haptic.success();
    queryClient.invalidateQueries({ queryKey: ['venues'] });

    Alert.alert(
      t('createVenue.successTitle'),
      kind === 'popup'
        ? t('createVenue.successPopupBody', { hours: popupHours })
        : t('createVenue.successCommunityBody'),
      [
        {
          text: t('createVenue.inviteFriends'),
          onPress: async () => {
            await shareVenue(created.id, created.name);
            router.replace(`/(app)/venue/${created.id}` as any);
          },
        },
        {
          text: t('createVenue.openVenue'),
          onPress: () => router.replace(`/(app)/venue/${created.id}` as any),
        },
      ],
    );
  };

  return (
    <View style={s.container}>
      <ScreenHeader title={t('createVenue.title')} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Kind switch: permanent community place vs temporary pop-up */}
        <View style={s.kindRow}>
          <KindCard
            active={kind === 'community'}
            emoji="📍"
            title={t('createVenue.kindCommunity')}
            hint={t('createVenue.kindCommunityHint')}
            onPress={() => setKind('community')}
            s={s}
            c={c}
          />
          <KindCard
            active={kind === 'popup'}
            emoji="🎉"
            title={t('createVenue.kindPopup')}
            hint={t('createVenue.kindPopupHint')}
            onPress={() => setKind('popup')}
            s={s}
            c={c}
          />
        </View>

        {kind === 'popup' && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>{t('createVenue.popupDuration')}</Text>
            <View style={s.chipRow}>
              {POPUP_DURATIONS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[s.chip, popupHours === h && s.chipActive]}
                  onPress={() => setPopupHours(h)}
                >
                  <Text style={[s.chipText, popupHours === h && s.chipTextActive]}>
                    {t('createVenue.hours', { n: h })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

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
          label={t('createVenue.address')}
          value={address}
          onChangeText={setAddress}
          placeholder={t('createVenue.addressPlaceholder')}
          maxLength={300}
        />

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

        {/* Pick the exact venue point on the map (drag to move the pin) */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>{t('createVenue.locationOnMap')}</Text>
          {locationLoading && !coords ? (
            <View style={s.mapSkeleton}>
              <Ionicons name="location-outline" size={22} color={c.text.tertiary} />
              <Text style={s.locationText}>{t('createVenue.locationLoading')}</Text>
            </View>
          ) : (
            <>
              <VenueLocationPicker
                latitude={pickerSeed.latitude}
                longitude={pickerSeed.longitude}
                userLocation={location}
                onChange={(lat, lng) => {
                  userMovedPin.current = true;
                  setCoords({ latitude: lat, longitude: lng });
                }}
              />
              <View style={s.coordsRow}>
                <Ionicons
                  name={coords ? 'location' : 'location-outline'}
                  size={16}
                  color={coords ? c.accent.success : c.text.tertiary}
                />
                <Text style={s.coordsText}>
                  {coords
                    ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`
                    : t('createVenue.locationMissing')}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={s.rewardCard}>
          <Text style={s.rewardEmoji}>🪙</Text>
          <Text style={s.rewardText}>{t('createVenue.rewardHint')}</Text>
        </View>

        <Button
          title={
            kind === 'popup'
              ? t('createVenue.submitPopup')
              : t('createVenue.submitCommunity')
          }
          onPress={handleCreate}
          disabled={!canSubmit}
          loading={saving}
        />
        <Text style={s.footnote}>{t('createVenue.footnote')}</Text>
      </ScrollView>
    </View>
  );
}

function KindCard({
  active, emoji, title, hint, onPress, s, c,
}: {
  active: boolean; emoji: string; title: string; hint: string;
  onPress: () => void; s: any; c: ThemeColors;
}) {
  return (
    <TouchableOpacity
      style={[s.kindCard, active && s.kindCardActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={s.kindEmoji}>{emoji}</Text>
      <Text style={[s.kindTitle, active && { color: c.accent.primaryLight }]}>{title}</Text>
      <Text style={s.kindHint}>{hint}</Text>
    </TouchableOpacity>
  );
}

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },
    scroll: { padding: spacing.xl, paddingBottom: 120 },
    kindRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
    kindCard: {
      flex: 1,
      padding: spacing.lg,
      borderRadius: radius.xl,
      borderWidth: 1.5,
      borderColor,
      backgroundColor: c.bg.secondary,
      alignItems: 'center',
      gap: spacing.xs,
    },
    kindCardActive: {
      borderColor: c.accent.primary,
      backgroundColor: isDark ? 'rgba(124,111,247,0.10)' : 'rgba(124,111,247,0.06)',
    },
    kindEmoji: { fontSize: 32 },
    kindTitle: {
      fontSize: typography.size.bodyLg,
      fontWeight: typography.weight.bold,
      color: c.text.primary,
      textAlign: 'center',
    },
    kindHint: {
      fontSize: typography.size.bodySm,
      color: c.text.tertiary,
      textAlign: 'center',
    },
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
    locationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: c.bg.secondary,
      borderWidth: 1,
      borderColor,
      marginBottom: spacing.md,
    },
    locationText: { flex: 1, color: c.text.secondary, fontSize: typography.size.bodyMd },
    mapSkeleton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      height: 280,
      justifyContent: 'center',
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor,
      backgroundColor: c.bg.secondary,
      marginBottom: spacing.md,
    },
    coordsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    coordsText: { flex: 1, color: c.text.secondary, fontSize: typography.size.bodySm },
    rewardCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: isDark ? 'rgba(255,217,61,0.08)' : 'rgba(255,190,0,0.08)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,217,61,0.25)' : 'rgba(200,150,0,0.25)',
      marginBottom: spacing.xl,
    },
    rewardEmoji: { fontSize: 22 },
    rewardText: { flex: 1, color: c.text.secondary, fontSize: typography.size.bodySm },
    footnote: {
      marginTop: spacing.lg,
      color: c.text.tertiary,
      fontSize: typography.size.bodySm,
      textAlign: 'center',
      lineHeight: typography.size.bodySm * 1.5,
    },
  });
}
