import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useVenueDetail } from '@/hooks/use-venues';
import { useActiveCheckin, useCheckin } from '@/hooks/use-checkin';
import { useLocation } from '@/hooks/use-location';

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: venue, isLoading } = useVenueDetail(id);
  const { data: activeCheckin } = useActiveCheckin();
  const { checkinMutation, checkoutMutation } = useCheckin();
  const { location } = useLocation();

  const isCheckedInHere = activeCheckin?.venue_id === id;
  const isCheckedInElsewhere = activeCheckin && activeCheckin.venue_id !== id;

  const handleCheckin = () => {
    if (!location) return;
    checkinMutation.mutate({
      venue_id: id,
      lat: location.latitude,
      lng: location.longitude,
    });
  };

  const handleCheckout = () => {
    if (activeCheckin) {
      checkoutMutation.mutate(activeCheckin.id);
    }
  };

  if (isLoading || !venue) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {venue.cover_url ? (
          <Image source={{ uri: venue.cover_url }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Text style={styles.coverEmoji}>
              {VENUE_EMOJI[venue.type] || '📍'}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.name}>{venue.name}</Text>
          <Text style={styles.type}>
            {t(`venueTypes.${venue.type}`, { defaultValue: venue.type })}
          </Text>
          <Text style={styles.address}>{venue.address}</Text>

          {venue.description && (
            <Text style={styles.description}>{venue.description}</Text>
          )}

          {isCheckedInHere && (
            <View style={styles.checkedInBanner}>
              <Text style={styles.checkedInIcon}>✓</Text>
              <Text style={styles.checkedInText}>{t('venue.checkedIn')}</Text>
            </View>
          )}

          {isCheckedInHere ? (
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/(app)/venue/${id}/people` as any)}
              >
                <Text style={styles.actionIcon}>👥</Text>
                <Text style={styles.actionLabel}>{t('venue.people')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/(app)/venue/${id}/chat` as any)}
              >
                <Text style={styles.actionIcon}>💬</Text>
                <Text style={styles.actionLabel}>{t('venue.chat')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push(`/(app)/venue/${id}/activities` as any)}
              >
                <Text style={styles.actionIcon}>🎯</Text>
                <Text style={styles.actionLabel}>{t('venue.activities')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {venue.venue_zones && venue.venue_zones.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('venue.zones', { defaultValue: 'Zones' })}</Text>
              <View style={styles.zoneList}>
                {venue.venue_zones.map((zone: { id: string; name: string }) => (
                  <View key={zone.id} style={styles.zoneChip}>
                    <Text style={styles.zoneChipText}>{zone.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {isCheckedInHere ? (
          <TouchableOpacity
            style={[styles.mainButton, styles.checkoutButton]}
            onPress={handleCheckout}
            disabled={checkoutMutation.isPending}
          >
            <Text style={styles.mainButtonText}>{t('venue.checkout')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.mainButton,
              isCheckedInElsewhere && styles.mainButtonDisabled,
            ]}
            onPress={handleCheckin}
            disabled={checkinMutation.isPending || !!isCheckedInElsewhere}
          >
            <Text style={styles.mainButtonText}>
              {checkinMutation.isPending
                ? t('common.loading')
                : isCheckedInElsewhere
                  ? t('venue.checkedInElsewhere', { defaultValue: 'Checked in elsewhere' })
                  : t('venue.checkin')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const VENUE_EMOJI: Record<string, string> = {
  karaoke: '🎤', nightclub: '🪩', sports_bar: '⚽', bowling: '🎳',
  billiards: '🎱', hookah: '💨', board_games: '🎲', arcade: '🕹️',
  standup: '🎭', live_music: '🎸',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0E17' },
  centered: { flex: 1, backgroundColor: '#0F0E17', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#A7A9BE', fontSize: 16 },
  scrollContent: { paddingBottom: 100 },
  cover: { width: '100%', height: 220 },
  coverPlaceholder: { backgroundColor: '#1A1929', alignItems: 'center', justifyContent: 'center' },
  coverEmoji: { fontSize: 64 },
  backButton: {
    position: 'absolute', top: 52, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(15,14,23,0.7)', alignItems: 'center', justifyContent: 'center',
  },
  backButtonText: { color: '#FFFFFE', fontSize: 22 },
  content: { padding: 20 },
  name: { fontSize: 28, fontWeight: '800', color: '#FFFFFE', marginBottom: 4 },
  type: { fontSize: 14, color: '#6C5CE7', fontWeight: '600', textTransform: 'capitalize', marginBottom: 4 },
  address: { fontSize: 14, color: '#A7A9BE', marginBottom: 16 },
  description: { fontSize: 15, color: '#FFFFFE', lineHeight: 22, marginBottom: 20 },
  checkedInBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,255,136,0.1)', borderWidth: 1, borderColor: '#00FF88',
    borderRadius: 12, padding: 12, marginBottom: 20,
  },
  checkedInIcon: { color: '#00FF88', fontSize: 18, fontWeight: '700' },
  checkedInText: { color: '#00FF88', fontSize: 14, fontWeight: '600' },
  actionGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionCard: {
    flex: 1, backgroundColor: '#1A1929', borderRadius: 16,
    padding: 16, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#2A2940',
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { color: '#FFFFFE', fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#A7A9BE', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  zoneList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  zoneChip: { backgroundColor: '#1A1929', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#2A2940' },
  zoneChipText: { color: '#FFFFFE', fontSize: 13 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 32, backgroundColor: '#0F0E17',
    borderTopWidth: 1, borderTopColor: '#1A1929',
  },
  mainButton: { backgroundColor: '#6C5CE7', borderRadius: 14, padding: 16, alignItems: 'center' },
  mainButtonDisabled: { opacity: 0.4 },
  checkoutButton: { backgroundColor: '#FF6B6B' },
  mainButtonText: { color: '#FFFFFE', fontSize: 16, fontWeight: '700' },
});
