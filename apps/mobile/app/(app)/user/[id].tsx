import { useMemo, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, Dimensions, StyleSheet,
  Modal, Pressable, ActivityIndicator, Alert, Animated, PanResponder, Linking,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSendWave } from '@/hooks/use-send-wave';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { useProfilePhotos, usePhotoAccessStatus } from '@/hooks/use-photos';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar } from '@/components/ui/avatar';
import { Tag } from '@/components/ui/tag';
import { ReportModal, useBlockUser, useUnblockUser, blockRelationQueryKey } from '@/components/ui/report-modal';
import { ScreenHeader } from '@/components/ui/screen-header';
import { haptic } from '@/lib/haptics';
import { useTheme, typography, spacing, radius } from '@/theme';
import type { ThemeColors } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_GAP = 6;
const PHOTO_COLS = 3;
const PHOTO_SIZE = (SCREEN_WIDTH - spacing.xl * 2 - PHOTO_GAP * (PHOTO_COLS - 1)) / PHOTO_COLS;

export default function UserProfileScreen() {
  const { id: userId, venueId } = useLocalSearchParams<{ id: string; venueId?: string }>();
  const { t, i18n } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const isRu = i18n.language === 'ru';
  const isOwnProfile = userId === session?.user.id;
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, age_range, avatar_url, bio, interests, is_verified, industry, hobbies, favorite_movie, favorite_band, about_me, instagram, telegram, linkedin')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: photos = [], refetch: refetchPhotos } = useProfilePhotos(userId);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchPhotos()]);
    setRefreshing(false);
  }, [refetchProfile, refetchPhotos]);
  const { data: hasAccess } = usePhotoAccessStatus(userId);

  const publicPhotos = photos.filter((p) => p.is_public);
  const privatePhotos = photos.filter((p) => !p.is_public);
  const visiblePrivatePhotos = hasAccess ? privatePhotos : [];
  const hiddenCount = hasAccess ? 0 : privatePhotos.length;

  const startChat = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ chat: any }>('/chats', {
        target_user_id: userId,
        venue_id: venueId,
      });
      return res.chat;
    },
    onSuccess: (chat) => {
      router.push(`/(app)/chat/${chat.id}` as any);
    },
    onError: (err: any) => {
      const msg = err?.message || err?.error || 'Unknown error';
      Alert.alert(isRu ? 'Ошибка' : 'Error', msg);
    },
  });

  const blockerId = session?.user?.id ?? '';
  const { data: blockRelation } = useQuery({
    queryKey: blockRelationQueryKey(blockerId, userId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocks')
        .select('id')
        .eq('blocker_id', blockerId)
        .eq('blocked_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!blockerId && !!userId && !isOwnProfile,
  });

  const isBlocked = !!blockRelation;
  const blockBusy = blockUser.isPending || unblockUser.isPending;
  const sendWave = useSendWave();

  const { data: waveStatus } = useQuery({
    queryKey: ['wave-status', venueId, userId, blockerId],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('mutual_interests')
        .select('from_user_id, to_user_id, is_mutual')
        .eq('venue_id', venueId!)
        .eq('type', 'wave')
        .or(
          `and(from_user_id.eq.${blockerId},to_user_id.eq.${userId}),and(from_user_id.eq.${userId},to_user_id.eq.${blockerId})`,
        );
      if (error) throw error;
      const list = rows || [];
      const mutual = list.some((r: { is_mutual: boolean }) => r.is_mutual);
      const sent = list.some(
        (r: { from_user_id: string; to_user_id: string }) =>
          r.from_user_id === blockerId && r.to_user_id === userId,
      );
      const received = list.some(
        (r: { from_user_id: string; to_user_id: string }) =>
          r.from_user_id === userId && r.to_user_id === blockerId,
      );
      return { mutual, sent, received };
    },
    enabled: !!venueId && !!userId && !!blockerId && !isOwnProfile,
  });

  const waveDisabled =
    isBlocked ||
    sendWave.isPending ||
    !!waveStatus?.mutual ||
    !!waveStatus?.sent;

  const openReport = () => {
    if (!venueId) {
      Alert.alert(isRu ? 'Ошибка' : 'Error', isRu ? 'Нет контекста venue' : 'No venue context');
      return;
    }
    setReportOpen(true);
  };

  const confirmBlock = () => {
    Alert.alert(t('safety.blockConfirm'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('safety.block'),
        style: 'destructive',
        onPress: () => userId && blockUser.mutate(userId),
      },
    ]);
  };

  const confirmUnblock = () => {
    Alert.alert(t('safety.unblock'), t('safety.unblockConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('safety.unblock'),
        onPress: () => userId && unblockUser.mutate(userId),
      },
    ]);
  };

  return (
    <View style={s.screenRoot}>
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 60 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent.primary} />
      }
    >
      <ScreenHeader title={profile?.nickname || '...'} />

      {/* Avatar + info */}
      <View style={s.profileSection}>
        <LinearGradient
          colors={c.gradient.primary as unknown as [string, string]}
          style={s.avatarGradient}
        >
          {profile?.avatar_url ? (
            <TouchableOpacity activeOpacity={0.85} onPress={() => setFullscreenPhoto(profile.avatar_url)}>
              <Image source={{ uri: profile.avatar_url }} style={s.avatar} />
            </TouchableOpacity>
          ) : (
            <View style={[s.avatar, { backgroundColor: c.bg.secondary, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={s.avatarInitial}>
                {(profile?.nickname || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </LinearGradient>

        <Text style={s.nickname}>{profile?.nickname}</Text>

        {profile?.age_range && (
          <Text style={s.ageRange}>{profile.age_range}</Text>
        )}

        {profile?.interests && profile.interests.length > 0 && (
          <View style={s.interests}>
            {profile.interests.map((interest: string) => (
              <Tag key={interest} label={t(`interests.${interest}`, { defaultValue: interest })} variant="intention" />
            ))}
          </View>
        )}

        {!isOwnProfile && (
          <>
            {venueId ? (
              <Text style={s.waveHint}>{t('chats.directWaveHint')}</Text>
            ) : (
              <Text style={s.waveHintMuted}>{t('venue.waveExplain')}</Text>
            )}
            {venueId && (
              <TouchableOpacity
                style={[
                  s.wavePrimaryBtn,
                  waveDisabled && s.wavePrimaryBtnDisabled,
                  waveStatus?.mutual && s.wavePrimaryBtnMatched,
                ]}
                disabled={waveDisabled}
                onPress={() => {
                  if (!userId || !venueId) return;
                  haptic.light();
                  sendWave.mutate(
                    { targetUserId: userId, venueId },
                    {
                      onSuccess: (data) => {
                        haptic.success();
                        if (!data.is_mutual) {
                          Alert.alert('👋', t('venue.waveSent', { defaultValue: 'Wave sent!' }));
                        }
                      },
                      onError: (err: Error) => {
                        Alert.alert(isRu ? 'Ошибка' : 'Error', err.message || '');
                      },
                    },
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  waveStatus?.mutual
                    ? t('chats.matchedShort')
                    : waveStatus?.sent
                      ? t('chats.waveSentShort')
                      : waveStatus?.received
                        ? t('chats.waveBack')
                        : t('chats.waveAction')
                }
              >
                {sendWave.isPending ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons
                      name={waveStatus?.mutual ? 'heart' : 'hand-right-outline'}
                      size={22}
                      color="#FFF"
                    />
                    <Text
                      style={[
                        s.wavePrimaryBtnText,
                        waveDisabled && !waveStatus?.mutual && { color: c.text.secondary },
                      ]}
                    >
                      {waveStatus?.mutual
                        ? t('chats.matchedShort')
                        : waveStatus?.sent
                          ? t('chats.waveSentShort')
                          : waveStatus?.received
                            ? t('chats.waveBack')
                            : t('chats.waveAction')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          <View style={s.actionRow}>
            <TouchableOpacity
              style={s.chatBtn}
              onPress={() => {
                if (!venueId) {
                  Alert.alert(isRu ? 'Ошибка' : 'Error', isRu ? 'Нет контекста venue' : 'No venue context');
                  return;
                }
                startChat.mutate();
              }}
              disabled={startChat.isPending}
            >
              {startChat.isPending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="chatbubble" size={18} color="#FFF" />
                  <Text style={s.chatBtnText}>{isRu ? 'Написать' : 'Chat'}</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={s.reportBtn}
              onPress={openReport}
              accessibilityRole="button"
              accessibilityLabel={t('safety.report')}
            >
              <Ionicons name="flag-outline" size={18} color={c.accent.warning} />
              <Text style={s.reportBtnText} numberOfLines={1}>{t('safety.report')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={isBlocked ? s.unblockBtn : s.blockBtn}
              onPress={isBlocked ? confirmUnblock : confirmBlock}
              disabled={blockBusy}
              accessibilityRole="button"
              accessibilityLabel={isBlocked ? t('safety.unblock') : t('safety.block')}
            >
              {blockBusy ? (
                <ActivityIndicator size="small" color={isBlocked ? c.accent.success : c.accent.error} />
              ) : (
                <>
                  <Ionicons
                    name={isBlocked ? 'checkmark-circle-outline' : 'ban-outline'}
                    size={18}
                    color={isBlocked ? c.accent.success : c.accent.error}
                  />
                  <Text style={isBlocked ? s.unblockBtnText : s.blockBtnText} numberOfLines={1}>
                    {isBlocked ? t('safety.unblock') : t('safety.block')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          </>
        )}
      </View>

      {/* About & Details */}
      {(profile?.about_me || profile?.bio || profile?.industry || profile?.hobbies || profile?.favorite_movie || profile?.favorite_band) && (
        <View style={s.infoSection}>
          {(profile?.about_me || profile?.bio) && (
            <View style={s.infoBlock}>
              <Text style={s.sectionTitle}>{isRu ? 'О себе' : 'About'}</Text>
              <Text style={s.infoText}>{profile.about_me || profile.bio}</Text>
            </View>
          )}
          {profile?.industry && (
            <View style={s.infoRow}>
              <Ionicons name="briefcase-outline" size={18} color={c.text.tertiary} />
              <View style={s.infoRowContent}>
                <Text style={s.infoRowLabel}>{isRu ? 'Сфера деятельности' : 'Industry'}</Text>
                <Text style={s.infoRowValue}>{profile.industry}</Text>
              </View>
            </View>
          )}
          {profile?.hobbies && (
            <View style={s.infoRow}>
              <Ionicons name="heart-outline" size={18} color={c.text.tertiary} />
              <View style={s.infoRowContent}>
                <Text style={s.infoRowLabel}>{isRu ? 'Хобби' : 'Hobbies'}</Text>
                <Text style={s.infoRowValue}>{profile.hobbies}</Text>
              </View>
            </View>
          )}
          {profile?.favorite_movie && (
            <View style={s.infoRow}>
              <Ionicons name="film-outline" size={18} color={c.text.tertiary} />
              <View style={s.infoRowContent}>
                <Text style={s.infoRowLabel}>{isRu ? 'Любимый фильм' : 'Favorite movie'}</Text>
                <Text style={s.infoRowValue}>{profile.favorite_movie}</Text>
              </View>
            </View>
          )}
          {profile?.favorite_band && (
            <View style={s.infoRow}>
              <Ionicons name="musical-notes-outline" size={18} color={c.text.tertiary} />
              <View style={s.infoRowContent}>
                <Text style={s.infoRowLabel}>{isRu ? 'Любимая группа' : 'Favorite band'}</Text>
                <Text style={s.infoRowValue}>{profile.favorite_band}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Social Links */}
      {(profile?.instagram || profile?.telegram || profile?.linkedin) && (
        <View style={s.infoSection}>
          <Text style={s.sectionTitle}>{isRu ? 'Соцсети' : 'Social'}</Text>
          {profile?.instagram && (
            <TouchableOpacity
              style={s.socialLink}
              onPress={() => {
                const handle = profile.instagram!.replace(/^@/, '');
                Linking.openURL(`https://instagram.com/${handle}`);
              }}
            >
              <Ionicons name="logo-instagram" size={20} color="#E1306C" />
              <Text style={s.socialLinkText}>{profile.instagram}</Text>
              <Ionicons name="open-outline" size={14} color={c.text.tertiary} />
            </TouchableOpacity>
          )}
          {profile?.telegram && (
            <TouchableOpacity
              style={s.socialLink}
              onPress={() => {
                const handle = profile.telegram!.replace(/^@/, '');
                Linking.openURL(`https://t.me/${handle}`);
              }}
            >
              <Ionicons name="paper-plane-outline" size={20} color="#0088CC" />
              <Text style={s.socialLinkText}>{profile.telegram}</Text>
              <Ionicons name="open-outline" size={14} color={c.text.tertiary} />
            </TouchableOpacity>
          )}
          {profile?.linkedin && (
            <TouchableOpacity
              style={s.socialLink}
              onPress={() => {
                const url = profile.linkedin!.startsWith('http')
                  ? profile.linkedin!
                  : `https://linkedin.com/in/${profile.linkedin}`;
                Linking.openURL(url);
              }}
            >
              <Ionicons name="logo-linkedin" size={20} color="#0A66C2" />
              <Text style={s.socialLinkText}>{profile.linkedin}</Text>
              <Ionicons name="open-outline" size={14} color={c.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Photos */}
      {(publicPhotos.length > 0 || visiblePrivatePhotos.length > 0 || hiddenCount > 0) && (
        <View style={s.photosSection}>
          <Text style={s.sectionTitle}>
            {isRu ? 'Фото' : 'Photos'}
          </Text>

          <View style={s.grid}>
            {publicPhotos.map((photo) => (
              <TouchableOpacity key={photo.id} style={s.photoCard} activeOpacity={0.8} onPress={() => setFullscreenPhoto(photo.photo_url)}>
                <Image source={{ uri: photo.photo_url }} style={s.photoImage} />
              </TouchableOpacity>
            ))}

            {visiblePrivatePhotos.map((photo) => (
              <TouchableOpacity key={photo.id} style={s.photoCard} activeOpacity={0.8} onPress={() => setFullscreenPhoto(photo.photo_url)}>
                <Image source={{ uri: photo.photo_url }} style={s.photoImage} />
                <View style={s.privateBadge}>
                  <Ionicons name="lock-open" size={10} color="#FFF" />
                </View>
              </TouchableOpacity>
            ))}

            {hiddenCount > 0 && (
              <View style={[s.photoCard, s.hiddenCard]}>
                <Ionicons name="lock-closed" size={28} color={c.text.tertiary} />
                <Text style={s.hiddenText}>+{hiddenCount}</Text>
                <Text style={s.hiddenHint}>
                  {isRu ? 'Приватные' : 'Private'}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <Modal visible={!!fullscreenPhoto} transparent animationType="fade" onRequestClose={() => setFullscreenPhoto(null)}>
        <View style={s.fullscreenOverlay}>
          <TouchableOpacity style={s.fullscreenClose} onPress={() => setFullscreenPhoto(null)}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          {fullscreenPhoto && (
            <ZoomableImage uri={fullscreenPhoto} onClose={() => setFullscreenPhoto(null)} />
          )}
          <Text style={s.zoomHint}>Pinch to zoom</Text>
        </View>
      </Modal>
    </ScrollView>
    {reportOpen && venueId && userId && (
      <ReportModal
        targetUserId={userId}
        venueId={venueId}
        onClose={() => setReportOpen(false)}
      />
    )}
    </View>
  );
}

function ZoomableImage({ uri, onClose }: { uri: string; onClose: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastDist = useRef(0);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);
  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getDistance = (touches: any[]) => {
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches.length === 2) {
          lastDist.current = getDistance(evt.nativeEvent.touches);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length === 2) {
          const dist = getDistance(evt.nativeEvent.touches);
          if (lastDist.current > 0) {
            const newScale = Math.max(1, Math.min(5, lastScale.current * (dist / lastDist.current)));
            scale.setValue(newScale);
          }
        } else if (lastScale.current > 1) {
          translateX.setValue(lastTranslateX.current + gestureState.dx);
          translateY.setValue(lastTranslateY.current + gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const currentScale = (scale as any).__getValue?.() ?? lastScale.current;

        if (evt.nativeEvent.touches.length === 0 && lastDist.current > 0) {
          lastScale.current = currentScale;
          lastDist.current = 0;
          lastTranslateX.current = (translateX as any).__getValue?.() ?? 0;
          lastTranslateY.current = (translateY as any).__getValue?.() ?? 0;
        }

        if (currentScale <= 1.05 && Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
          if (tapTimeout.current) {
            clearTimeout(tapTimeout.current);
            tapTimeout.current = null;
            Animated.spring(scale, { toValue: 2.5, friction: 5, useNativeDriver: true }).start();
            lastScale.current = 2.5;
          } else {
            tapTimeout.current = setTimeout(() => {
              tapTimeout.current = null;
              onClose();
            }, 250);
          }
        }

        if (currentScale <= 1) {
          lastScale.current = 1;
          lastTranslateX.current = 0;
          lastTranslateY.current = 0;
          Animated.parallel([
            Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
            Animated.spring(translateX, { toValue: 0, friction: 5, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, friction: 5, useNativeDriver: true }),
          ]).start();
        }
      },
    }),
  ).current;

  return (
    <Animated.Image
      source={{ uri }}
      style={{
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH,
        transform: [{ scale }, { translateX }, { translateY }],
      }}
      resizeMode="contain"
      {...panResponder.panHandlers}
    />
  );
}

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  return StyleSheet.create({
    screenRoot: { flex: 1, backgroundColor: c.bg.primary },
    container: { flex: 1, backgroundColor: c.bg.primary },
    profileSection: { alignItems: 'center', marginBottom: spacing.xl },
    avatarGradient: {
      width: 120, height: 120, borderRadius: 60,
      alignItems: 'center', justifyContent: 'center', padding: 3,
      marginBottom: spacing.lg,
    },
    avatar: {
      width: 114, height: 114, borderRadius: 57,
      borderWidth: 3, borderColor: c.bg.primary,
    },
    avatarInitial: {
      color: c.text.primary, fontSize: 44, fontWeight: '700' as const,
    },
    nickname: {
      fontSize: typography.size.headingLg, fontWeight: typography.weight.extrabold,
      color: c.text.primary, marginBottom: spacing.xs,
    },
    ageRange: {
      fontSize: typography.size.bodyMd, color: c.text.secondary, marginBottom: spacing.md,
    },
    interests: {
      flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
      justifyContent: 'center', paddingHorizontal: spacing['3xl'],
    },
    infoSection: {
      paddingHorizontal: spacing.xl, marginBottom: spacing.xl,
    },
    infoBlock: { marginBottom: spacing.lg },
    infoText: {
      fontSize: typography.size.bodyMd, color: c.text.secondary,
      lineHeight: typography.size.bodyMd * 1.6,
    },
    infoRow: {
      flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1, borderBottomColor: borderColor,
    },
    infoRowContent: { flex: 1 },
    infoRowLabel: {
      fontSize: typography.size.bodySm, color: c.text.tertiary,
      marginBottom: 2,
    },
    infoRowValue: {
      fontSize: typography.size.bodyMd, color: c.text.primary,
      fontWeight: typography.weight.medium,
    },
    socialLink: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1, borderBottomColor: borderColor,
    },
    socialLinkText: {
      flex: 1, fontSize: typography.size.bodyMd, color: c.text.primary,
      fontWeight: typography.weight.medium,
    },

    photosSection: { paddingHorizontal: spacing.xl },
    sectionTitle: {
      fontSize: typography.size.label, fontWeight: typography.weight.semibold,
      color: c.text.secondary, textTransform: 'uppercase', letterSpacing: 1,
      marginBottom: spacing.md,
    },
    grid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: PHOTO_GAP,
    },
    photoCard: {
      width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: radius.md,
      overflow: 'hidden', borderWidth: 1, borderColor,
    },
    photoImage: { width: '100%', height: '100%' },
    privateBadge: {
      position: 'absolute', top: 4, right: 4,
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: 'rgba(0,229,160,0.7)', alignItems: 'center', justifyContent: 'center',
    },
    hiddenCard: {
      alignItems: 'center', justifyContent: 'center', gap: 4,
      backgroundColor: c.bg.secondary,
    },
    hiddenText: {
      color: c.text.tertiary, fontSize: typography.size.bodyLg,
      fontWeight: typography.weight.bold,
    },
    hiddenHint: {
      color: c.text.tertiary, fontSize: typography.size.micro,
    },
    waveHint: {
      fontSize: typography.size.bodySm,
      color: c.text.secondary,
      textAlign: 'center',
      marginTop: spacing.md,
      paddingHorizontal: spacing.xl,
      lineHeight: typography.size.bodySm * 1.45,
      width: '100%',
    },
    waveHintMuted: {
      fontSize: typography.size.bodySm,
      color: c.text.tertiary,
      textAlign: 'center',
      marginTop: spacing.md,
      paddingHorizontal: spacing.xl,
      lineHeight: typography.size.bodySm * 1.45,
      width: '100%',
    },
    wavePrimaryBtn: {
      marginTop: spacing.md,
      width: '100%',
      maxWidth: SCREEN_WIDTH - spacing.xl * 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md + 4,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.xl,
      backgroundColor: c.accent.pink,
    },
    wavePrimaryBtnDisabled: {
      backgroundColor: c.bg.tertiary,
      borderWidth: 1,
      borderColor: borderColor,
    },
    wavePrimaryBtnMatched: {
      backgroundColor: isDark ? 'rgba(0,229,160,0.35)' : 'rgba(0,201,141,0.25)',
      borderWidth: 1,
      borderColor: `${c.accent.success}66`,
    },
    wavePrimaryBtnText: {
      color: '#FFFFFE',
      fontSize: typography.size.bodyLg,
      fontWeight: typography.weight.bold,
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'stretch',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.lg,
      width: '100%',
      paddingHorizontal: spacing.md,
      maxWidth: SCREEN_WIDTH,
    },
    chatBtn: {
      flexGrow: 1,
      flexBasis: 120,
      minWidth: 100,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
      backgroundColor: c.accent.primary,
      paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
      borderRadius: radius.full,
    },
    chatBtnText: {
      color: '#FFF', fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.bold,
    },
    reportBtn: {
      flexGrow: 1,
      flexBasis: 100,
      minWidth: 88,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,217,61,0.35)' : 'rgba(230,184,0,0.45)',
      backgroundColor: c.bg.secondary,
    },
    reportBtnText: {
      color: c.accent.warning,
      fontSize: typography.size.bodySm,
      fontWeight: typography.weight.semibold,
    },
    blockBtn: {
      flexGrow: 1,
      flexBasis: 100,
      minWidth: 88,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: `${c.accent.error}55`,
      backgroundColor: c.bg.secondary,
    },
    blockBtnText: {
      color: c.accent.error,
      fontSize: typography.size.bodySm,
      fontWeight: typography.weight.semibold,
    },
    unblockBtn: {
      flexGrow: 1,
      flexBasis: 100,
      minWidth: 88,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: `${c.accent.success}55`,
      backgroundColor: c.bg.secondary,
    },
    unblockBtnText: {
      color: c.accent.success,
      fontSize: typography.size.bodySm,
      fontWeight: typography.weight.semibold,
    },
    fullscreenOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.92)',
      alignItems: 'center', justifyContent: 'center',
    },
    fullscreenClose: {
      position: 'absolute', top: 56, right: 20, zIndex: 10,
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center',
    },
    fullscreenImage: {
      width: SCREEN_WIDTH, height: SCREEN_WIDTH,
    },
    zoomHint: {
      position: 'absolute', bottom: 50,
      color: 'rgba(255,255,255,0.45)', fontSize: 12,
      letterSpacing: 1,
    },
  });
}
