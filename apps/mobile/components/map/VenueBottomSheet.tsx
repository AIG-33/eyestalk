import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, typography, radius, spacing } from '@/theme';
import { VENUE_EMOJI, ACTIVITY_EMOJI } from '@/lib/venue-constants';
import { getDistanceMeters, formatDistance } from '@/lib/geo';
import { Avatar } from '@/components/ui/avatar';
import { useVenueActivities } from '@/hooks/use-venue-activities';
import { useVenuePeople } from '@/hooks/use-venue-people';
import type { VenueWithStats } from '@/hooks/use-venues';

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface Props {
  venue: VenueWithStats;
  userLocation: UserLocation | null;
  activeCheckin: any;
  checkinPending: boolean;
  insets: { bottom: number };
  onCheckin: () => void;
  onClose: () => void;
}

export function VenueBottomSheet({
  venue,
  userLocation,
  activeCheckin,
  checkinPending,
  insets,
  onCheckin,
  onClose,
}: Props) {
  const { t, i18n } = useTranslation();
  const { c, isDark } = useTheme();
  const { data: activities } = useVenueActivities(venue.id);
  const { data: people } = useVenuePeople(venue.id);
  const isCheckedInHere =
    String(activeCheckin?.venue_id ?? '') === String(venue.id ?? '');

  const emoji = VENUE_EMOJI[venue.type] || '📍';
  const dist = userLocation
    ? formatDistance(
        getDistanceMeters(
          userLocation.latitude,
          userLocation.longitude,
          Number(venue.latitude),
          Number(venue.longitude),
        ),
        i18n.language,
      )
    : null;

  const navigateToVenue = () => {
    onClose();
    router.push(`/(app)/venue/${venue.id}` as any);
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 20),
              backgroundColor: c.bg.secondary,
              borderColor: isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.06)',
            },
          ]}
        >
        <View
          style={[
            styles.handle,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.15)'
                : 'rgba(0,0,0,0.12)',
            },
          ]}
        />

        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(0,0,0,0.03)',
                borderColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.06)',
              },
            ]}
          >
            {venue.logo_url ? (
              <Image
                source={{ uri: venue.logo_url }}
                style={styles.logo}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.emojiLg}>{emoji}</Text>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text
              style={[styles.name, { color: c.text.primary }]}
              numberOfLines={1}
            >
              {venue.name}
            </Text>
            <View style={styles.meta}>
              <Text style={[styles.type, { color: c.text.secondary }]}>
                {t(`venueTypes.${venue.type}`, {
                  defaultValue: (venue.type ?? '').replace(/_/g, ' ') || '—',
                })}
              </Text>
              {venue.active_checkins > 0 && (
                <View style={styles.live}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>
                    {venue.active_checkins}{' '}
                    {t('map.activeNow', { defaultValue: 'active' })}
                  </Text>
                </View>
              )}
              {dist && (
                <Text style={[styles.distText, { color: c.text.tertiary }]}>
                  {dist}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* People section */}
        {people && people.length > 0 && (
          <View style={styles.peopleRow}>
            <View style={styles.avatarStack}>
              {people.slice(0, 4).map((p, i) => (
                <View
                  key={p.user_id}
                  style={[styles.avatarWrap, { marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i }]}
                >
                  <Avatar uri={p.avatar_url} name={p.nickname} size="xs" />
                </View>
              ))}
            </View>
            <Text style={[styles.peopleText, { color: c.text.secondary }]}>
              {t('map.checkedInPeople', {
                count: people.length,
                defaultValue: `${people.length} checked in`,
              })}
            </Text>
          </View>
        )}

        {/* Activities section */}
        {activities && activities.length > 0 && (
          <View style={styles.activitiesSection}>
            <View style={styles.activitiesHeader}>
              <Ionicons name="flash" size={14} color={c.accent.warning} />
              <Text
                style={[styles.activitiesTitle, { color: c.text.primary }]}
              >
                {t('venue.activities', { defaultValue: 'Activities' })}
              </Text>
            </View>
            {activities.map((act) => (
              <View key={act.id} style={styles.activityRow}>
                <Text style={styles.activityEmoji}>
                  {ACTIVITY_EMOJI[act.type] || '⚡'}
                </Text>
                <Text
                  style={[styles.activityName, { color: c.text.secondary }]}
                  numberOfLines={1}
                >
                  {act.title}
                </Text>
                <View
                  style={[
                    styles.activityBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,217,61,0.12)'
                        : 'rgba(230,184,0,0.08)',
                    },
                  ]}
                >
                  <Text
                    style={[styles.activityBadgeText, { color: c.accent.warning }]}
                  >
                    {act.status === 'active'
                      ? t('map.activeNow', { defaultValue: 'active' })
                      : t('map.upcoming', { defaultValue: 'soon' })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Address */}
        {venue.address && (
          <View style={styles.row}>
            <Ionicons name="location-outline" size={16} color={c.text.tertiary} />
            <Text
              style={[styles.address, { color: c.text.tertiary }]}
              numberOfLines={2}
            >
              {venue.address}
            </Text>
          </View>
        )}

        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[
              styles.navBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(124,111,247,0.1)'
                  : 'rgba(108,92,231,0.08)',
                borderColor: isDark
                  ? 'rgba(124,111,247,0.2)'
                  : 'rgba(108,92,231,0.15)',
              },
            ]}
            onPress={() => {
              const lat = Number(venue.latitude);
              const lng = Number(venue.longitude);
              const url = Platform.select({
                ios: `maps:?daddr=${lat},${lng}&dirflg=w`,
                android: `google.navigation:q=${lat},${lng}&mode=w`,
              });
              if (url) Linking.openURL(url);
            }}
          >
            <Ionicons name="navigate-outline" size={18} color={c.accent.primary} />
            <Text style={[styles.navBtnText, { color: c.accent.primary }]}>
              {i18n.language === 'ru' ? 'Маршрут' : 'Directions'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(0,0,0,0.03)',
                borderColor: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.06)',
              },
            ]}
            onPress={() => {
              const lat = Number(venue.latitude);
              const lng = Number(venue.longitude);
              const label = encodeURIComponent(venue.name);
              Linking.openURL(
                `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${label}`,
              );
            }}
          >
            <Ionicons name="map-outline" size={18} color={c.text.secondary} />
            <Text style={[styles.navBtnText, { color: c.text.secondary }]}>
              Google Maps
            </Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        {venue.description && (
          <Text
            style={[styles.desc, { color: c.text.secondary }]}
            numberOfLines={3}
          >
            {venue.description}
          </Text>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {isCheckedInHere ? (
            <TouchableOpacity
              style={styles.btnCheckedIn}
              onPress={navigateToVenue}
            >
              <View style={styles.checkedDot} />
              <Text style={styles.btnCheckedInText}>
                {t('venue.checkedIn', { defaultValue: 'Checked In' })}
              </Text>
            </TouchableOpacity>
          ) : activeCheckin ? (
            <View
              style={[
                styles.btnDisabled,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(0,0,0,0.03)',
                },
              ]}
            >
              <Text style={[styles.btnDisabledText, { color: c.text.tertiary }]}>
                {t('venue.checkedInElsewhereHint', {
                  defaultValue: 'Checked in elsewhere',
                })}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.btnCheckin, { backgroundColor: c.accent.primary }]}
              onPress={onCheckin}
              disabled={checkinPending}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.btnCheckinText}>
                {checkinPending
                  ? t('common.loading')
                  : t('venue.checkin', { defaultValue: 'Check In' })}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.btnDetails} onPress={navigateToVenue}>
            <Text
              style={[styles.btnDetailsText, { color: c.accent.primaryLight }]}
            >
              {t('map.viewDetails', { defaultValue: 'View Details' })}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={c.accent.primaryLight}
            />
          </TouchableOpacity>
        </View>
      </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  logo: { width: 48, height: 48, borderRadius: 14 },
  emojiLg: { fontSize: 28 },
  headerInfo: { flex: 1 },
  name: {
    fontSize: typography.size.headingMd,
    fontWeight: typography.weight.bold,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  type: {
    fontSize: typography.size.bodySm,
    textTransform: 'capitalize',
  },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,229,160,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00E5A0',
  },
  liveText: {
    color: '#00E5A0',
    fontSize: 10,
    fontWeight: '700',
  },
  distText: {
    fontSize: typography.size.bodySm,
  },

  peopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(124,111,247,0.06)',
    borderRadius: radius.lg,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {},
  peopleText: {
    fontSize: typography.size.bodySm,
    fontWeight: typography.weight.medium,
    marginLeft: 4,
  },

  activitiesSection: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  activitiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  activitiesTitle: {
    fontSize: typography.size.bodySm,
    fontWeight: typography.weight.bold,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  activityEmoji: { fontSize: 14 },
  activityName: {
    flex: 1,
    fontSize: typography.size.bodySm,
  },
  activityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  activityBadgeText: {
    fontSize: typography.size.micro,
    fontWeight: typography.weight.bold,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  address: {
    flex: 1,
    fontSize: typography.size.bodySm,
    lineHeight: typography.size.bodySm * 1.4,
  },

  navRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  navBtnText: {
    fontSize: typography.size.bodySm,
    fontWeight: typography.weight.semibold,
  },

  desc: {
    fontSize: typography.size.bodyMd,
    lineHeight: typography.size.bodyMd * 1.5,
    marginBottom: spacing.md,
  },

  actions: { gap: spacing.sm, marginTop: spacing.sm },
  btnCheckin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: 14,
  },
  btnCheckinText: {
    color: '#FFFFFF',
    fontSize: typography.size.bodyLg,
    fontWeight: typography.weight.bold,
  },
  btnCheckedIn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0,229,160,0.1)',
    borderRadius: radius.lg,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,229,160,0.2)',
  },
  checkedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E5A0',
  },
  btnCheckedInText: {
    color: '#00E5A0',
    fontSize: typography.size.bodyLg,
    fontWeight: typography.weight.bold,
  },
  btnDisabled: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    paddingVertical: 14,
  },
  btnDisabledText: {
    fontSize: typography.size.bodyMd,
  },
  btnDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
  },
  btnDetailsText: {
    fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.semibold,
  },
});
