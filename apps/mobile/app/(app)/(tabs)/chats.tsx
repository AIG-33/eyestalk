import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useUserChats } from '@/hooks/use-chat';

export default function ChatsScreen() {
  const { t } = useTranslation();
  const { data: chats = [], isLoading } = useUserChats();

  const renderChat = ({ item }: { item: any }) => {
    const chat = item.chats;
    const venueName = chat?.venues?.name || '';
    const chatName = chat?.name || venueName || t('chats.directChat', { defaultValue: 'Direct Chat' });
    const isVenueChat = chat?.type === 'venue_general';

    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => {
          if (isVenueChat) {
            router.push(`/(app)/venue/${chat.venue_id}/chat` as any);
          } else {
            router.push(`/(app)/chat/${chat.id}` as any);
          }
        }}
      >
        <View style={[styles.avatar, isVenueChat && styles.avatarVenue]}>
          <Text style={styles.avatarText}>
            {isVenueChat ? '🏠' : chatName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>{chatName}</Text>
          <Text style={styles.chatMeta}>
            {isVenueChat
              ? t('chats.venueChat', { defaultValue: 'Venue Chat' })
              : t('chats.directChat', { defaultValue: 'Direct Chat' })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tabs.chats')}</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : chats.length > 0 ? (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.chat_id}
          renderItem={renderChat}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>{t('chats.empty')}</Text>
          <Text style={styles.emptySubtext}>{t('chats.emptyHint')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0E17' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFE' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  loadingText: { color: '#A7A9BE' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#FFFFFE', marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#A7A9BE', textAlign: 'center', lineHeight: 20 },
  list: { paddingHorizontal: 16 },
  chatCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1A1929', borderRadius: 16, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#2A2940',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#6C5CE7', alignItems: 'center', justifyContent: 'center',
  },
  avatarVenue: { backgroundColor: '#2A2940' },
  avatarText: { fontSize: 20 },
  chatInfo: { flex: 1 },
  chatName: { color: '#FFFFFE', fontSize: 16, fontWeight: '600' },
  chatMeta: { color: '#A7A9BE', fontSize: 12, marginTop: 2 },
});
