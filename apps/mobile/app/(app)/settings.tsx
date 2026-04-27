import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { useTheme, typography, spacing, radius } from '@/theme';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { c, isDark } = useTheme();
  const clearSession = useAuthStore((s) => s.clearSession);
  const stealthMode = useUIStore((s) => s.stealthMode);
  const toggleStealth = useUIStore((s) => s.toggleStealth);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const borderColorFaint = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

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
            try {
              await api.delete('/api/v1/account');
            } catch (e) {
              const msg = e instanceof ApiError ? e.message : String(e);
              Alert.alert(
                t('profile.deleteAccount'),
                t('profile.deleteAccountFailed', { defaultValue: 'Could not delete account: {{msg}}. Please try again or contact support.', msg }),
              );
              return;
            }
            await supabase.auth.signOut().catch(() => undefined);
            clearSession();
            router.replace('/(auth)/sign-in');
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg.primary }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 52, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
      }}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/map')} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={24} color={c.text.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: typography.size.headingLg, fontWeight: typography.weight.bold, color: c.text.primary }}>
          Settings
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 40 }}>
        {/* Account */}
        <SettingsGroup title="Account" c={c} borderColor={borderColor}>
          <SettingsItem
            icon="person-outline"
            label={t('profile.editProfile')}
            onPress={() => router.push('/(app)/edit-profile' as any)}
            c={c} borderColor={borderColorFaint}
          />
        </SettingsGroup>

        {/* Privacy */}
        <SettingsGroup title={t('settings.privacy')} c={c} borderColor={borderColor}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: borderColorFaint,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
              <Ionicons name="eye-off-outline" size={20} color={c.text.secondary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: typography.size.bodyLg, color: c.text.primary, fontWeight: typography.weight.medium }}>
                  {t('settings.stealthMode')}
                </Text>
                <Text style={{ fontSize: typography.size.bodySm, color: c.text.tertiary, marginTop: 2 }}>
                  {t('settings.stealthModeHint')}
                </Text>
              </View>
            </View>
            <Switch
              value={stealthMode}
              onValueChange={toggleStealth}
              trackColor={{ false: c.bg.surface, true: c.accent.primary }}
              thumbColor={c.text.primary}
            />
          </View>
        </SettingsGroup>

        {/* Appearance */}
        <SettingsGroup title="Appearance" c={c} borderColor={borderColor}>
          {/* Theme Toggle */}
          <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: borderColorFaint }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
              <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={20} color={c.text.secondary} />
              <Text style={{ flex: 1, fontSize: typography.size.bodyLg, color: c.text.primary, fontWeight: typography.weight.medium }}>
                {i18n.language === 'ru' ? 'Тема' : 'Theme'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                onPress={() => setTheme('dark')}
                activeOpacity={0.7}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: spacing.sm, paddingVertical: 12, borderRadius: radius.md,
                  backgroundColor: theme === 'dark' ? c.accent.primary + '22' : c.bg.tertiary,
                  borderWidth: 1.5,
                  borderColor: theme === 'dark' ? c.accent.primary : 'transparent',
                }}
              >
                <Text style={{ fontSize: 18 }}>🌙</Text>
                <Text style={{
                  fontSize: typography.size.bodyMd, fontWeight: typography.weight.semibold,
                  color: theme === 'dark' ? c.accent.primary : c.text.secondary,
                }}>
                  {i18n.language === 'ru' ? 'Тёмная' : 'Dark'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTheme('light')}
                activeOpacity={0.7}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: spacing.sm, paddingVertical: 12, borderRadius: radius.md,
                  backgroundColor: theme === 'light' ? c.accent.primary + '22' : c.bg.tertiary,
                  borderWidth: 1.5,
                  borderColor: theme === 'light' ? c.accent.primary : 'transparent',
                }}
              >
                <Text style={{ fontSize: 18 }}>☀️</Text>
                <Text style={{
                  fontSize: typography.size.bodyMd, fontWeight: typography.weight.semibold,
                  color: theme === 'light' ? c.accent.primary : c.text.secondary,
                }}>
                  {i18n.language === 'ru' ? 'Светлая' : 'Light'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Language */}
          <SettingsItem
            icon="globe-outline"
            label={t('profile.language')}
            value={i18n.language === 'ru' ? 'Русский' : 'English'}
            onPress={() => i18n.changeLanguage(i18n.language === 'ru' ? 'en' : 'ru')}
            c={c} borderColor={borderColorFaint}
          />
        </SettingsGroup>

        {/* Support */}
        <SettingsGroup title={t('settings.support')} c={c} borderColor={borderColor}>
          <SettingsItem icon="help-circle-outline" label={t('settings.faq')} hint={t('settings.faqHint')} onPress={() => {}} c={c} borderColor={borderColorFaint} />
          <SettingsItem icon="document-text-outline" label={t('settings.guidelines')} hint={t('settings.guidelinesHint')} onPress={() => {}} c={c} borderColor={borderColorFaint} />
        </SettingsGroup>

        {/* Danger zone */}
        <SettingsGroup title="Account" c={c} borderColor={borderColor}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: borderColorFaint }}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color={c.accent.error} />
            <Text style={{ fontSize: typography.size.bodyLg, color: c.accent.error, fontWeight: typography.weight.medium }}>
              {t('auth.signOut')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: borderColorFaint }}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color={c.accent.error} />
            <Text style={{ fontSize: typography.size.bodyLg, color: c.accent.error, fontWeight: typography.weight.medium }}>
              {t('profile.deleteAccount')}
            </Text>
          </TouchableOpacity>
        </SettingsGroup>

        <Text style={{ color: c.text.tertiary, fontSize: typography.size.bodySm, textAlign: 'center', marginTop: spacing.xl }}>
          EyesTalk v0.1.0
        </Text>
      </ScrollView>
    </View>
  );
}

function SettingsGroup({ title, children, c, borderColor }: {
  title: string; children: React.ReactNode; c: any; borderColor: string;
}) {
  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text style={{
        color: c.text.tertiary, fontSize: typography.size.label,
        fontWeight: typography.weight.semibold, textTransform: 'uppercase',
        letterSpacing: typography.letterSpacing.caps, marginBottom: spacing.sm,
      }}>
        {title}
      </Text>
      <View style={{
        backgroundColor: c.bg.secondary, borderRadius: radius.lg,
        overflow: 'hidden', borderWidth: 1, borderColor,
      }}>
        {children}
      </View>
    </View>
  );
}

function SettingsItem({ icon, label, value, hint, onPress, c, borderColor }: {
  icon: string; label: string; value?: string; hint?: string; onPress: () => void;
  c: any; borderColor: string;
}) {
  return (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: borderColor }}
      onPress={onPress} activeOpacity={0.7}
    >
      <Ionicons name={icon as any} size={20} color={c.text.secondary} />
      <View style={{ flex: 1 }}>
        <Text style={{ flex: 1, fontSize: typography.size.bodyLg, color: c.text.primary, fontWeight: typography.weight.medium }}>
          {label}
        </Text>
        {hint && <Text style={{ fontSize: typography.size.bodySm, color: c.text.tertiary, marginTop: 2 }}>{hint}</Text>}
      </View>
      {value && <Text style={{ fontSize: typography.size.bodyMd, color: c.text.secondary, marginRight: spacing.sm }}>{value}</Text>}
      <Ionicons name="chevron-forward" size={16} color={c.text.tertiary} />
    </TouchableOpacity>
  );
}
