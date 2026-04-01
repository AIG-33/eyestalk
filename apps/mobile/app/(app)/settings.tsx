import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { colors, typography, spacing, radius } from '@/theme';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const clearSession = useAuthStore((s) => s.clearSession);
  const stealthMode = useUIStore((s) => s.stealthMode);
  const toggleStealth = useUIStore((s) => s.toggleStealth);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clearSession();
    router.replace('/(auth)/sign-in');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.deleteAccount'),
      t('profile.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            clearSession();
            router.replace('/(auth)/sign-in');
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/map')} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Account */}
        <SettingsGroup title="Account">
          <SettingsItem
            icon="person-outline"
            label={t('profile.editProfile')}
            onPress={() => router.push('/(app)/edit-profile' as any)}
          />
        </SettingsGroup>

        {/* Privacy */}
        <SettingsGroup title={t('settings.privacy')}>
          <View style={styles.toggleItem}>
            <View style={styles.toggleLeft}>
              <Ionicons name="eye-off-outline" size={20} color={colors.text.secondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemLabel}>{t('settings.stealthMode')}</Text>
                <Text style={styles.itemHint}>{t('settings.stealthModeHint')}</Text>
              </View>
            </View>
                   <Switch
                     value={stealthMode}
                     onValueChange={toggleStealth}
              trackColor={{ false: colors.bg.surface, true: colors.accent.primary }}
              thumbColor={colors.text.primary}
            />
          </View>
        </SettingsGroup>

        {/* Appearance */}
        <SettingsGroup title="Appearance">
          <SettingsItem
            icon="globe-outline"
            label={t('profile.language')}
            value={i18n.language === 'ru' ? 'Русский' : 'English'}
            onPress={() => i18n.changeLanguage(i18n.language === 'ru' ? 'en' : 'ru')}
          />
        </SettingsGroup>

        {/* Support */}
        <SettingsGroup title={t('settings.support')}>
          <SettingsItem icon="help-circle-outline" label={t('settings.faq')} hint={t('settings.faqHint')} onPress={() => {}} />
          <SettingsItem icon="document-text-outline" label={t('settings.guidelines')} hint={t('settings.guidelinesHint')} onPress={() => {}} />
        </SettingsGroup>

        {/* Danger zone */}
        <SettingsGroup title="Account">
          <TouchableOpacity style={styles.dangerItem} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={colors.accent.error} />
            <Text style={styles.dangerText}>{t('auth.signOut')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={20} color={colors.accent.error} />
            <Text style={styles.dangerText}>{t('profile.deleteAccount')}</Text>
          </TouchableOpacity>
        </SettingsGroup>

        <Text style={styles.version}>EyesTalk v0.1.0</Text>
      </ScrollView>
    </View>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

function SettingsItem({ icon, label, value, hint, onPress }: {
  icon: string; label: string; value?: string; hint?: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={20} color={colors.text.secondary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.itemLabel}>{label}</Text>
        {hint && <Text style={styles.itemHint}>{hint}</Text>}
      </View>
      {value && <Text style={styles.itemValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontSize: typography.size.headingLg, fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  group: { marginBottom: spacing.xl },
  groupTitle: {
    color: colors.text.tertiary, fontSize: typography.size.label,
    fontWeight: typography.weight.semibold, textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.caps, marginBottom: spacing.sm,
  },
  groupCard: {
    backgroundColor: colors.bg.secondary, borderRadius: radius.lg,
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  itemLabel: {
    flex: 1, fontSize: typography.size.bodyLg, color: colors.text.primary,
    fontWeight: typography.weight.medium,
  },
  itemHint: {
    fontSize: typography.size.bodySm, color: colors.text.tertiary, marginTop: 2,
  },
  itemValue: {
    fontSize: typography.size.bodyMd, color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  toggleItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  dangerItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  dangerText: {
    fontSize: typography.size.bodyLg, color: colors.accent.error,
    fontWeight: typography.weight.medium,
  },
  version: {
    color: colors.text.tertiary, fontSize: typography.size.bodySm,
    textAlign: 'center', marginTop: spacing.xl,
  },
});
