import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVenueDetail } from '@/hooks/use-venues';
import { useActiveCheckin, useCheckin } from '@/hooks/use-checkin';
import { useLocation } from '@/hooks/use-location';
import { VenueStatusSheet } from '@/components/venue/venue-status-sheet';
import { Button } from '@/components/ui/button';
import { useTheme, typography, spacing, shadows, radius, venueAmbient } from '@/theme';

const VENUE_EMOJI: Record<string, string> = {
  karaoke: '🎤', nightclub: '🪩', sports_bar: '⚽', bowling: '🎳',
  billiards: '🎱', hookah: '💨', board_games: '🎲', arcade: '🕹️',
  standup: '🎭', live_music: '🎵', other: '📍',
};

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { c, isDark } = useTheme();
  const { data: venue, isLoading } = useVenueDetail(id);
  const { data: activeCheckin } = useActiveCheckin();
  const { checkinMutation, checkoutMutation } = useCheckin();
  const { location } = useLocation();
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);

  const isCheckedInHere = activeCheckin?.venue_id === id;
  const isCheckedInElsewhere = activeCheckin && activeCheckin.venue_id !== id;

  const handleCheckin = async () => {
    if (!location) {
      Alert.alert('Error', 'Location not available yet. Wait a moment.');
      return;
    }

    Alert.alert('Debug', `venue_id: ${id}\nlat: ${location.latitude}\nlng: ${location.longitude}`);

    checkinMutation.mutate(
      { venue_id: id, lat: location.latitude, lng: location.longitude },
      {
        onSuccess: (result) => {
          Alert.alert('Checked in!', `You earned ${result.tokens_earned} tokens`);
        },
        onError: (err: any) => {
          Alert.alert('Check-in failed', err.message || JSON.stringify(err));
        },
      },
    );
  };

  const handleCheckout = () => {
    if (activeCheckin) checkoutMutation.mutate(activeCheckin.id);
  };

  if (isLoading || !venue) {
    return (
      <View style={[s.centered]}>
        <Text style={s.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const ambient = venueAmbient[venue.type] || venueAmbient.other;

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        {/* Hero with ambient gradient */}
        <View style={s.hero}>
          <LinearGradient
            colors={[`${ambient[0]}40`, `${ambient[1]}20`, c.bg.primary]}
            style={s.heroGradient}
          />
          {venue.cover_url ? (
            <Image source={{ uri: venue.cover_url }} style={s.heroImage} />
          ) : (
            <View style={s.heroIcon}>
              <Text style={s.heroEmoji}>{VENUE_EMOJI[venue.type] || '📍'}</Text>
            </View>
          )}
          <TouchableOpacity style={s.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/map')}>
            <Ionicons name="chevron-back" size={24} color={c.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={s.content}>
          {/* Venue info */}
          <Text style={s.venueName}>{venue.name}</Text>
          <View style={s.metaRow}>
            <View style={s.typeBadge}>
              <Text style={s.typeText}>
                {venue.type.replace('_', ' ')}
              </Text>
            </View>
            {venue.address && (
              <Text style={s.address} numberOfLines={1}>{venue.address}</Text>
            )}
          </View>

          {venue.description && (
            <Text style={s.description}>{venue.description}</Text>
          )}

          {/* Check-in hint for non-checked-in users */}
          {!isCheckedInHere && !isCheckedInElsewhere && (
            <View style={s.hintCard}>
              <Text style={s.hintText}>{t('venue.checkinHint')}</Text>
            </View>
          )}

          {isCheckedInElsewhere && (
            <View style={s.warningCard}>
              <Text style={s.warningText}>{t('venue.checkedInElsewhereHint')}</Text>
            </View>
          )}

          {/* Checked-in banner */}
          {isCheckedInHere && (
            <View style={[s.checkedInBanner, shadows.glowSuccess]}>
              <View style={s.checkedInDot} />
              <View style={{ flex: 1 }}>
                <Text style={s.checkedInText}>{t('venue.checkedIn')}</Text>
                <Text style={s.checkedInHint}>{t('venue.checkedInHint')}</Text>
              </View>
            </View>
          )}

          {/* Status button */}
          {isCheckedInHere && (
            <TouchableOpacity
              style={s.statusButton}
              onPress={() => setShowStatusSheet(true)}
              activeOpacity={0.7}
            >
              <Text style={s.statusIcon}>
                {activeCheckin?.is_visible ? '👁️' : '🙈'}
              </Text>
              <View style={s.statusInfo}>
                <Text style={s.statusLabel}>
                  {activeCheckin?.status_tag
                    ? t(`status.${activeCheckin.status_tag}`, { defaultValue: activeCheckin.status_tag })
                    : t('profile.statusTag')}
                </Text>
                <Text style={s.statusHint}>
                  {activeCheckin?.is_visible ? t('profile.visibility') : 'Hidden'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.text.tertiary} />
            </TouchableOpacity>
          )}

          {/* Bento action grid — visible to everyone */}
          <View style={s.bentoGrid}>
            <TouchableOpacity
              style={[s.bentoCard, s.bentoLarge]}
              onPress={() => router.push(`/(app)/venue/${id}/people` as any)}
            >
              <View style={s.bentoCardInner}>
                <Ionicons name="people" size={28} color={c.accent.primary} />
                <Text style={s.bentoLabel}>{t('venue.people')}</Text>
                <Text style={s.bentoHint}>{t('venue.peopleHint')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.bentoCard}
              onPress={() => {
                if (!isCheckedInHere) {
                  Alert.alert(t('venue.checkinRequired'), t('venue.checkinRequiredChat'));
                  return;
                }
                router.push(`/(app)/venue/${id}/chat` as any);
              }}
            >
              <View style={s.bentoCardInner}>
                {!isCheckedInHere && (
                  <View style={s.lockBadge}>
                    <Ionicons name="lock-closed" size={10} color={c.text.tertiary} />
                  </View>
                )}
                <Ionicons name="chatbubbles" size={28} color={isCheckedInHere ? c.accent.info : c.text.tertiary} />
                <Text style={s.bentoLabel}>{t('venue.chat')}</Text>
                <Text style={s.bentoHint}>
                  {isCheckedInHere ? t('venue.chatHint') : t('venue.checkinToChat')}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.bentoCard}
              onPress={() => {
                if (!isCheckedInHere) {
                  Alert.alert(t('venue.checkinRequired'), t('venue.checkinRequiredActivities'));
                  return;
                }
                router.push(`/(app)/venue/${id}/activities` as any);
              }}
            >
              <View style={s.bentoCardInner}>
                {!isCheckedInHere && (
                  <View style={s.lockBadge}>
                    <Ionicons name="lock-closed" size={10} color={c.text.tertiary} />
                  </View>
                )}
                <Ionicons name="flash" size={28} color={isCheckedInHere ? c.accent.warning : c.text.tertiary} />
                <Text style={s.bentoLabel}>{t('venue.activities')}</Text>
                <Text style={s.bentoHint}>
                  {isCheckedInHere ? t('venue.activitiesHint') : t('venue.checkinToJoin')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Zones */}
          {venue.venue_zones && venue.venue_zones.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Zones</Text>
              <View style={s.zoneRow}>
                {venue.venue_zones.map((zone: { id: string; name: string }) => (
                  <View key={zone.id} style={s.zoneChip}>
                    <Text style={s.zoneText}>{zone.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={s.bottomBar}>
        {isCheckedInHere ? (
          <Button
            title={t('venue.checkout')}
            variant="danger"
            onPress={handleCheckout}
            loading={checkoutMutation.isPending}
          />
        ) : (
          <Button
            title={
              checkinMutation.isPending
                ? t('common.loading')
                : isCheckedInElsewhere
                  ? 'Checked in elsewhere'
                  : t('venue.checkin')
            }
            onPress={handleCheckin}
            disabled={checkinMutation.isPending || !!isCheckedInElsewhere}
          />
        )}
      </View>

      {showStatusSheet && activeCheckin && (
        <VenueStatusSheet
          checkinId={activeCheckin.id}
          currentStatusTag={activeCheckin.status_tag ?? null}
          isVisible={activeCheckin.is_visible ?? false}
          onClose={() => setShowStatusSheet(false)}
        />
      )}
    </View>
  );
}

import type { ThemeColors } from '@/theme';

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const borderColorFaint = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const glassBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },
    centered: {
      flex: 1, backgroundColor: c.bg.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    loadingText: { color: c.text.secondary, fontSize: typography.size.bodyLg },
    scrollContent: { paddingBottom: 120 },
    hero: { height: 240, position: 'relative' },
    heroGradient: { ...StyleSheet.absoluteFillObject },
    heroImage: { width: '100%', height: '100%', opacity: 0.6 },
    heroIcon: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
    },
    heroEmoji: { fontSize: 64 },
    backBtn: {
      position: 'absolute', top: 52, left: spacing.lg,
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: isDark ? 'rgba(13,13,26,0.6)' : 'rgba(255,255,255,0.7)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor,
    },
    content: { padding: spacing.xl, marginTop: -20 },
    venueName: {
      fontSize: typography.size.displayLg, fontWeight: typography.weight.extrabold,
      color: c.text.primary, letterSpacing: typography.letterSpacing.display,
      marginBottom: spacing.sm,
    },
    metaRow: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg,
      flexWrap: 'wrap',
    },
    typeBadge: {
      backgroundColor: c.glow.primarySubtle, paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs, borderRadius: radius.full,
    },
    typeText: {
      color: c.accent.primaryLight, fontSize: typography.size.bodySm,
      fontWeight: typography.weight.semibold, textTransform: 'capitalize',
    },
    address: {
      color: c.text.secondary, fontSize: typography.size.bodyMd, flex: 1,
    },
    description: {
      color: c.text.secondary, fontSize: typography.size.bodyMd,
      lineHeight: typography.size.bodyMd * 1.5, marginBottom: spacing.xl,
    },
    checkedInBanner: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      backgroundColor: isDark ? 'rgba(0,229,160,0.08)' : 'rgba(0,201,141,0.08)',
      borderRadius: radius.lg,
      padding: spacing.md, marginBottom: spacing.lg,
      borderWidth: 1, borderColor: isDark ? 'rgba(0,229,160,0.2)' : 'rgba(0,201,141,0.2)',
    },
    checkedInDot: {
      width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent.success,
    },
    checkedInText: {
      color: c.accent.success, fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.semibold,
    },
    checkedInHint: {
      color: c.text.secondary, fontSize: typography.size.bodySm, marginTop: 2,
    },
    hintCard: {
      backgroundColor: c.glow.primarySubtle, borderRadius: radius.lg,
      padding: spacing.md, marginBottom: spacing.lg,
      borderWidth: 1, borderColor: `${c.accent.primary}25`,
    },
    hintText: {
      color: c.accent.primaryLight, fontSize: typography.size.bodyMd,
      lineHeight: typography.size.bodyMd * 1.5, textAlign: 'center',
    },
    warningCard: {
      backgroundColor: c.glow.warning, borderRadius: radius.lg,
      padding: spacing.md, marginBottom: spacing.lg,
      borderWidth: 1, borderColor: `${c.accent.warning}30`,
    },
    warningText: {
      color: c.accent.warning, fontSize: typography.size.bodyMd,
      lineHeight: typography.size.bodyMd * 1.5, textAlign: 'center',
    },
    statusButton: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      backgroundColor: c.bg.secondary, borderRadius: radius.lg,
      padding: spacing.lg, marginBottom: spacing.lg,
      borderWidth: 1, borderColor,
    },
    statusIcon: { fontSize: 24 },
    statusInfo: { flex: 1 },
    statusLabel: {
      color: c.text.primary, fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.semibold,
    },
    statusHint: {
      color: c.text.tertiary, fontSize: typography.size.bodySm, marginTop: 2,
    },
    bentoGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl,
    },
    bentoLarge: { width: '100%' },
    bentoCard: {
      flex: 1, minWidth: '45%',
      backgroundColor: c.bg.secondary, borderRadius: radius.xl,
      padding: spacing.xl,
      borderWidth: 1, borderColor,
    },
    bentoCardInner: { alignItems: 'center', gap: spacing.sm, position: 'relative' },
    lockBadge: {
      position: 'absolute', top: -4, right: -4,
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: glassBg, alignItems: 'center', justifyContent: 'center',
    },
    bentoLabel: {
      color: c.text.primary, fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.semibold,
    },
    bentoHint: {
      color: c.text.tertiary, fontSize: typography.size.bodySm,
      textAlign: 'center', marginTop: 2, lineHeight: typography.size.bodySm * 1.4,
    },
    section: { marginBottom: spacing.xl },
    sectionTitle: {
      color: c.text.secondary, fontSize: typography.size.label,
      fontWeight: typography.weight.semibold, textTransform: 'uppercase',
      letterSpacing: typography.letterSpacing.caps, marginBottom: spacing.md,
    },
    zoneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    zoneChip: {
      backgroundColor: c.bg.tertiary, paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm, borderRadius: radius.full,
      borderWidth: 1, borderColor: c.bg.surface,
    },
    zoneText: {
      color: c.text.primary, fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.medium,
    },
    bottomBar: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: spacing.lg, paddingBottom: spacing['4xl'],
      backgroundColor: c.bg.primary,
      borderTopWidth: 1, borderTopColor: borderColorFaint,
    },
  });
}
