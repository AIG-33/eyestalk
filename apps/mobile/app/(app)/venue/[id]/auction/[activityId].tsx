import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { subscribeToActivityUpdates, unsubscribe } from '@/lib/realtime';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { useTheme, typography, spacing, radius, shadows } from '@/theme';
import type { ThemeColors } from '@/theme';

interface AuctionBid {
  id: string;
  user_id: string;
  nickname: string;
  amount: number;
  created_at: string;
}

interface AuctionData {
  bids: AuctionBid[];
  highest_bid: number;
  starting_price: number;
  min_increment: number;
  is_ended: boolean;
  ends_at: string;
  status: string;
}

interface AuctionActivity {
  id: string;
  title: string;
  description: string | null;
  config: {
    item_name?: string;
    item_description?: string;
    starting_price?: number;
    min_increment?: number;
  };
  status: string;
  ends_at: string;
}

export default function AuctionScreen() {
  const { id: venueId, activityId } = useLocalSearchParams<{
    id: string;
    activityId: string;
  }>();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);
  const [bidInput, setBidInput] = useState('');
  const [countdown, setCountdown] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: activity } = useQuery({
    queryKey: ['activity', activityId],
    queryFn: async (): Promise<AuctionActivity> => {
      const { data, error } = await supabase
        .from('activities')
        .select('id, title, description, config, status, ends_at')
        .eq('id', activityId)
        .single();
      if (error) throw error;
      return data as AuctionActivity;
    },
  });

  const {
    data: auctionData,
    isLoading,
  } = useQuery({
    queryKey: ['auction-bids', activityId],
    queryFn: async (): Promise<AuctionData> => {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/activities/${activityId}/bids`,
      );
      if (!res.ok) throw new Error('Failed to load bids');
      return res.json();
    },
  });

  const placeBid = useMutation({
    mutationFn: async (amount: number) => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/activities/${activityId}/bids`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentSession?.access_token}`,
          },
          body: JSON.stringify({ amount }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Bid failed');
      return data;
    },
    onSuccess: () => {
      setBidInput('');
      queryClient.invalidateQueries({ queryKey: ['auction-bids', activityId] });
    },
    onError: (err: Error) => {
      Alert.alert('Bid failed', err.message);
    },
  });

  const joinAuction = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('activity_participants').insert({
        activity_id: activityId,
        user_id: session!.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction-joined', activityId] });
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message);
    },
  });

  const { data: isJoined } = useQuery({
    queryKey: ['auction-joined', activityId],
    queryFn: async (): Promise<boolean> => {
      if (!session) return false;
      const { data } = await supabase
        .from('activity_participants')
        .select('id')
        .eq('activity_id', activityId)
        .eq('user_id', session.user.id)
        .maybeSingle();
      return !!data;
    },
  });

  // Countdown timer
  const updateCountdown = useCallback(() => {
    const endsAt = auctionData?.ends_at || activity?.ends_at;
    if (!endsAt) return;
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) {
      setCountdown('Ended');
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const sec = Math.floor((diff % 60000) / 1000);
    setCountdown(h > 0 ? `${h}h ${m}m ${sec}s` : `${m}m ${sec}s`);
  }, [auctionData?.ends_at, activity?.ends_at]);

  useEffect(() => {
    updateCountdown();
    intervalRef.current = setInterval(updateCountdown, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [updateCountdown]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const channel = subscribeToActivityUpdates(activityId, () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['auction-bids', activityId] });
      }, 500);
    });
    return () => {
      unsubscribe(channel);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [activityId, queryClient]);

  const highestBid = auctionData?.highest_bid || 0;
  const startingPrice = auctionData?.starting_price || activity?.config?.starting_price || 0;
  const minIncrement = auctionData?.min_increment || activity?.config?.min_increment || 1;
  const minimumBid = highestBid > 0 ? highestBid + minIncrement : startingPrice;
  const isEnded = auctionData?.is_ended || countdown === 'Ended';
  const isActive = activity?.status === 'active' && !isEnded;

  const handlePlaceBid = () => {
    const amount = parseInt(bidInput);
    if (!amount || amount < minimumBid) {
      Alert.alert('Invalid bid', `Minimum bid is ${minimumBid} tokens`);
      return;
    }
    placeBid.mutate(amount);
  };

  const quickBid = (amount: number) => {
    placeBid.mutate(amount);
  };

  const itemName = activity?.config?.item_name || activity?.title || 'Auction';

  const renderBid = useCallback(({ item, index }: { item: AuctionBid; index: number }) => {
    const isTop = index === 0;
    const isOwn = item.user_id === session?.user.id;
    return (
      <View style={[s.bidRow, isTop && s.bidRowTop, isOwn && s.bidRowOwn]}>
        <View style={s.bidRank}>
          {isTop ? (
            <Text style={s.bidRankCrown}>👑</Text>
          ) : (
            <Text style={s.bidRankNum}>#{index + 1}</Text>
          )}
        </View>
        <View style={s.bidInfo}>
          <Text style={[s.bidNickname, isOwn && s.bidNicknameOwn]}>
            {item.nickname}{isOwn ? ' (you)' : ''}
          </Text>
          <Text style={s.bidTime}>{formatTime(item.created_at)}</Text>
        </View>
        <Text style={[s.bidAmount, isTop && s.bidAmountTop]}>
          {item.amount} 🪙
        </Text>
      </View>
    );
  }, [s, session?.user.id]);

  if (isLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={c.accent.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace(`/(app)/venue/${venueId}/activities` as any)
          }
          style={s.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={c.text.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          💰 {itemName}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Timer + status bar */}
      <View style={[s.timerBar, isEnded && s.timerBarEnded]}>
        <Ionicons
          name={isEnded ? 'flag' : 'time-outline'}
          size={16}
          color={isEnded ? c.accent.error : c.accent.warning}
        />
        <Text style={[s.timerText, isEnded && s.timerTextEnded]}>
          {isEnded ? 'Auction ended' : countdown}
        </Text>
        {!isEnded && (
          <View style={s.liveDot} />
        )}
      </View>

      {/* Current highest bid card */}
      <View style={s.highBidCard}>
        {activity?.config?.item_description && (
          <Text style={s.itemDescription}>{activity.config.item_description}</Text>
        )}
        <Text style={s.highBidLabel}>
          {highestBid > 0 ? 'Current highest bid' : 'Starting price'}
        </Text>
        <Text style={s.highBidAmount}>
          {highestBid > 0 ? highestBid : startingPrice} 🪙
        </Text>
        <Text style={s.highBidHint}>
          Min next bid: {minimumBid} tokens (step +{minIncrement})
        </Text>
      </View>

      {/* Bid history */}
      <View style={s.bidsSection}>
        <Text style={s.bidsSectionTitle}>
          Bid History ({auctionData?.bids.length || 0})
        </Text>
        {auctionData?.bids && auctionData.bids.length > 0 ? (
          <FlatList
            data={auctionData.bids}
            keyExtractor={(item) => item.id}
            renderItem={renderBid}
            contentContainerStyle={s.bidsList}
          />
        ) : (
          <View style={s.noBids}>
            <Text style={s.noBidsText}>No bids yet — be the first!</Text>
          </View>
        )}
      </View>

      {/* Bottom bidding panel */}
      {isActive && isJoined && (
        <View style={s.bidPanel}>
          <View style={s.quickBids}>
            {[minimumBid, minimumBid + minIncrement, minimumBid + minIncrement * 5].map(
              (amt) => (
                <TouchableOpacity
                  key={amt}
                  style={s.quickBidChip}
                  onPress={() => quickBid(amt)}
                  disabled={placeBid.isPending}
                >
                  <Text style={s.quickBidText}>{amt}</Text>
                </TouchableOpacity>
              ),
            )}
          </View>
          <View style={s.bidInputRow}>
            <TextInput
              style={s.bidInput}
              placeholder={`${minimumBid}+`}
              placeholderTextColor={c.text.tertiary}
              value={bidInput}
              onChangeText={setBidInput}
              keyboardType="number-pad"
              editable={!placeBid.isPending}
            />
            <TouchableOpacity
              style={[s.bidButton, shadows.glowPrimary]}
              onPress={handlePlaceBid}
              disabled={placeBid.isPending || !bidInput}
            >
              {placeBid.isPending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={s.bidButtonText}>Bid</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Join prompt for non-participants */}
      {isActive && !isJoined && (
        <View style={s.joinPanel}>
          <Button
            title={joinAuction.isPending ? 'Joining...' : 'Join Auction'}
            onPress={() => joinAuction.mutate()}
            disabled={joinAuction.isPending}
          />
        </View>
      )}

      {/* Ended state with winner */}
      {isEnded && auctionData?.bids && auctionData.bids.length > 0 && (
        <View style={s.winnerPanel}>
          <Text style={s.winnerLabel}>Winner</Text>
          <Text style={s.winnerName}>
            👑 {auctionData.bids[0].nickname}
          </Text>
          <Text style={s.winnerBid}>
            {auctionData.bids[0].amount} tokens
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const borderColorFaint = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },
    centered: {
      flex: 1, backgroundColor: c.bg.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.md,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
      flex: 1, textAlign: 'center',
      fontSize: typography.size.headingMd, fontWeight: typography.weight.extrabold,
      color: c.text.primary, marginHorizontal: spacing.sm,
    },

    timerBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, marginHorizontal: spacing.xl, marginBottom: spacing.md,
      backgroundColor: 'rgba(255,217,61,0.08)', borderRadius: radius.md,
      paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
      borderWidth: 1, borderColor: 'rgba(255,217,61,0.15)',
    },
    timerBarEnded: {
      backgroundColor: 'rgba(255,71,87,0.08)',
      borderColor: 'rgba(255,71,87,0.15)',
    },
    timerText: {
      color: c.accent.warning, fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.bold,
    },
    timerTextEnded: { color: c.accent.error },
    liveDot: {
      width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent.success,
    },

    highBidCard: {
      marginHorizontal: spacing.xl, marginBottom: spacing.lg,
      backgroundColor: c.bg.secondary, borderRadius: radius.xl,
      padding: spacing.xl, alignItems: 'center',
      borderWidth: 1, borderColor: borderColor,
    },
    itemDescription: {
      color: c.text.secondary, fontSize: typography.size.bodyMd,
      textAlign: 'center', marginBottom: spacing.md,
      lineHeight: typography.size.bodyMd * 1.5,
    },
    highBidLabel: {
      color: c.text.tertiary, fontSize: typography.size.bodySm,
      fontWeight: typography.weight.semibold, textTransform: 'uppercase',
      letterSpacing: 1,
    },
    highBidAmount: {
      color: c.accent.warning, fontSize: 36,
      fontWeight: typography.weight.extrabold, marginVertical: spacing.sm,
    },
    highBidHint: {
      color: c.text.tertiary, fontSize: typography.size.bodySm,
    },

    bidsSection: { flex: 1, paddingHorizontal: spacing.xl },
    bidsSectionTitle: {
      color: c.text.secondary, fontSize: typography.size.label,
      fontWeight: typography.weight.semibold, textTransform: 'uppercase',
      letterSpacing: 1, marginBottom: spacing.md,
    },
    bidsList: { gap: spacing.sm, paddingBottom: spacing.lg },
    noBids: {
      alignItems: 'center', justifyContent: 'center', paddingVertical: spacing['3xl'],
    },
    noBidsText: {
      color: c.text.tertiary, fontSize: typography.size.bodyMd,
    },

    bidRow: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      backgroundColor: c.bg.secondary, borderRadius: radius.lg,
      paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
      borderWidth: 1, borderColor: borderColorFaint,
    },
    bidRowTop: { borderColor: 'rgba(255,217,61,0.3)' },
    bidRowOwn: { backgroundColor: 'rgba(124,111,247,0.08)' },
    bidRank: { width: 32, alignItems: 'center' },
    bidRankCrown: { fontSize: 20 },
    bidRankNum: {
      color: c.text.tertiary, fontSize: typography.size.bodySm,
      fontWeight: typography.weight.semibold,
    },
    bidInfo: { flex: 1 },
    bidNickname: {
      color: c.text.primary, fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.semibold,
    },
    bidNicknameOwn: { color: c.accent.primaryLight },
    bidTime: {
      color: c.text.tertiary, fontSize: typography.size.bodySm, marginTop: 2,
    },
    bidAmount: {
      color: c.text.primary, fontSize: typography.size.bodyLg,
      fontWeight: typography.weight.bold,
    },
    bidAmountTop: { color: c.accent.warning },

    bidPanel: {
      paddingHorizontal: spacing.xl, paddingTop: spacing.md,
      paddingBottom: spacing['4xl'],
      borderTopWidth: 1, borderTopColor: borderColor,
      backgroundColor: c.bg.primary,
    },
    quickBids: {
      flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md,
      justifyContent: 'center',
    },
    quickBidChip: {
      backgroundColor: 'rgba(255,217,61,0.1)', borderRadius: radius.full,
      paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
      borderWidth: 1, borderColor: 'rgba(255,217,61,0.2)',
    },
    quickBidText: {
      color: c.accent.warning, fontSize: typography.size.bodyMd,
      fontWeight: typography.weight.bold,
    },
    bidInputRow: {
      flexDirection: 'row', gap: spacing.sm, alignItems: 'center',
    },
    bidInput: {
      flex: 1, height: 52, backgroundColor: c.bg.tertiary,
      borderRadius: radius.lg, paddingHorizontal: spacing.lg,
      color: c.text.primary, fontSize: typography.size.bodyLg,
      fontWeight: typography.weight.bold,
      borderWidth: 1, borderColor: c.bg.surface,
    },
    bidButton: {
      height: 52, paddingHorizontal: spacing['2xl'],
      backgroundColor: c.accent.primary, borderRadius: radius.lg,
      alignItems: 'center', justifyContent: 'center',
    },
    bidButtonText: {
      color: '#FFF', fontSize: typography.size.bodyLg,
      fontWeight: typography.weight.bold,
    },

    joinPanel: {
      paddingHorizontal: spacing.xl, paddingBottom: spacing['4xl'],
      paddingTop: spacing.md,
    },

    winnerPanel: {
      marginHorizontal: spacing.xl, marginBottom: spacing['4xl'],
      backgroundColor: 'rgba(255,217,61,0.08)', borderRadius: radius.xl,
      padding: spacing.xl, alignItems: 'center',
      borderWidth: 1, borderColor: 'rgba(255,217,61,0.2)',
    },
    winnerLabel: {
      color: c.text.tertiary, fontSize: typography.size.label,
      fontWeight: typography.weight.semibold, textTransform: 'uppercase',
      letterSpacing: 1,
    },
    winnerName: {
      color: c.accent.warning, fontSize: typography.size.headingLg,
      fontWeight: typography.weight.extrabold, marginTop: spacing.sm,
    },
    winnerBid: {
      color: c.text.secondary, fontSize: typography.size.bodyMd, marginTop: spacing.xs,
    },
  });
}
