import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const clearSession = useAuthStore((s) => s.clearSession);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clearSession();
    router.replace('/(auth)/sign-in');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ru' ? 'en' : 'ru';
    i18n.changeLanguage(newLang);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tabs.profile')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.email}>{session?.user.email}</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem} onPress={toggleLanguage}>
          <Text style={styles.menuText}>{t('profile.language')}</Text>
          <Text style={styles.menuValue}>{i18n.language === 'ru' ? 'Русский' : 'English'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>{t('auth.signOut')}</Text>
      </TouchableOpacity>
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
  card: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: '#1A1929',
    borderRadius: 16,
    marginBottom: 24,
  },
  email: {
    fontSize: 16,
    color: '#FFFFFE',
  },
  section: {
    marginHorizontal: 16,
    backgroundColor: '#1A1929',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2940',
  },
  menuText: {
    fontSize: 16,
    color: '#FFFFFE',
  },
  menuValue: {
    fontSize: 14,
    color: '#A7A9BE',
  },
  signOutButton: {
    marginHorizontal: 16,
    marginTop: 32,
    padding: 16,
    backgroundColor: '#1A1929',
    borderRadius: 16,
    alignItems: 'center',
  },
  signOutText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
});
