import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCheckin } from '@/hooks/use-checkin';
import { useLocation } from '@/hooks/use-location';

export default function CheckInScreen() {
  const { t } = useTranslation();
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { checkinMutation } = useCheckin();
  const { location } = useLocation();

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    if (!location) {
      Alert.alert(t('common.error'), t('venue.locationRequired', { defaultValue: 'Location is required for check-in' }));
      setScanned(false);
      return;
    }

    checkinMutation.mutate(
      {
        venue_id: extractVenueId(data),
        qr_code: data,
        lat: location.latitude,
        lng: location.longitude,
      },
      {
        onSuccess: (result) => {
          Alert.alert(
            t('venue.checkedIn'),
            t('venue.tokensEarned', {
              defaultValue: 'You earned {{count}} tokens!',
              count: result.tokens_earned,
            }),
            [{ text: t('common.ok'), onPress: () => router.back() }],
          );
        },
        onError: (error) => {
          Alert.alert(t('common.error'), error.message);
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
        <Text style={styles.permissionText}>
          {t('venue.cameraPermission', { defaultValue: 'Camera permission is needed to scan QR codes' })}
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>
            {t('venue.grantPermission', { defaultValue: 'Grant Permission' })}
          </Text>
        </TouchableOpacity>
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
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <Text style={styles.hint}>
            {scanned
              ? t('common.loading')
              : t('venue.scanHint', { defaultValue: 'Point at the QR code in the venue' })}
          </Text>
        </View>
      </CameraView>
    </View>
  );
}

function extractVenueId(qrData: string): string {
  try {
    const url = new URL(qrData);
    return url.searchParams.get('venue') || qrData;
  } catch {
    return qrData;
  }
}

const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1, backgroundColor: '#0F0E17',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
  },
  permissionText: { color: '#A7A9BE', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  permissionButton: { backgroundColor: '#6C5CE7', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  permissionButtonText: { color: '#FFFFFE', fontSize: 16, fontWeight: '700' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 60 },
  closeButton: {
    alignSelf: 'flex-end', marginRight: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  closeText: { color: '#FFFFFE', fontSize: 20 },
  scanArea: { width: 250, height: 250, position: 'relative' },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  topLeft: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderColor: '#6C5CE7' },
  topRight: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderColor: '#6C5CE7' },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderColor: '#6C5CE7' },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderColor: '#6C5CE7' },
  hint: {
    color: '#FFFFFE', fontSize: 16, fontWeight: '600', textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
  },
});
