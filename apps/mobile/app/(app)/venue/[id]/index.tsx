import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVenueDetail } from '@/hooks/use-venues';
import { useActiveCheckin, useCheckin } from '@/hooks/use-checkin';
import { useLocation } from '@/hooks/use-location';
import { VenueStatusSheet } from '@/components/venue/venue-status-sheet';
import { Button } from '@/components/ui/button';
import { colors, typography, spacing, shadows, radius, venueAmbient } from '@/theme';

const VENUE_EMOJI: Record<string, string> = {
  karaoke: '🎤', nightclub: '🪩', sports_bar: '⚽', bowling: '🎳',
  billiards: '🎱', hookah: '💨', board_games: '🎲', arcade: '🕹️',
  standup: '🎭', live_music: '🎵', other: '📍',
};

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: venue, isLoading } = useVenueDetail(id);
  const { data: activeCheckin } = useActiveCheckin();
  const { checkinMutation, checkoutMutation } = useCheckin();
  const { location } = useLocation();
  const [showStatusSheet, setShowStatusSheet] = useState(false);

  const isCheckedInHere = activeCheckin?.venue_id === id;
  const isCheckedInElsewhere = activeCheckin && activeCheckin.venue_id !== id;

  const handleCheckin = () => {
    if (!location) return;
    checkinMutation.mutate({ venue_id: id, lat: location.latitude, lng: location.longitude });
  };

  const handleCheckout = () => {
    if (activeCheckin) checkoutMutation.mutate(activeCheckin.id);
  };

  if (isLoading || !venue) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const ambient = venueAmbient[venue.type] || venueAmbient.other;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero with ambient gradient */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[`${ambient[0]}40`, `${ambient[1]}20`, colors.bg.primary]}
            style={styles.heroGradient}
          />
          {venue.cover_url ? (
            <Image source={{ uri: venue.cover_url }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroIcon}>
              <Text style={styles.heroEmoji}>{VENUE_EMOJI[venue.type] || '📍'}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/map')}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Venue info */}
          <Text style={styles.venueName}>{venue.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>
                {venue.type.replace('_', ' ')}
              </Text>
            </View>
            {venue.address && (
              <Text style={styles.address} numberOfLines={1}>{venue.address}</Text>
            )}
          </View>

          {venue.description && (
            <Text style={styles.description}>{venue.description}</Text>
          )}

          {/* Check-in hint for non-checked-in users */}
          {!isCheckedInHere && !isCheckedInElsewhere && (
            <View style={styles.hintCard}>
              <Text style={styles.hintText}>{t('venue.checkinHint')}</Text>
            </View>
          )}

          {isCheckedInElsewhere && (
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>{t('venue.checkedInElsewhereHint')}</Text>
            </View>
          )}

          {/* Checked-in banner */}
          {isCheckedInHere && (
            <View style={[styles.checkedInBanner, shadows.glowSuccess]}>
              <View style={styles.checkedInDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.checkedInText}>{t('venue.checkedIn')}</Text>
                <Text style={styles.checkedInHint}>{t('venue.checkedInHint')}</Text>
              </View>
            </View>
          )}

          {/* Status button */}
          {isCheckedInHere && (
            <TouchableOpacity
              style={styles.statusButton}
              onPress={() => setShowStatusSheet(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.statusIcon}>
                {activeCheckin?.is_visible ? '👁️' : '🙈'}
              </Text>
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>
                  {activeCheckin?.status_tag
                    ? t(`status.${activeCheckin.status_tag}`, { defaultValue: activeCheckin.status_tag })
                    : t('profile.statusTag')}
                </Text>
                <Text style={styles.statusHint}>
                  {activeCheckin?.is_visible ? t('profile.visibility') : 'Hidden'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}

          {/* Bento action grid */}
          {isCheckedInHere && (
            <View style={styles.bentoGrid}>
              <TouchableOpacity
                style={[styles.bentoCard, styles.bentoLarge]}
                onPress={() => router.push(`/(app)/venue/${id}/people` as any)}
              >
                <View style={styles.bentoCardInner}>
                  <Ionicons name="people" size={28} color={colors.accent.primary} />
                  <Text style={styles.bentoLabel}>{t('venue.people')}</Text>
                  <Text style={styles.bentoHint}>{t('venue.peopleHint')}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bentoCard}
                onPress={() => router.push(`/(app)/venue/${id}/chat` as any)}
              >
                <View style={styles.bentoCardInner}>
                  <Ionicons name="chatbubbles" size={28} color={colors.accent.info} />
                  <Text style={styles.bentoLabel}>{t('venue.chat')}</Text>
                  <Text style={styles.bentoHint}>{t('venue.chatHint')}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bentoCard}
                onPress={() => router.push(`/(app)/venue/${id}/activities` as any)}
              >
                <View style={styles.bentoCardInner}>
                  <Ionicons name="flash" size={28} color={colors.accent.warning} />
                  <Text style={styles.bentoLabel}>{t('venue.activities')}</Text>
                  <Text style={styles.bentoHint}>{t('venue.activitiesHint')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Zones */}
          {venue.venue_zones && venue.venue_zones.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Zones</Text>
              <View style={styles.zoneRow}>
                {venue.venue_zones.map((zone: { id: string; name: string }) => (
                  <View key={zone.id} style={styles.zoneChip}>
                    <Text style={styles.zoneText}>{zone.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  centered: {
    flex: 1, backgroundColor: colors.bg.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { color: colors.text.secondary, fontSize: typography.size.bodyLg },
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
    backgroundColor: 'rgba(13,13,26,0.6)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  content: { padding: spacing.xl, marginTop: -20 },
  venueName: {
    fontSize: typography.size.displayLg, fontWeight: typography.weight.extrabold,
    color: colors.text.primary, letterSpacing: typography.letterSpacing.display,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  typeBadge: {
    backgroundColor: 'rgba(124,111,247,0.15)', paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: radius.full,
  },
  typeText: {
    color: colors.accent.primaryLight, fontSize: typography.size.bodySm,
    fontWeight: typography.weight.semibold, textTransform: 'capitalize',
  },
  address: {
    color: colors.text.secondary, fontSize: typography.size.bodyMd, flex: 1,
  },
  description: {
    color: colors.text.secondary, fontSize: typography.size.bodyMd,
    lineHeight: typography.size.bodyMd * 1.5, marginBottom: spacing.xl,
  },
  checkedInBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(0,229,160,0.08)', borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: 'rgba(0,229,160,0.2)',
  },
  checkedInDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent.success,
  },
  checkedInText: {
    color: colors.accent.success, fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.semibold,
  },
  checkedInHint: {
    color: colors.text.secondary, fontSize: typography.size.bodySm, marginTop: 2,
  },
  hintCard: {
    backgroundColor: 'rgba(124,111,247,0.08)', borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: 'rgba(124,111,247,0.15)',
  },
  hintText: {
    color: colors.accent.primaryLight, fontSize: typography.size.bodyMd,
    lineHeight: typography.size.bodyMd * 1.5, textAlign: 'center',
  },
  warningCard: {
    backgroundColor: 'rgba(255,217,61,0.08)', borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: 'rgba(255,217,61,0.15)',
  },
  warningText: {
    color: colors.accent.warning, fontSize: typography.size.bodyMd,
    lineHeight: typography.size.bodyMd * 1.5, textAlign: 'center',
  },
  statusButton: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bg.secondary, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  statusIcon: { fontSize: 24 },
  statusInfo: { flex: 1 },
  statusLabel: {
    color: colors.text.primary, fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.semibold,
  },
  statusHint: {
    color: colors.text.tertiary, fontSize: typography.size.bodySm, marginTop: 2,
  },
  bentoGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl,
  },
  bentoLarge: { width: '100%' },
  bentoCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: colors.bg.secondary, borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  bentoCardInner: { alignItems: 'center', gap: spacing.sm },
  bentoLabel: {
    color: colors.text.primary, fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.semibold,
  },
  bentoHint: {
    color: colors.text.tertiary, fontSize: typography.size.bodySm,
    textAlign: 'center', marginTop: 2, lineHeight: typography.size.bodySm * 1.4,
  },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    color: colors.text.secondary, fontSize: typography.size.label,
    fontWeight: typography.weight.semibold, textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.caps, marginBottom: spacing.md,
  },
  zoneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  zoneChip: {
    backgroundColor: colors.bg.tertiary, paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.bg.surface,
  },
  zoneText: {
    color: colors.text.primary, fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.medium,
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.lg, paddingBottom: spacing['4xl'],
    backgroundColor: colors.bg.primary,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
  },
});
