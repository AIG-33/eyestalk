import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useChatMessages, useSendMessage, type ChatMessage } from '@/hooks/use-chat';
import { useAuthStore } from '@/stores/auth.store';

export default function DirectChatScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { data: messages = [] } = useChatMessages(chatId);
  const sendMessage = useSendMessage(chatId);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage.mutate(trimmed);
    setText('');
  };

  const otherUser = messages.find((m) => m.sender_id !== session?.user.id)?.sender;

  const isOwnMessage = (msg: ChatMessage) => msg.sender_id === session?.user.id;

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.msgRow, isOwnMessage(item) && styles.msgRowOwn]}>
      <View style={[styles.msgBubble, isOwnMessage(item) ? styles.msgOwn : styles.msgOther]}>
        <Text style={styles.msgText}>{item.content}</Text>
        <Text style={styles.msgTime}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {(otherUser?.nickname || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.headerName}>{otherUser?.nickname || t('chats.chatRequest')}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>
              {t('chats.startConversation', { defaultValue: 'Say something!' })}
            </Text>
          </View>
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder={t('chats.sendMessage')}
          placeholderTextColor="#666"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sendMessage.isPending}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0E17' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#1A1929',
  },
  backText: { color: '#FFFFFE', fontSize: 24 },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#6C5CE7', alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: '#FFFFFE', fontSize: 16, fontWeight: '700' },
  headerName: { color: '#FFFFFE', fontSize: 17, fontWeight: '700' },
  messageList: { paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyChatText: { color: '#A7A9BE', fontSize: 16 },
  msgRow: { marginBottom: 8, flexDirection: 'row' },
  msgRowOwn: { justifyContent: 'flex-end' },
  msgBubble: { maxWidth: '78%', borderRadius: 16, padding: 10 },
  msgOwn: { backgroundColor: '#6C5CE7', borderBottomRightRadius: 4 },
  msgOther: { backgroundColor: '#1A1929', borderBottomLeftRadius: 4 },
  msgText: { color: '#FFFFFE', fontSize: 15, lineHeight: 20 },
  msgTime: { color: 'rgba(255,255,255,0.4)', fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: '#1A1929',
  },
  input: {
    flex: 1, backgroundColor: '#1A1929', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, color: '#FFFFFE',
    fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: '#2A2940',
  },
  sendButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#6C5CE7', alignItems: 'center', justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.3 },
  sendIcon: { color: '#FFFFFE', fontSize: 20, fontWeight: '700' },
});
