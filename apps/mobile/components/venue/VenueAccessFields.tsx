import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { CheckinMethod, CheckoutPolicy } from '@eyestalk/shared/constants';
import { Input } from '@/components/ui/input';
import {
  CHECKIN_METHOD_OPTIONS,
  CHECKOUT_POLICY_OPTIONS,
} from '@/lib/checkin-options';
import { useTheme, typography, spacing, radius, type ThemeColors } from '@/theme';

interface Props {
  methods: CheckinMethod[];
  onToggleMethod: (m: CheckinMethod) => void;
  checkoutPolicy: CheckoutPolicy[];
  onTogglePolicy: (p: CheckoutPolicy) => void;
  code: string;
  onChangeCode: (v: string) => void;
  /** Show the "venue closes / event ends" policy (only meaningful for pop-ups). */
  allowVenueClose?: boolean;
}

/**
 * Owner-facing selectors for how guests check in (multi-select) and how they are
 * automatically checked out (multi-select, with a mutually-exclusive "manual only").
 * Shared between the create-venue and edit-venue screens for a consistent look.
 */
export function VenueAccessFields({
  methods,
  onToggleMethod,
  checkoutPolicy,
  onTogglePolicy,
  code,
  onChangeCode,
  allowVenueClose = true,
}: Props) {
  const { t } = useTranslation();
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);

  const policyOptions = allowVenueClose
    ? CHECKOUT_POLICY_OPTIONS
    : CHECKOUT_POLICY_OPTIONS.filter((o) => o.key !== 'venue_close');

  return (
    <>
      {/* How people check in */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>{t('checkinMethods.title')}</Text>
        <Text style={s.sectionHint}>{t('checkinMethods.subtitle')}</Text>
        <View style={s.optionList}>
          {CHECKIN_METHOD_OPTIONS.map((opt) => {
            const active = methods.includes(opt.key);
            return (
              <OptionCard
                key={opt.key}
                active={active}
                icon={opt.icon}
                title={t(opt.labelKey)}
                hint={t(opt.hintKey)}
                onPress={() => onToggleMethod(opt.key)}
                s={s}
                c={c}
              />
            );
          })}
        </View>

        {methods.includes('code') && (
          <View style={s.codeWrap}>
            <Input
              label={t('checkinMethods.codeLabel')}
              value={code}
              onChangeText={onChangeCode}
              placeholder={t('checkinMethods.codePlaceholder')}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={50}
            />
            <Text style={s.sectionHint}>{t('checkinMethods.codeInputHint')}</Text>
          </View>
        )}
      </View>

      {/* How the auto check-out works */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>{t('checkoutPolicies.title')}</Text>
        <Text style={s.sectionHint}>{t('checkoutPolicies.subtitle')}</Text>
        <View style={s.optionList}>
          {policyOptions.map((opt) => {
            const active = checkoutPolicy.includes(opt.key);
            return (
              <OptionCard
                key={opt.key}
                active={active}
                icon={opt.icon}
                title={t(opt.labelKey)}
                hint={t(opt.hintKey)}
                onPress={() => onTogglePolicy(opt.key)}
                s={s}
                c={c}
              />
            );
          })}
        </View>
      </View>
    </>
  );
}

function OptionCard({
  active, icon, title, hint, onPress, s, c,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint: string;
  onPress: () => void;
  s: any;
  c: ThemeColors;
}) {
  return (
    <TouchableOpacity
      style={[s.optionCard, active && s.optionCardActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[s.optionIcon, active && s.optionIconActive]}>
        <Ionicons
          name={icon}
          size={18}
          color={active ? c.accent.primaryLight : c.text.tertiary}
        />
      </View>
      <View style={s.optionInfo}>
        <Text style={[s.optionTitle, active && { color: c.accent.primaryLight }]}>{title}</Text>
        <Text style={s.optionHint}>{hint}</Text>
      </View>
      <Ionicons
        name={active ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={active ? c.accent.primary : c.text.tertiary}
      />
    </TouchableOpacity>
  );
}

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  return StyleSheet.create({
    section: { marginBottom: spacing.lg },
    sectionLabel: {
      color: c.text.secondary,
      fontSize: typography.size.bodySm,
      fontWeight: typography.weight.semibold,
      marginBottom: spacing.xs,
    },
    sectionHint: {
      color: c.text.tertiary,
      fontSize: typography.size.bodySm,
      marginBottom: spacing.md,
      lineHeight: typography.size.bodySm * 1.4,
    },
    optionList: { gap: spacing.sm },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor,
      backgroundColor: c.bg.secondary,
    },
    optionCardActive: {
      borderColor: c.accent.primary,
      backgroundColor: isDark ? 'rgba(124,111,247,0.10)' : 'rgba(124,111,247,0.06)',
    },
    optionIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },
    optionIconActive: {
      backgroundColor: isDark ? 'rgba(124,111,247,0.16)' : 'rgba(124,111,247,0.10)',
    },
    optionInfo: { flex: 1, gap: 2 },
    optionTitle: {
      color: c.text.primary,
      fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.semibold,
    },
    optionHint: {
      color: c.text.tertiary,
      fontSize: typography.size.bodySm,
      lineHeight: typography.size.bodySm * 1.35,
    },
    codeWrap: { marginTop: spacing.md },
  });
}
