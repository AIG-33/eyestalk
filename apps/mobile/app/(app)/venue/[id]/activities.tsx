import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  token_cost: number;
  starts_at: string;
  ends_at: string;
  config: Record<string, unknown>;
  _count?: { participants: number };
}

const ACTIVITY_EMOJI: Record<string, string> = {
  poll: '📊',
  contest: '🏆',
  tournament: '⚔️',
  challenge: '🎯',
  quest: '🗺️',
  auction: '💰',
};

export default function ActivitiesScreen() {
  const { id: venueId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['venue', venueId, 'activities'],
    queryFn: async (): Promise<Activity[]> => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('venue_id', venueId)
        .in('status', ['active', 'upcoming'])
        .order('starts_at', { ascending: true });

      if (error) throw error;
      return (data as Activity[]) || [];
    },
    refetchInterval: 10_000,
  });

  const joinActivity = useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase.from('activity_participants').insert({
        activity_id: activityId,
        user_id: session!.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue', venueId, 'activities'] });
    },
  });

  const renderActivity = ({ item }: { item: Activity }) => {
    const isActive = item.status === 'active';
    const timeLeft = getTimeLeft(item.ends_at);

    return (
      <View style={[styles.activityCard, isActive && styles.activityCardActive]}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityEmoji}>
            {ACTIVITY_EMOJI[item.type] || '🎯'}
          </Text>
          <View style={styles.activityHeaderText}>
            <Text style={styles.activityTitle}>{item.title}</Text>
            <Text style={styles.activityType}>
              {t(`activityTypes.${item.type}`, { defaultValue: item.type })}
            </Text>
          </View>
          {isActive && timeLeft && (
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>{timeLeft}</Text>
            </View>
          )}
        </View>

        {item.description && (
          <Text style={styles.activityDescription}>{item.description}</Text>
        )}

        <View style={styles.activityFooter}>
          {item.token_cost > 0 && (
            <Text style={styles.tokenCost}>🪙 {item.token_cost}</Text>
          )}
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => joinActivity.mutate(item.id)}
            disabled={joinActivity.isPending}
          >
            <Text style={styles.joinButtonText}>
              {t('activities.join', { defaultValue: 'Join' })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('venue.activities')}</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : activities.length > 0 ? (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={renderActivity}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyText}>
            {t('activities.empty', { defaultValue: 'No activities right now' })}
          </Text>
          <Text style={styles.emptyHint}>
            {t('activities.emptyHint', { defaultValue: 'Check back soon!' })}
          </Text>
        </View>
      )}
    </View>
  );
}

function getTimeLeft(endDate: string): string | null {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0E17' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
  },
  backText: { color: '#FFFFFE', fontSize: 24 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFE' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  loadingText: { color: '#A7A9BE' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#FFFFFE', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  emptyHint: { color: '#A7A9BE', fontSize: 14, textAlign: 'center' },
  list: { padding: 16, gap: 12 },
  activityCard: {
    backgroundColor: '#1A1929', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#2A2940',
  },
  activityCardActive: { borderColor: '#6C5CE7' },
  activityHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activityEmoji: { fontSize: 32 },
  activityHeaderText: { flex: 1 },
  activityTitle: { color: '#FFFFFE', fontSize: 16, fontWeight: '700' },
  activityType: { color: '#A7A9BE', fontSize: 12, textTransform: 'capitalize', marginTop: 2 },
  timerBadge: { backgroundColor: '#FF6B6B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  timerText: { color: '#FFFFFE', fontSize: 12, fontWeight: '700' },
  activityDescription: { color: '#A7A9BE', fontSize: 14, marginTop: 10, lineHeight: 20 },
  activityFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  tokenCost: { color: '#A7A9BE', fontSize: 14 },
  joinButton: { backgroundColor: '#6C5CE7', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  joinButtonText: { color: '#FFFFFE', fontSize: 14, fontWeight: '700' },
});
