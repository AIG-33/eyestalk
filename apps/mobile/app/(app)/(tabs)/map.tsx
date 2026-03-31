import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function MapScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>EyesTalk</Text>
        <Text style={styles.subtitle}>{t('map.discoverVenues')}</Text>
      </View>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>{t('map.placeholder')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0E17',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFE',
  },
  subtitle: {
    fontSize: 14,
    color: '#A7A9BE',
    marginTop: 4,
  },
  mapPlaceholder: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    backgroundColor: '#1A1929',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#A7A9BE',
    fontSize: 16,
  },
});
