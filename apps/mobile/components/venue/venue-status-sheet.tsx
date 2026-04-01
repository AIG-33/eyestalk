import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { STATUS_TAGS } from '@eyestalk/shared/constants';
import { Button } from '@/components/ui/button';
import { colors, typography, spacing, radius, shadows, component } from '@/theme';

interface Props {
  checkinId: string;
  currentStatusTag: string | null;
  isVisible: boolean;
  onClose: () => void;
}

export function VenueStatusSheet({ checkinId, currentStatusTag, isVisible, onClose }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const updateCheckin = useMutation({
    mutationFn: async (updates: { status_tag?: string | null; is_visible?: boolean }) => {
      const { error } = await supabase
        .from('checkins')
        .update(updates)
        .eq('id', checkinId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin'] });
    },
  });

  const handleToggleVisibility = (value: boolean) => {
    updateCheckin.mutate({ is_visible: value });
  };

  const handleSelectStatus = (tag: string) => {
    const newTag = tag === currentStatusTag ? null : tag;
    updateCheckin.mutate({ status_tag: newTag });
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* Visibility toggle */}
        <View style={styles.visibilityRow}>
          <View style={styles.visibilityInfo}>
            <Text style={styles.visibilityLabel}>{t('profile.visibility')}</Text>
            <Text style={styles.visibilityHint}>{t('profile.visibilityHint')}</Text>
          </View>
          <Switch
            value={isVisible}
            onValueChange={handleToggleVisibility}
            trackColor={{ false: colors.bg.surface, true: colors.accent.primary }}
            thumbColor={colors.text.primary}
          />
        </View>

        {/* Status tags */}
        <Text style={styles.sectionTitle}>{t('profile.statusTag')}</Text>
        <Text style={styles.sectionHint}>{t('profile.statusTagHint')}</Text>

        <View style={styles.tagGrid}>
          {STATUS_TAGS.map((tag) => {
            const isActive = currentStatusTag === tag;
            const statusHint = t(`status.hint.${tag}`, { defaultValue: '' });
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.tagChip, isActive && styles.tagChipActive]}
                onPress={() => handleSelectStatus(tag)}
              >
                <Text style={[styles.tagText, isActive && styles.tagTextActive]}>
                  {t(`status.${tag}`)}
                </Text>
                {isActive && statusHint ? (
                  <Text style={styles.tagHint}>{statusHint}</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {!isVisible && (
          <View style={styles.visibilityWarning}>
            <Text style={styles.visibilityWarningText}>{t('profile.visibilityOffHint')}</Text>
          </View>
        )}

        <Button title={t('common.done')} onPress={onClose} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-end', zIndex: 100,
  },
  backdrop: {
    flex: 1, backgroundColor: component.bottomSheet.backdrop,
  },
  sheet: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: component.bottomSheet.radius,
    borderTopRightRadius: component.bottomSheet.radius,
    padding: spacing['2xl'], paddingBottom: spacing['4xl'],
  },
  handle: {
    width: component.bottomSheet.handleWidth,
    height: component.bottomSheet.handleHeight,
    borderRadius: 2,
    backgroundColor: component.bottomSheet.handleColor,
    alignSelf: 'center', marginBottom: spacing.xl,
  },
  visibilityRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing['2xl'], paddingBottom: spacing.xl,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  visibilityInfo: { flex: 1, marginRight: spacing.md },
  visibilityLabel: {
    color: colors.text.primary, fontSize: typography.size.headingSm,
    fontWeight: typography.weight.bold, marginBottom: spacing.xs,
  },
  visibilityHint: {
    color: colors.text.secondary, fontSize: typography.size.bodySm,
  },
  sectionTitle: {
    color: colors.text.primary, fontSize: typography.size.headingSm,
    fontWeight: typography.weight.bold, marginBottom: spacing.xs,
  },
  sectionHint: {
    color: colors.text.secondary, fontSize: typography.size.bodySm,
    marginBottom: spacing.lg,
  },
  tagGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  tagChip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radius.full, backgroundColor: colors.bg.primary,
    borderWidth: 1, borderColor: colors.bg.surface,
  },
  tagChipActive: {
    backgroundColor: colors.accent.primary, borderColor: colors.accent.primary,
    ...shadows.glowPrimary,
  },
  tagText: {
    color: colors.text.secondary, fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.medium,
  },
  tagTextActive: { color: '#FFFFFF' },
  tagHint: {
    color: 'rgba(255,255,255,0.6)', fontSize: typography.size.micro,
    marginTop: 2,
  },
  visibilityWarning: {
    backgroundColor: 'rgba(255,217,61,0.08)', borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.xl,
    borderWidth: 1, borderColor: 'rgba(255,217,61,0.15)',
  },
  visibilityWarningText: {
    color: colors.accent.warning, fontSize: typography.size.bodySm,
    textAlign: 'center', lineHeight: typography.size.bodySm * 1.5,
  },
});
