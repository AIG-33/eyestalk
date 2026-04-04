import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { REPORT_REASONS } from '@eyestalk/shared/constants';

interface Props {
  targetUserId: string;
  venueId: string;
  reportedMessageId?: string;
  onClose: () => void;
}

export function ReportModal({ targetUserId, venueId, reportedMessageId, onClose }: Props) {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');

  const submitReport = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('reports').insert({
        reporter_id: session!.user.id,
        reported_user_id: targetUserId,
        reported_message_id: reportedMessageId || null,
        venue_id: venueId,
        reason,
        description: description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      Alert.alert(t('safety.reportSent'));
      onClose();
    },
    onError: (err) => Alert.alert(t('common.error'), err.message),
  });

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{t('safety.report')}</Text>
        <Text style={styles.hintText}>{t('safety.reportHint')}</Text>

        <Text style={styles.label}>{t('safety.reportReason')}</Text>
        <Text style={styles.sublabel}>{t('safety.reportReasonHint')}</Text>
        <View style={styles.reasonGrid}>
          {REPORT_REASONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.reasonChip, reason === r && styles.reasonChipActive]}
              onPress={() => setReason(r)}
            >
              <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>
                {t(`safety.reasons.${r}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('safety.reportDescription')}</Text>
        <Text style={styles.sublabel}>{t('safety.reportDescriptionHint')}</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="..."
          placeholderTextColor="#666"
          multiline
          maxLength={1000}
        />

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, !reason && { opacity: 0.4 }]}
            onPress={() => submitReport.mutate()}
            disabled={!reason || submitReport.isPending}
          >
            <Text style={styles.submitText}>{t('safety.reportSubmit')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export function blockRelationQueryKey(blockerId: string, blockedUserId: string) {
  return ['block-relation', blockerId, blockedUserId] as const;
}

export function useBlockUser() {
  const session = useAuthStore((s) => s.session);
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedUserId: string) => {
      const { error } = await supabase.from('blocks').insert({
        blocker_id: session!.user.id,
        blocked_id: blockedUserId,
      });
      if (error) throw error;
    },
    onSuccess: (_, blockedUserId) => {
      if (session?.user.id) {
        void queryClient.invalidateQueries({
          queryKey: blockRelationQueryKey(session.user.id, blockedUserId),
        });
      }
      Alert.alert(t('common.done'));
    },
  });
}

export function useUnblockUser() {
  const session = useAuthStore((s) => s.session);
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blockedUserId: string) => {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', session!.user.id)
        .eq('blocked_id', blockedUserId);
      if (error) throw error;
    },
    onSuccess: (_, blockedUserId) => {
      if (session?.user.id) {
        void queryClient.invalidateQueries({
          queryKey: blockRelationQueryKey(session.user.id, blockedUserId),
        });
      }
      Alert.alert(t('common.done'));
    },
  });
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-end', zIndex: 100,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#1A1929', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#2A2940',
    alignSelf: 'center', marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#FFFFFE', marginBottom: 8 },
  hintText: { fontSize: 13, color: '#A7A9BE', marginBottom: 20, lineHeight: 19 },
  sublabel: { fontSize: 12, color: '#666', marginBottom: 8 },
  label: {
    fontSize: 13, fontWeight: '600', color: '#A7A9BE', marginBottom: 10,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  reasonChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
    backgroundColor: '#0F0E17', borderWidth: 1, borderColor: '#2A2940',
  },
  reasonChipActive: { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' },
  reasonText: { color: '#A7A9BE', fontSize: 13, fontWeight: '500' },
  reasonTextActive: { color: '#FFFFFE' },
  input: {
    backgroundColor: '#0F0E17', borderRadius: 12, padding: 14, fontSize: 14,
    color: '#FFFFFE', borderWidth: 1, borderColor: '#2A2940',
    minHeight: 80, textAlignVertical: 'top', marginBottom: 20,
  },
  buttons: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: '#0F0E17', borderWidth: 1, borderColor: '#2A2940',
  },
  cancelText: { color: '#A7A9BE', fontSize: 15, fontWeight: '600' },
  submitBtn: {
    flex: 1, padding: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: '#FF6B6B',
  },
  submitText: { color: '#FFFFFE', fontSize: 15, fontWeight: '700' },
});
