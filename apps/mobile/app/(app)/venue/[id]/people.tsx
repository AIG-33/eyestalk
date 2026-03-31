import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';

interface PersonInVenue {
  user_id: string;
  is_visible: boolean;
  status_tag: string | null;
  profiles: {
    nickname: string;
    avatar_url: string | null;
    age_range: string;
    interests: string[];
  };
}

export default function PeopleScreen() {
  const { id: venueId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);

  const { data: people, isLoading } = useQuery({
    queryKey: ['venue', venueId, 'people'],
    queryFn: async (): Promise<PersonInVenue[]> => {
      const { data, error } = await supabase
        .from('checkins')
        .select('user_id, is_visible, status_tag, profiles!inner(nickname, avatar_url, age_range, interests)')
        .eq('venue_id', venueId)
        .eq('status', 'active')
        .eq('is_visible', true)
        .neq('user_id', session!.user.id);

      if (error) throw error;
      return (data as unknown as PersonInVenue[]) || [];
    },
    refetchInterval: 15_000,
  });

  const sendInterest = useMutation({
    mutationFn: (targetUserId: string) =>
      api.post('/interests', {
        target_user_id: targetUserId,
        venue_id: venueId,
        type: 'wave',
      }),
  });

  const renderPerson = ({ item }: { item: PersonInVenue }) => (
    <View style={styles.personCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.profiles.nickname.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.personInfo}>
        <Text style={styles.personName}>{item.profiles.nickname}</Text>
        <Text style={styles.personAge}>{item.profiles.age_range}</Text>
        {item.status_tag && (
          <View style={styles.statusTag}>
            <Text style={styles.statusTagText}>
              {t(`status.${item.status_tag}`, { defaultValue: item.status_tag })}
            </Text>
          </View>
        )}
        {item.profiles.interests.length > 0 && (
          <View style={styles.interestRow}>
            {item.profiles.interests.slice(0, 3).map((interest) => (
              <View key={interest} style={styles.interestChip}>
                <Text style={styles.interestText}>
                  {t(`interests.${interest}`, { defaultValue: interest })}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.waveButton}
        onPress={() => sendInterest.mutate(item.user_id)}
        disabled={sendInterest.isPending}
      >
        <Text style={styles.waveIcon}>👋</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('venue.people')}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{people?.length || 0}</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : people && people.length > 0 ? (
        <FlatList
          data={people}
          keyExtractor={(item) => item.user_id}
          renderItem={renderPerson}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>👀</Text>
          <Text style={styles.emptyText}>
            {t('people.noOne', { defaultValue: 'No one is visible yet' })}
          </Text>
          <Text style={styles.emptyHint}>
            {t('people.beFirst', { defaultValue: 'Be the first to show your profile!' })}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0E17' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
  },
  backText: { color: '#FFFFFE', fontSize: 24 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: '#FFFFFE' },
  countBadge: { backgroundColor: '#6C5CE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { color: '#FFFFFE', fontSize: 13, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  loadingText: { color: '#A7A9BE' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#FFFFFE', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  emptyHint: { color: '#A7A9BE', fontSize: 14, textAlign: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  personCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1929', borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#2A2940',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#6C5CE7', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFE', fontSize: 20, fontWeight: '700' },
  personInfo: { flex: 1, marginLeft: 12 },
  personName: { color: '#FFFFFE', fontSize: 16, fontWeight: '700' },
  personAge: { color: '#A7A9BE', fontSize: 12, marginTop: 2 },
  statusTag: { backgroundColor: '#6C5CE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6, alignSelf: 'flex-start' },
  statusTagText: { color: '#FFFFFE', fontSize: 11, fontWeight: '600' },
  interestRow: { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  interestChip: { backgroundColor: '#2A2940', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  interestText: { color: '#A7A9BE', fontSize: 11 },
  waveButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#2A2940', alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  waveIcon: { fontSize: 22 },
});
