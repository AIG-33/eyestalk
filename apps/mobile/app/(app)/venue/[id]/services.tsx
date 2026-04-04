import { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { useTheme, typography, spacing, radius, shadows, component, colors } from '@/theme';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceItem = {
  id: string;
  title: string;
  description: string | null;
  price_tokens: number;
  duration_minutes: number;
  capacity_per_slot: number;
};

type SlotItem = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  service: ServiceItem;
  booked: number;
  userBooked: boolean;
};

type Section = {
  title: string;
  serviceId: string;
  data: SlotItem[];
};

type FilterStatus = 'all' | 'available' | 'booked';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmt2(n: number) {
  return String(n).padStart(2, '0');
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${fmt2(d.getHours())}:${fmt2(d.getMinutes())}`;
}

function fmtDayLabel(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

function fmtDayNum(d: Date) {
  return d.getDate();
}

function fmtMonthLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function mapBookError(msg: string, t: (k: string) => string): string {
  const m = msg.toLowerCase();
  if (m.includes('checkin_required')) return t('venueServices.errCheckin');
  if (m.includes('insufficient_tokens')) return t('venueServices.errTokens');
  if (m.includes('slot_full')) return t('venueServices.errFull');
  if (m.includes('already_booked')) return t('venueServices.errAlready');
  if (m.includes('slot_ended') || m.includes('slot_not_available')) return t('venueServices.errGone');
  if (m.includes('not_authenticated')) return t('venueServices.errAuth');
  return msg || t('venueServices.errUnknown');
}

// Build 60-day rolling window starting from today
const DAYS_WINDOW = 60;
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function buildDateWindow(): Date[] {
  return Array.from({ length: DAYS_WINDOW }, (_, i) => addDays(TODAY, i));
}

const DATE_WINDOW = buildDateWindow();

// ─── Filter Bottom Sheet ──────────────────────────────────────────────────────

type FilterSheetProps = {
  services: ServiceItem[];
  selectedService: string | null;
  statusFilter: FilterStatus;
  onSelectService: (id: string | null) => void;
  onSelectStatus: (f: FilterStatus) => void;
  onClose: () => void;
};

function FilterSheet({ services, selectedService, statusFilter, onSelectService, onSelectStatus, onClose }: FilterSheetProps) {
  const { t } = useTranslation();
  const STATUS_OPTS: FilterStatus[] = ['all', 'available', 'booked'];

  return (
    <View style={filterStyles.overlay}>
      <TouchableOpacity style={filterStyles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={filterStyles.sheet}>
        <View style={filterStyles.handle} />

        <Text style={filterStyles.sectionTitle}>{t('venueServices.title')}</Text>
        <View style={filterStyles.chipRow}>
          <TouchableOpacity
            style={[filterStyles.chip, !selectedService && filterStyles.chipActive]}
            onPress={() => onSelectService(null)}
          >
            <Text style={[filterStyles.chipText, !selectedService && filterStyles.chipTextActive]}>
              {t('venueServices.filterAll')}
            </Text>
          </TouchableOpacity>
          {services.map((svc) => (
            <TouchableOpacity
              key={svc.id}
              style={[filterStyles.chip, selectedService === svc.id && filterStyles.chipActive]}
              onPress={() => onSelectService(svc.id)}
            >
              <Text style={[filterStyles.chipText, selectedService === svc.id && filterStyles.chipTextActive]}>
                {svc.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[filterStyles.sectionTitle, { marginTop: spacing.lg }]}>Status</Text>
        <View style={filterStyles.chipRow}>
          {STATUS_OPTS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[filterStyles.chip, statusFilter === f && filterStyles.chipActive]}
              onPress={() => onSelectStatus(f)}
            >
              <Text style={[filterStyles.chipText, statusFilter === f && filterStyles.chipTextActive]}>
                {f === 'all' ? t('venueServices.filterAll') : f === 'available' ? t('venueServices.filterAvailable') : t('venueServices.filterBooked')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Button title={t('common.done')} onPress={onClose} />
        </View>
      </View>
    </View>
  );
}

const filterStyles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', zIndex: 100 },
  backdrop: { flex: 1, backgroundColor: component.bottomSheet.backdrop },
  sheet: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: component.bottomSheet.radius,
    borderTopRightRadius: component.bottomSheet.radius,
    padding: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  handle: {
    width: component.bottomSheet.handleWidth,
    height: component.bottomSheet.handleHeight,
    borderRadius: 2,
    backgroundColor: component.bottomSheet.handleColor,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.text.secondary,
    fontSize: typography.size.bodySm,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.bg.primary,
    borderWidth: 1,
    borderColor: colors.bg.surface,
  },
  chipActive: { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary },
  chipText: { color: colors.text.secondary, fontSize: typography.size.bodyMd, fontWeight: typography.weight.medium },
  chipTextActive: { color: '#FFFFFF' },
});

// ─── Slot card ────────────────────────────────────────────────────────────────

type SlotCardProps = {
  item: SlotItem;
  onBook: (slotId: string, service: ServiceItem) => void;
  isPending: boolean;
  c: ReturnType<typeof useTheme>['c'];
  isDark: boolean;
};

function SlotCard({ item, onBook, isPending, c, isDark }: SlotCardProps) {
  const { t } = useTranslation();
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const { slot: _slot, service, booked, userBooked } = { slot: item, service: item.service, booked: item.booked, userBooked: item.userBooked };
  const cap = service.capacity_per_slot;
  const remaining = Math.max(0, cap - booked);
  const cost = service.price_tokens;

  return (
    <View style={{
      backgroundColor: c.bg.secondary,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: userBooked ? c.accent.success + '44' : borderColor,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.accent.primaryLight, fontSize: typography.size.bodyLg, fontWeight: typography.weight.bold }}>
            {fmtTime(item.starts_at)}
            <Text style={{ color: c.text.tertiary, fontWeight: typography.weight.regular }}> – </Text>
            {fmtTime(item.ends_at)}
          </Text>
          {service.description ? (
            <Text style={{ color: c.text.secondary, fontSize: typography.size.bodySm, marginTop: 2 }} numberOfLines={2}>
              {service.description}
            </Text>
          ) : null}
        </View>

        {/* Booking button */}
        <View style={{ marginLeft: spacing.md, alignItems: 'flex-end', gap: spacing.xs }}>
          {userBooked ? (
            <View style={{ backgroundColor: c.accent.success + '20', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: c.accent.success + '44' }}>
              <Text style={{ color: c.accent.success, fontSize: typography.size.bodyMd, fontWeight: typography.weight.bold }}>
                {t('venueServices.booked')}
              </Text>
            </View>
          ) : remaining <= 0 ? (
            <View style={{ backgroundColor: borderColor, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md }}>
              <Text style={{ color: c.text.tertiary, fontSize: typography.size.bodyMd }}>{t('venueServices.full')}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[{ backgroundColor: c.accent.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md }, shadows.glowPrimary]}
              disabled={isPending}
              onPress={() => onBook(item.id, service)}
            >
              <Text style={{ color: '#FFF', fontSize: typography.size.bodyMd, fontWeight: typography.weight.bold }}>
                {t('venueServices.book')}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={{ color: c.text.tertiary, fontSize: typography.size.micro }}>
            {cost > 0 ? t('venueServices.cost', { n: cost }) : t('venueServices.free')}
            {cap > 1 ? `  ·  ${t('venueServices.spots', { left: remaining, cap })}` : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function VenueServicesScreen() {
  const { id: venueId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();
  const { c, isDark } = useTheme();
  const s = useMemo(() => createStyles(c, isDark), [c, isDark]);

  const [selectedDate, setSelectedDate] = useState(toISODate(TODAY));
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [showFilter, setShowFilter] = useState(false);

  const dateListRef = useRef<FlatList>(null);

  // ── Fetch: all active services for this venue ──
  const { data: services = [] } = useQuery({
    queryKey: ['venue', venueId, 'services-list'],
    queryFn: async (): Promise<ServiceItem[]> => {
      const { data, error } = await supabase
        .from('venue_services')
        .select('id, title, description, price_tokens, duration_minutes, capacity_per_slot')
        .eq('venue_id', venueId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data as ServiceItem[]) || [];
    },
    enabled: !!venueId,
    staleTime: 60_000,
  });

  // ── Fetch: slots with dots — one month window (for date strip indicators) ──
  const { data: dotDates = new Set<string>() } = useQuery({
    queryKey: ['venue', venueId, 'service-dots'],
    queryFn: async (): Promise<Set<string>> => {
      if (services.length === 0) return new Set();
      const from = toISODate(TODAY);
      const to = toISODate(addDays(TODAY, DAYS_WINDOW));
      const { data } = await supabase
        .from('venue_service_slots')
        .select('starts_at')
        .in('service_id', services.map((s) => s.id))
        .gte('starts_at', from + 'T00:00:00Z')
        .lte('starts_at', to + 'T23:59:59Z')
        .eq('status', 'scheduled');
      const set = new Set<string>();
      for (const sl of (data || []) as { starts_at: string }[]) {
        set.add(toISODate(new Date(sl.starts_at)));
      }
      return set;
    },
    enabled: services.length > 0,
    staleTime: 30_000,
  });

  // ── Fetch: slots for selected date ──
  const { data: sections = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['venue', venueId, 'service-day', selectedDate, session?.user?.id ?? 'anon'],
    queryFn: async (): Promise<Section[]> => {
      if (services.length === 0) return [];
      const dayStart = selectedDate + 'T00:00:00Z';
      const dayEnd = selectedDate + 'T23:59:59Z';

      const { data: slots, error } = await supabase
        .from('venue_service_slots')
        .select('id, service_id, starts_at, ends_at, status')
        .in('service_id', services.map((s) => s.id))
        .gte('starts_at', dayStart)
        .lte('starts_at', dayEnd)
        .eq('status', 'scheduled')
        .order('starts_at', { ascending: true });

      if (error) throw error;
      const slotList = (slots || []) as { id: string; service_id: string; starts_at: string; ends_at: string; status: string }[];

      const slotIds = slotList.map((s) => s.id);
      const bookedMap: Record<string, number> = {};
      const userSet = new Set<string>();

      if (slotIds.length > 0) {
        const { data: bookings } = await supabase
          .from('venue_service_bookings')
          .select('slot_id, user_id')
          .eq('status', 'confirmed')
          .in('slot_id', slotIds);
        for (const b of (bookings || []) as { slot_id: string; user_id: string }[]) {
          bookedMap[b.slot_id] = (bookedMap[b.slot_id] || 0) + 1;
          if (session && b.user_id === session.user.id) userSet.add(b.slot_id);
        }
      }

      const svcMap = Object.fromEntries(services.map((s) => [s.id, s]));
      const grouped: Record<string, SlotItem[]> = {};
      for (const sl of slotList) {
        const svc = svcMap[sl.service_id];
        if (!svc) continue;
        if (!grouped[svc.id]) grouped[svc.id] = [];
        grouped[svc.id].push({
          id: sl.id,
          starts_at: sl.starts_at,
          ends_at: sl.ends_at,
          status: sl.status,
          service: svc,
          booked: bookedMap[sl.id] || 0,
          userBooked: userSet.has(sl.id),
        });
      }

      return services
        .filter((svc) => grouped[svc.id]?.length)
        .map((svc) => ({ title: svc.title, serviceId: svc.id, data: grouped[svc.id] }));
    },
    enabled: services.length > 0 && !!selectedDate,
    refetchInterval: 20_000,
  });

  // ── Book mutation ──
  const bookMutation = useMutation({
    mutationFn: async (slotId: string) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error: handwritten DB types don't include Relationships, breaking rpc arg inference
      const { data, error } = await supabase.rpc('book_venue_service_slot', { p_slot_id: slotId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['venue', venueId, 'service-day'] });
      queryClient.invalidateQueries({ queryKey: ['venue', venueId, 'service-dots'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['tokens', 'history'] });
    },
    onError: (err: { message?: string }) => {
      Alert.alert(t('venueServices.bookFailed'), mapBookError(err?.message || '', t));
    },
  });

  const handleBook = useCallback((slotId: string, service: ServiceItem) => {
    if (!session) {
      Alert.alert(t('venueServices.bookFailed'), t('venueServices.errAuth'));
      return;
    }
    const cost = service.price_tokens;
    Alert.alert(
      t('venueServices.confirmTitle'),
      cost > 0
        ? t('venueServices.confirmBody', { title: service.title, cost })
        : t('venueServices.confirmBodyFree', { title: service.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('venueServices.confirmOk'), onPress: () => bookMutation.mutate(slotId) },
      ],
    );
  }, [session, bookMutation, t]);

  // ── Filter sections ──
  const filteredSections = useMemo(() => {
    return sections
      .filter((sec) => !selectedService || sec.serviceId === selectedService)
      .map((sec) => ({
        ...sec,
        data: sec.data.filter((sl) => {
          if (statusFilter === 'available') return !sl.userBooked && sl.booked < sl.service.capacity_per_slot;
          if (statusFilter === 'booked') return sl.userBooked || sl.booked > 0;
          return true;
        }),
      }))
      .filter((sec) => sec.data.length > 0);
  }, [sections, selectedService, statusFilter]);

  const hasActiveFilter = selectedService !== null || statusFilter !== 'all';

  // ── Render ──

  const renderDateItem = useCallback(({ item: date }: { item: Date }) => {
    const iso = toISODate(date);
    const isSelected = iso === selectedDate;
    const hasDot = dotDates.has(iso);
    const isToday = iso === toISODate(TODAY);

    return (
      <TouchableOpacity
        style={[s.dateCell, isSelected && s.dateCellSelected]}
        onPress={() => setSelectedDate(iso)}
        activeOpacity={0.7}
      >
        <Text style={[s.dateDayLabel, isSelected && s.dateDayLabelSelected]}>
          {isToday ? 'Today' : fmtDayLabel(date)}
        </Text>
        <Text style={[s.dateDayNum, isSelected && s.dateDayNumSelected]}>
          {fmtDayNum(date)}
        </Text>
        {hasDot && <View style={[s.dateDot, isSelected && s.dateDotSelected]} />}
      </TouchableOpacity>
    );
  }, [selectedDate, dotDates, s]);

  const selectedDateObj = useMemo(() => new Date(selectedDate + 'T12:00:00'), [selectedDate]);
  const monthLabel = fmtMonthLabel(selectedDateObj);

  return (
    <View style={s.container}>
      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)/map'))}
          style={s.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={c.text.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('venueServices.title')}</Text>
        <TouchableOpacity
          style={[s.filterBtn, hasActiveFilter && s.filterBtnActive]}
          onPress={() => setShowFilter(true)}
        >
          <Ionicons name="options-outline" size={18} color={hasActiveFilter ? '#FFF' : c.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* ── Month label ── */}
      <Text style={s.monthLabel}>{monthLabel}</Text>

      {/* ── Date strip ── */}
      <FlatList
        ref={dateListRef}
        horizontal
        data={DATE_WINDOW}
        keyExtractor={(d) => toISODate(d)}
        renderItem={renderDateItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.dateStrip}
        getItemLayout={(_, index) => ({ length: 60, offset: 60 * index, index })}
        initialScrollIndex={0}
      />

      {/* ── Slots section list ── */}
      {slotsLoading ? (
        <View style={s.centered}>
          <Text style={s.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : filteredSections.length === 0 ? (
        <View style={s.centered}>
          <Text style={s.emptyIcon}>🗓️</Text>
          <Text style={s.emptyTitle}>{t('venueServices.emptyDayTitle')}</Text>
          <Text style={s.emptyText}>{t('venueServices.emptyDayHint')}</Text>
        </View>
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SlotCard
              item={item}
              onBook={handleBook}
              isPending={bookMutation.isPending}
              c={c}
              isDark={isDark}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{section.title}</Text>
            </View>
          )}
          contentContainerStyle={s.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* ── Filter sheet ── */}
      {showFilter && (
        <FilterSheet
          services={services}
          selectedService={selectedService}
          statusFilter={statusFilter}
          onSelectService={setSelectedService}
          onSelectStatus={setStatusFilter}
          onClose={() => setShowFilter(false)}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

import type { ThemeColors } from '@/theme';

function createStyles(c: ThemeColors, isDark: boolean) {
  const borderColorFaint = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg.primary },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.sm,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    },
    headerTitle: {
      fontSize: typography.size.headingMd,
      fontWeight: typography.weight.extrabold,
      color: c.text.primary,
    },
    filterBtn: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    },
    filterBtnActive: {
      backgroundColor: c.accent.primary,
    },
    monthLabel: {
      color: c.text.tertiary,
      fontSize: typography.size.bodySm,
      fontWeight: typography.weight.semibold,
      textTransform: 'capitalize',
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xs,
    },
    dateStrip: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    dateCell: {
      width: 52,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.lg,
      marginHorizontal: 3,
    },
    dateCellSelected: {
      backgroundColor: c.accent.primary,
    },
    dateDayLabel: {
      color: c.text.tertiary,
      fontSize: typography.size.micro,
      fontWeight: typography.weight.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    dateDayLabelSelected: { color: 'rgba(255,255,255,0.8)' },
    dateDayNum: {
      color: c.text.primary,
      fontSize: typography.size.headingSm,
      fontWeight: typography.weight.bold,
      marginTop: 2,
    },
    dateDayNumSelected: { color: '#FFFFFF' },
    dateDot: {
      width: 5, height: 5, borderRadius: 2.5,
      backgroundColor: '#4ade80',
      marginTop: 3,
    },
    dateDotSelected: { backgroundColor: 'rgba(255,255,255,0.7)' },
    sectionHeader: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: borderColorFaint,
    },
    sectionTitle: {
      color: c.text.secondary,
      fontSize: typography.size.bodySm,
      fontWeight: typography.weight.semibold,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    listContent: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing['4xl'],
      paddingTop: spacing.sm,
    },
    centered: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: spacing['3xl'],
    },
    loadingText: { color: c.text.secondary },
    emptyIcon: { fontSize: 52, marginBottom: spacing.lg },
    emptyTitle: {
      color: c.text.primary,
      fontSize: typography.size.headingMd,
      fontWeight: typography.weight.bold,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    emptyText: {
      color: c.text.secondary,
      fontSize: typography.size.bodyMd,
      textAlign: 'center',
      lineHeight: typography.size.bodyMd * 1.5,
    },
  });
}
