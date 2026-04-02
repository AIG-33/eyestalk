import { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator,
  ScrollView, Switch, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { MAX_PROFILE_PHOTOS } from '@eyestalk/shared/constants';
import {
  useProfilePhotos, useUploadPhoto, useDeletePhoto, useTogglePhotoVisibility,
  type ProfilePhoto,
} from '@/hooks/use-photos';
import { useAuthStore } from '@/stores/auth.store';
import { useTheme, typography, spacing, radius, shadows } from '@/theme';
import type { ThemeColors } from '@/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_GAP = 10;
const PHOTO_COLS = 3;
const PHOTO_SIZE = (SCREEN_WIDTH - spacing.xl * 2 - PHOTO_GAP * (PHOTO_COLS - 1)) / PHOTO_COLS;

export default function MyPhotosScreen() {
  const { t, i18n } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const isRu = i18n.language === 'ru';

  const { data: photos = [], isLoading } = useProfilePhotos(session?.user.id);
  const uploadPhoto = useUploadPhoto();
  const deletePhoto = useDeletePhoto();
  const toggleVisibility = useTogglePhotoVisibility();

  const [selectedPhoto, setSelectedPhoto] = useState<ProfilePhoto | null>(null);

  const handleUpload = () => {
    if (photos.length >= MAX_PROFILE_PHOTOS) {
      Alert.alert(
        isRu ? 'Лимит' : 'Limit',
        isRu ? `Максимум ${MAX_PROFILE_PHOTOS} фото` : `Maximum ${MAX_PROFILE_PHOTOS} photos`,
      );
      return;
    }
    uploadPhoto.mutate(undefined, {
      onError: (err) => {
        if (err.message !== 'cancelled') Alert.alert(t('common.error'), err.message);
      },
    });
  };

  const handleDelete = (photo: ProfilePhoto) => {
    Alert.alert(
      isRu ? 'Удалить фото?' : 'Delete photo?',
      isRu ? 'Это действие нельзя отменить' : 'This cannot be undone',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: isRu ? 'Удалить' : 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePhoto.mutate(photo);
            setSelectedPhoto(null);
          },
        },
      ],
    );
  };

  const handleToggle = (photo: ProfilePhoto) => {
    toggleVisibility.mutate({ photoId: photo.id, isPublic: !photo.is_public });
  };

  const renderPhoto = useCallback((photo: ProfilePhoto) => (
    <TouchableOpacity
      key={photo.id}
      style={s.photoCard}
      onPress={() => setSelectedPhoto(selectedPhoto?.id === photo.id ? null : photo)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: photo.photo_url }} style={s.photoImage} />
      <View style={s.photoOverlay}>
        <Ionicons
          name={photo.is_public ? 'globe-outline' : 'lock-closed'}
          size={14}
          color="#FFF"
        />
      </View>
    </TouchableOpacity>
  ), [s, selectedPhoto]);

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(app)/profile' as any)}
          style={s.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={c.text.primary} />
        </TouchableOpacity>
        <Text style={s.title}>{isRu ? 'Мои фото' : 'My Photos'}</Text>
        <Text style={s.counter}>{photos.length}/{MAX_PROFILE_PHOTOS}</Text>
      </View>

      {/* Explanation */}
      <View style={s.hint}>
        <Ionicons name="information-circle-outline" size={18} color={c.text.secondary} />
        <Text style={s.hintText}>
          {isRu
            ? 'Публичные фото видны всем. Приватные — только тем, кому вы открыли доступ в чате.'
            : 'Public photos are visible to everyone. Private photos are only visible to people you grant access to in chat.'}
        </Text>
      </View>

      {/* Photo Grid */}
      <View style={s.grid}>
        {photos.map(renderPhoto)}

        {photos.length < MAX_PROFILE_PHOTOS && (
          <TouchableOpacity style={s.addCard} onPress={handleUpload} disabled={uploadPhoto.isPending}>
            {uploadPhoto.isPending ? (
              <ActivityIndicator color={c.accent.primary} />
            ) : (
              <>
                <Ionicons name="add" size={32} color={c.accent.primary} />
                <Text style={s.addText}>{isRu ? 'Добавить' : 'Add'}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Selected photo controls */}
      {selectedPhoto && (
        <View style={s.controlsCard}>
          <Image source={{ uri: selectedPhoto.photo_url }} style={s.previewImage} />

          <View style={s.controlRow}>
            <View style={s.controlLabel}>
              <Ionicons
                name={selectedPhoto.is_public ? 'globe-outline' : 'lock-closed'}
                size={20}
                color={selectedPhoto.is_public ? c.accent.success : c.accent.warning}
              />
              <Text style={s.controlText}>
                {selectedPhoto.is_public ? (isRu ? 'Публичное' : 'Public') : (isRu ? 'Приватное' : 'Private')}
              </Text>
            </View>
            <Switch
              value={selectedPhoto.is_public}
              onValueChange={() => handleToggle(selectedPhoto)}
              trackColor={{ false: 'rgba(255,217,61,0.3)', true: 'rgba(0,229,160,0.3)' }}
              thumbColor={selectedPhoto.is_public ? c.accent.success : c.accent.warning}
            />
          </View>

          <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(selectedPhoto)}>
            <Ionicons name="trash-outline" size={18} color={c.accent.error} />
            <Text style={s.deleteBtnText}>{isRu ? 'Удалить фото' : 'Delete photo'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
    },
    title: {
      flex: 1, fontSize: typography.size.headingMd, fontWeight: typography.weight.extrabold,
      color: c.text.primary,
    },
    counter: {
      fontSize: typography.size.bodyMd, fontWeight: typography.weight.semibold,
      color: c.text.tertiary,
    },
    hint: {
      flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.xl,
      marginBottom: spacing.lg, backgroundColor: c.bg.secondary,
      borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor,
    },
    hintText: {
      flex: 1, color: c.text.secondary, fontSize: typography.size.bodySm,
      lineHeight: typography.size.bodySm * 1.5,
    },
    grid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: PHOTO_GAP,
      paddingHorizontal: spacing.xl,
    },
    photoCard: {
      width: PHOTO_SIZE, height: PHOTO_SIZE * 1.3, borderRadius: radius.lg,
      overflow: 'hidden', borderWidth: 1, borderColor,
    },
    photoImage: { width: '100%', height: '100%' },
    photoOverlay: {
      position: 'absolute', top: spacing.sm, right: spacing.sm,
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
    },
    addCard: {
      width: PHOTO_SIZE, height: PHOTO_SIZE * 1.3, borderRadius: radius.lg,
      borderWidth: 2, borderStyle: 'dashed', borderColor: c.accent.primary + '40',
      alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
      backgroundColor: c.bg.secondary,
    },
    addText: {
      color: c.accent.primary, fontSize: typography.size.bodySm,
      fontWeight: typography.weight.semibold,
    },
    controlsCard: {
      marginTop: spacing.xl, marginHorizontal: spacing.xl,
      backgroundColor: c.bg.secondary, borderRadius: radius.xl,
      overflow: 'hidden', borderWidth: 1, borderColor,
    },
    previewImage: { width: '100%', height: 200 },
    controlRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: borderColor,
    },
    controlLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    controlText: {
      color: c.text.primary, fontSize: typography.size.bodyLg,
      fontWeight: typography.weight.semibold,
    },
    deleteBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, padding: spacing.md,
    },
    deleteBtnText: {
      color: c.accent.error, fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.medium,
    },
  });
}
