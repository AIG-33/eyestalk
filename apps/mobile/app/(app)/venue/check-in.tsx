import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useCheckin } from '@/hooks/use-checkin';
import { useLocation } from '@/hooks/use-location';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { colors, typography, spacing, radius, shadows } from '@/theme';

export default function CheckInScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { checkinMutation } = useCheckin();
  const { location } = useLocation();

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    if (!location) {
      Alert.alert(t('common.error'), t('qrScan.error'));
      setScanned(false);
      return;
    }

    const qrCode = extractQrCode(data);

    const { data: qrRecord, error: qrError } = await supabase
      .from('qr_codes')
      .select('venue_id')
      .eq('code', qrCode)
      .eq('is_active', true)
      .maybeSingle();

    if (qrError || !qrRecord) {
      Alert.alert(t('common.error'), t('qrScan.invalidCode'));
      setScanned(false);
      return;
    }

    checkinMutation.mutate(
      {
        venue_id: qrRecord.venue_id,
        qr_code: qrCode,
        lat: location.latitude,
        lng: location.longitude,
      },
      {
        onSuccess: (result) => {
          Alert.alert(
            t('qrScan.success'),
            t('venue.tokensEarned', {
              defaultValue: 'You earned {{count}} tokens!',
              count: result.tokens_earned,
            }),
            [{ text: t('common.ok'), onPress: () => router.canGoBack() ? router.back() : router.replace('/(app)/map') }],
          );
        },
        onError: () => {
          Alert.alert(t('qrScan.error'), t('qrScan.retryHint'));
          setScanned(false);
        },
      },
    );
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <View style={styles.permIcon}>
          <Ionicons name="camera-outline" size={48} color={colors.accent.primary} />
        </View>
        <Text style={styles.permTitle}>{t('qrScan.title')}</Text>
        <Text style={styles.permDesc}>{t('qrScan.hint')}</Text>
        <Button title="Grant Camera Access" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={[styles.overlay, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, spacing['4xl']) }]}>
          {/* Close */}
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/map')}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>

          {/* Title */}
          <View style={styles.topContent}>
            <Text style={styles.scanTitle}>{t('qrScan.title')}</Text>
            <Text style={styles.scanSubtitle}>{t('qrScan.hint')}</Text>
          </View>

          {/* Scan area */}
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {/* Status */}
          <View style={styles.bottomContent}>
            <View style={[styles.statusPill, scanned && styles.statusPillActive]}>
              {scanned ? (
                <>
                  <Ionicons name="location-outline" size={16} color={colors.accent.primary} />
                  <Text style={styles.statusText}>{t('qrScan.verifying')}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="scan-outline" size={16} color={colors.text.secondary} />
                  <Text style={styles.statusText}>{t('qrScan.scanning')}</Text>
                </>
              )}
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

function extractQrCode(qrData: string): string {
  // QR contains "eyestalk://checkin/EYESTALK-XXXX-XXXX" or just the code
  const match = qrData.match(/EYESTALK-[A-Z0-9-]+/i);
  if (match) return match[0];

  try {
    const url = new URL(qrData);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || qrData;
  } catch {
    return qrData;
  }
}

const CORNER_SIZE = 28;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1, backgroundColor: colors.bg.primary,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  permIcon: { marginBottom: spacing.xl },
  permTitle: {
    fontSize: typography.size.headingLg, fontWeight: typography.weight.bold,
    color: colors.text.primary, marginBottom: spacing.sm, textAlign: 'center',
  },
  permDesc: {
    fontSize: typography.size.bodyMd, color: colors.text.secondary,
    textAlign: 'center', lineHeight: typography.size.bodyMd * 1.5,
    marginBottom: spacing['3xl'],
  },
  camera: { flex: 1 },
  overlay: {
    flex: 1, justifyContent: 'space-between', alignItems: 'center',
  },
  closeBtn: {
    alignSelf: 'flex-end', marginRight: spacing.xl,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(13,13,26,0.6)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  topContent: { alignItems: 'center', paddingHorizontal: spacing['3xl'] },
  scanTitle: {
    fontSize: typography.size.headingLg, fontWeight: typography.weight.extrabold,
    color: colors.text.primary, marginBottom: spacing.sm, textAlign: 'center',
  },
  scanSubtitle: {
    fontSize: typography.size.bodyMd, color: colors.text.secondary,
    textAlign: 'center', lineHeight: typography.size.bodyMd * 1.5,
  },
  scanArea: { width: 260, height: 260, position: 'relative' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  topLeft: {
    top: 0, left: 0,
    borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH,
    borderColor: colors.accent.primary, borderTopLeftRadius: 4,
  },
  topRight: {
    top: 0, right: 0,
    borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH,
    borderColor: colors.accent.primary, borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH,
    borderColor: colors.accent.primary, borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH,
    borderColor: colors.accent.primary, borderBottomRightRadius: 4,
  },
  bottomContent: { alignItems: 'center' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: 'rgba(13,13,26,0.7)', paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md, borderRadius: radius.full,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  statusPillActive: {
    borderColor: 'rgba(124,111,247,0.3)',
    backgroundColor: 'rgba(124,111,247,0.15)',
  },
  statusText: {
    color: colors.text.secondary, fontSize: typography.size.bodyMd,
    fontWeight: typography.weight.medium,
  },
});
