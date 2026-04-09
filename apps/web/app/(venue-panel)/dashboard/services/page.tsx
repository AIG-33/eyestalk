'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useVenue } from '@/components/dashboard/venue-context';
import { useToast } from '@/components/dashboard/toast';
import { ConfirmDialog } from '@/components/dashboard/confirm-dialog';

// ─── Types ──────────────────────────────────────────────────────────────────

type SlotRow = {
  id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  booked_count?: number;
};

type ServiceRow = {
  id: string;
  venue_id: string;
  title: string;
  description: string | null;
  price_tokens: number;
  duration_minutes: number;
  capacity_per_slot: number;
  is_active: boolean;
  sort_order: number;
};

type ScheduleRow = {
  id: string;
  service_id: string;
  date_from: string;
  date_to: string;
  weekdays: number[];
  slot_time: string;
};

type DaySlot = SlotRow & {
  service: ServiceRow;
  booked: number;
};

type StatusFilter = 'all' | 'available' | 'booked';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEEKDAY_KEYS = ['schedSun', 'schedMon', 'schedTue', 'schedWed', 'schedThu', 'schedFri', 'schedSat'] as const;
const WEEKDAY_ISO = [0, 1, 2, 3, 4, 5, 6]; // Sun=0

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toLocalDateStr(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

function fmt2(n: number) {
  return String(n).padStart(2, '0');
}

function localToISODatetime(local: string) {
  // datetime-local value "2026-04-05T18:00" → ISO
  return local ? new Date(local).toISOString() : '';
}

async function notifyServiceSubscribers(serviceId: string) {
  try {
    await fetch('/api/v1/service-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: serviceId }),
    });
  } catch {
    // best-effort; don't block UX on notification failure
  }
}

function countExpectedSlots(dateFrom: string, dateTo: string, weekdays: number[]): number {
  if (!dateFrom || !dateTo || weekdays.length === 0) return 0;
  let cur = new Date(dateFrom);
  const end = new Date(dateTo);
  let count = 0;
  while (cur <= end) {
    if (weekdays.includes(cur.getDay())) count++;
    cur = addDays(cur, 1);
  }
  return count;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FieldLabel({ label }: { label: string }) {
  return <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">{label}</label>;
}

function inputCls(extra = '') {
  return `w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:border-violet-500 focus:outline-none ${extra}`;
}

type CreateServiceFormProps = {
  onSave: () => void;
  onCancel: () => void;
  venueId: string;
};

function CreateServiceForm({ onSave, onCancel, venueId }: CreateServiceFormProps) {
  const t = useTranslations('dashboard');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get('title') || '').trim();
    if (title.length < 2) return;
    const description = String(fd.get('description') || '').trim() || null;
    const price_tokens = Math.max(0, parseInt(String(fd.get('price_tokens') || '0'), 10) || 0);
    const duration_minutes = Math.min(1440, Math.max(1, parseInt(String(fd.get('duration_minutes') || '60'), 10) || 60));
    const capacity_per_slot = Math.min(100, Math.max(1, parseInt(String(fd.get('capacity_per_slot') || '1'), 10) || 1));
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from('venue_services').insert({
      venue_id: venueId,
      title, description, price_tokens, duration_minutes, capacity_per_slot, is_active: true,
    });
    setBusy(false);
    if (!error) onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 rounded-2xl border border-violet-600/40 bg-gray-900/70 space-y-4">
      <h3 className="text-white font-semibold text-sm">{t('serviceCreateTitle')}</h3>
      <div>
        <FieldLabel label={t('serviceTitle')} />
        <input name="title" required minLength={2} maxLength={200} className={inputCls()} autoFocus />
      </div>
      <div>
        <FieldLabel label={t('serviceDescription')} />
        <textarea name="description" rows={2} maxLength={1000} className={inputCls()} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <FieldLabel label={t('servicePrice')} />
          <input name="price_tokens" type="number" min={0} defaultValue={0} className={inputCls()} />
        </div>
        <div>
          <FieldLabel label={t('serviceDuration')} />
          <input name="duration_minutes" type="number" min={1} max={1440} defaultValue={60} className={inputCls()} />
        </div>
        <div>
          <FieldLabel label={t('serviceCapacity')} />
          <input name="capacity_per_slot" type="number" min={1} max={100} defaultValue={1} className={inputCls()} />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50"
        >
          {t('serviceSave')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm"
        >
          {t('serviceCancel')}
        </button>
      </div>
    </form>
  );
}

// ─── Schedule Generator Modal ─────────────────────────────────────────────────

type ScheduleGeneratorProps = {
  service: ServiceRow;
  onClose: () => void;
  onDone: () => void;
};

function ScheduleGenerator({ service, onClose, onDone }: ScheduleGeneratorProps) {
  const t = useTranslations('dashboard');
  const today = toISODate(new Date());
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(toISODate(addDays(new Date(), 30)));
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon–Fri default
  const [slotTime, setSlotTime] = useState('18:00');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [err, setErr] = useState('');

  const expected = useMemo(
    () => countExpectedSlots(dateFrom, dateTo, weekdays),
    [dateFrom, dateTo, weekdays],
  );

  const toggleDay = (d: number) =>
    setWeekdays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  const handleGenerate = async () => {
    setErr('');
    setResult(null);
    setBusy(true);
    const supabase = createClient();
    const { data: schedRow, error: insErr } = await supabase
      .from('venue_service_schedules')
      .insert({
        service_id: service.id,
        date_from: dateFrom,
        date_to: dateTo,
        weekdays,
        slot_time: slotTime + ':00',
      })
      .select('id')
      .single();

    if (insErr || !schedRow) {
      setBusy(false);
      setErr(insErr?.message || t('schedError'));
      return;
    }

    const { data: count, error: genErr } = await supabase.rpc('generate_service_slots', {
      p_schedule_id: schedRow.id,
    });
    setBusy(false);
    if (genErr) {
      setErr(genErr.message || t('schedError'));
    } else {
      setResult(count as number);
      if ((count as number) > 0) void notifyServiceSubscribers(service.id);
      onDone();
    }
  };

  const dayLabels = [
    t('schedSun'), t('schedMon'), t('schedTue'),
    t('schedWed'), t('schedThu'), t('schedFri'), t('schedSat'),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(124,111,247,0.3)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">{t('serviceScheduleGenerator')}</h2>
            <p className="text-gray-500 text-sm mt-0.5">{service.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-400 text-lg flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel label={t('schedDateFrom')} />
            <input
              type="date"
              value={dateFrom}
              min={today}
              onChange={(e) => setDateFrom(e.target.value)}
              className={inputCls()}
            />
          </div>
          <div>
            <FieldLabel label={t('schedDateTo')} />
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => setDateTo(e.target.value)}
              className={inputCls()}
            />
          </div>
        </div>

        <div>
          <FieldLabel label={t('schedWeekdays')} />
          <div className="flex gap-1.5">
            {WEEKDAY_ISO.map((dow, i) => (
              <button
                key={dow}
                type="button"
                onClick={() => toggleDay(dow)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                  weekdays.includes(dow)
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {dayLabels[dow]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel label={t('schedSlotTime')} />
          <input
            type="time"
            value={slotTime}
            onChange={(e) => setSlotTime(e.target.value)}
            className={inputCls('max-w-[160px]')}
          />
        </div>

        {expected > 0 && (
          <p className="text-violet-400 text-sm">
            {t('schedPreview', { n: expected })}
          </p>
        )}

        {result !== null && (
          <p className="text-emerald-400 text-sm font-semibold">
            {t('schedDone', { n: result })}
          </p>
        )}
        {err && <p className="text-red-400 text-sm">{err}</p>}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            disabled={busy || weekdays.length === 0 || !dateFrom || !dateTo}
            onClick={handleGenerate}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm disabled:opacity-40"
          >
            {busy ? t('schedGenerating') : t('schedGenerate')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm"
          >
            {t('serviceCancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mini-calendar ────────────────────────────────────────────────────────────

type MiniCalendarProps = {
  year: number;
  month: number;
  dotDates: Set<string>;
  selected: string;
  onSelect: (d: string) => void;
  onPrev: () => void;
  onNext: () => void;
};

function MiniCalendar({ year, month, dotDates, selected, onSelect, onPrev, onNext }: MiniCalendarProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  const today = toISODate(new Date());

  const monthLabel = new Date(year, month, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          type="button"
          onClick={onPrev}
          className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm flex items-center justify-center"
        >
          ‹
        </button>
        <span className="text-white text-sm font-semibold capitalize">{monthLabel}</span>
        <button
          type="button"
          onClick={onNext}
          className="w-7 h-7 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm flex items-center justify-center"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 px-2 pt-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center text-[10px] text-gray-600 font-semibold pb-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 px-2 pb-3 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const iso = `${year}-${fmt2(month + 1)}-${fmt2(day)}`;
          const hasDot = dotDates.has(iso);
          const isToday = iso === today;
          const isSelected = iso === selected;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              className={`relative flex flex-col items-center justify-center w-8 h-8 rounded-lg mx-auto text-xs font-medium transition-colors
                ${isSelected ? 'bg-violet-600 text-white' : isToday ? 'bg-violet-900/40 text-violet-300' : 'text-gray-300 hover:bg-gray-700/60'}
              `}
            >
              {day}
              {hasDot && !isSelected && (
                <span
                  className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: isToday ? '#8b5cf6' : '#4ade80' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Service sidebar item ─────────────────────────────────────────────────────

type ServiceItemProps = {
  svc: ServiceRow;
  selected: boolean;
  onSelect: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onSchedule: () => void;
  busy: boolean;
};

function ServiceItem({ svc, selected, onSelect, onToggleActive, onDelete, onSchedule, busy }: ServiceItemProps) {
  const t = useTranslations('dashboard');
  return (
    <div
      className={`rounded-xl p-3 cursor-pointer transition-all ${
        selected
          ? 'border-violet-500 bg-violet-600/10'
          : 'border-gray-700/60 hover:bg-gray-800/50'
      }`}
      style={{ border: `1px solid ${selected ? 'rgba(124,111,247,0.5)' : 'rgba(255,255,255,0.06)'}` }}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-white text-sm font-semibold truncate">{svc.title}</span>
            {!svc.is_active && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">{t('serviceInactive')}</span>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-0.5">
            {svc.price_tokens === 0 ? t('serviceFree') : t('servicePriceLabel', { n: svc.price_tokens })}
            {' · '}
            {t('serviceDurationLabel', { n: svc.duration_minutes })}
          </p>
        </div>
      </div>

      {selected && (
        <div className="flex flex-wrap gap-1.5 mt-2.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            disabled={busy}
            onClick={onSchedule}
            className="px-2 py-1 rounded-lg text-[11px] bg-violet-700/60 hover:bg-violet-600/70 text-violet-200 font-medium"
          >
            📅 {t('serviceScheduleGenerator')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onToggleActive}
            className="px-2 py-1 rounded-lg text-[11px] bg-gray-700 hover:bg-gray-600 text-gray-300"
          >
            {svc.is_active ? t('serviceDeactivate') : t('serviceActivate')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="px-2 py-1 rounded-lg text-[11px] bg-red-900/40 hover:bg-red-800/50 text-red-300"
          >
            {t('serviceDelete')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VenueServicesPage() {
  const t = useTranslations('dashboard');
  const { current } = useVenue();
  const { toast } = useToast();

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [schedSvc, setSchedSvc] = useState<ServiceRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletingSvc, setDeletingSvc] = useState<ServiceRow | null>(null);

  // Calendar state
  const today = useMemo(() => new Date(), []);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(toISODate(today));

  // Slots for current month (all services of this venue)
  const [monthSlots, setMonthSlots] = useState<SlotRow[]>([]);
  const [daySlots, setDaySlots] = useState<DaySlot[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [singleSlotStart, setSingleSlotStart] = useState('');
  const [addingSlot, setAddingSlot] = useState(false);

  const venueId = current?.id;

  const loadServices = useCallback(async () => {
    if (!venueId) { setServices([]); setLoading(false); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from('venue_services')
      .select('*')
      .eq('venue_id', venueId)
      .order('sort_order', { ascending: true });
    setServices((data as ServiceRow[]) || []);
    setLoading(false);
  }, [venueId]);

  const loadMonthSlots = useCallback(async () => {
    if (!venueId) { setMonthSlots([]); return; }
    const supabase = createClient();
    const from = new Date(calYear, calMonth, 1).toISOString();
    const to = new Date(calYear, calMonth + 1, 1).toISOString();
    const { data } = await supabase
      .from('venue_service_slots')
      .select('id, service_id, starts_at, ends_at, status')
      .in(
        'service_id',
        services.length > 0 ? services.map((s) => s.id) : ['__none__'],
      )
      .gte('starts_at', from)
      .lt('starts_at', to)
      .eq('status', 'scheduled');
    setMonthSlots((data as SlotRow[]) || []);
  }, [venueId, services, calYear, calMonth]);

  const loadDaySlots = useCallback(async () => {
    if (!venueId || services.length === 0) { setDaySlots([]); return; }
    const supabase = createClient();
    const dayStart = new Date(selectedDate + 'T00:00:00').toISOString();
    const dayEnd = new Date(selectedDate + 'T23:59:59').toISOString();

    const { data: slots } = await supabase
      .from('venue_service_slots')
      .select('id, service_id, starts_at, ends_at, status')
      .in('service_id', services.map((s) => s.id))
      .gte('starts_at', dayStart)
      .lte('starts_at', dayEnd)
      .order('starts_at', { ascending: true });

    const slotList = (slots as SlotRow[]) || [];
    const slotIds = slotList.map((s) => s.id);

    let bookedMap: Record<string, number> = {};
    if (slotIds.length > 0) {
      const { data: bookings } = await supabase
        .from('venue_service_bookings')
        .select('slot_id')
        .eq('status', 'confirmed')
        .in('slot_id', slotIds);
      for (const b of (bookings || []) as { slot_id: string }[]) {
        bookedMap[b.slot_id] = (bookedMap[b.slot_id] || 0) + 1;
      }
    }

    const svcMap = Object.fromEntries(services.map((s) => [s.id, s]));
    const rows: DaySlot[] = slotList
      .filter((sl) => svcMap[sl.service_id])
      .map((sl) => ({ ...sl, service: svcMap[sl.service_id], booked: bookedMap[sl.id] || 0 }));
    setDaySlots(rows);
  }, [venueId, services, selectedDate]);

  useEffect(() => { loadServices(); }, [loadServices]);
  useEffect(() => { loadMonthSlots(); }, [loadMonthSlots]);
  useEffect(() => { loadDaySlots(); }, [loadDaySlots]);

  const dotDates = useMemo(() => {
    const set = new Set<string>();
    for (const sl of monthSlots) {
      set.add(toISODate(new Date(sl.starts_at)));
    }
    return set;
  }, [monthSlots]);

  const filteredDaySlots = useMemo(() => {
    let rows = daySlots;
    if (selectedServiceId) rows = rows.filter((r) => r.service_id === selectedServiceId);
    if (statusFilter === 'available') rows = rows.filter((r) => r.booked < r.service.capacity_per_slot);
    if (statusFilter === 'booked') rows = rows.filter((r) => r.booked > 0);
    return rows;
  }, [daySlots, selectedServiceId, statusFilter]);

  const handlePrevMonth = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  };
  const handleNextMonth = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  };

  const toggleActive = async (svc: ServiceRow) => {
    setBusyId(svc.id);
    const supabase = createClient();
    await supabase.from('venue_services').update({ is_active: !svc.is_active }).eq('id', svc.id);
    setBusyId(null);
    loadServices();
  };

  const deleteService = (svc: ServiceRow) => {
    setDeletingSvc(svc);
  };

  const confirmDeleteService = async () => {
    if (!deletingSvc) return;
    setBusyId(deletingSvc.id);
    const supabase = createClient();
    await supabase.from('venue_services').delete().eq('id', deletingSvc.id);
    setBusyId(null);
    setSelectedServiceId(null);
    setDeletingSvc(null);
    toast('Service deleted', 'success');
    loadServices();
  };

  const addSingleSlot = async () => {
    if (!singleSlotStart || !selectedServiceId) return;
    const svc = services.find((s) => s.id === selectedServiceId);
    if (!svc) return;
    const start = new Date(singleSlotStart);
    if (Number.isNaN(start.getTime())) return;
    const end = new Date(start.getTime() + svc.duration_minutes * 60_000);
    setAddingSlot(true);
    const supabase = createClient();
    const { error } = await supabase.from('venue_service_slots').insert({
      service_id: svc.id,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
    });
    setAddingSlot(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Slot added', 'success');
    void notifyServiceSubscribers(svc.id);
    setSingleSlotStart('');
    loadMonthSlots();
    loadDaySlots();
  };

  const deleteSlot = async (slotId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('venue_service_slots').delete().eq('id', slotId);
    if (error) { toast(error.message, 'error'); return; }
    toast('Slot removed', 'success');
    loadMonthSlots();
    loadDaySlots();
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  if (!current) {
    return <div className="p-8 text-gray-400">{t('noVenue')}</div>;
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ minHeight: 0 }}>
      {/* ── LEFT: services list ─────────────────────────────────────────────── */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col overflow-y-auto"
        style={{
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h1 className="text-white font-bold text-lg">{t('services')}</h1>
          <p className="text-gray-500 text-xs mt-0.5">{t('servicesHint')}</p>
        </div>

        <div className="p-3 flex-1 space-y-2">
          {loading ? (
            <p className="text-gray-600 text-sm text-center py-4">{t('activityDetailLoading')}</p>
          ) : services.length === 0 && !showCreate ? (
            <p className="text-gray-600 text-xs text-center py-6">{t('servicesEmpty')}</p>
          ) : (
            services.map((svc) => (
              <ServiceItem
                key={svc.id}
                svc={svc}
                selected={selectedServiceId === svc.id}
                onSelect={() => setSelectedServiceId(svc.id === selectedServiceId ? null : svc.id)}
                onToggleActive={() => toggleActive(svc)}
                onDelete={() => deleteService(svc)}
                onSchedule={() => setSchedSvc(svc)}
                busy={busyId === svc.id}
              />
            ))
          )}
        </div>

        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {showCreate ? (
            <CreateServiceForm
              venueId={venueId!}
              onSave={() => { setShowCreate(false); loadServices(); }}
              onCancel={() => setShowCreate(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="w-full py-2 rounded-xl text-sm font-semibold text-white text-center"
              style={{ backgroundColor: 'rgba(124,111,247,0.15)', border: '1px dashed rgba(124,111,247,0.4)' }}
            >
              {t('serviceNew')}
            </button>
          )}
        </div>
      </aside>

      {/* ── RIGHT: calendar + day view ──────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top: calendar + filters */}
        <div className="p-4 flex gap-4 flex-wrap items-start" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Mini-calendar */}
          <div className="w-[280px] flex-shrink-0">
            <MiniCalendar
              year={calYear}
              month={calMonth}
              dotDates={dotDates}
              selected={selectedDate}
              onSelect={setSelectedDate}
              onPrev={handlePrevMonth}
              onNext={handleNextMonth}
            />
          </div>

          {/* Filters + single slot add */}
          <div className="flex-1 min-w-[220px] space-y-3">
            {/* Status filter */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Filter</label>
              <div className="flex gap-1.5 flex-wrap">
                {(['all', 'available', 'booked'] as StatusFilter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      statusFilter === f
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {f === 'all' ? t('calFilterAll') : f === 'available' ? t('calFilterAvailable') : t('calFilterBooked')}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick single-slot add (only when service selected) */}
            {selectedServiceId && (
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wide">{t('serviceAddSlot')}</label>
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={singleSlotStart}
                    onChange={(e) => setSingleSlotStart(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:border-violet-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={!singleSlotStart || addingSlot}
                    onClick={addSingleSlot}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <p className="text-gray-600 text-xs mt-1">{t('serviceSlotHint')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Day slots list */}
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-gray-400 text-sm font-semibold mb-3 capitalize">
            {toLocalDateStr(new Date(selectedDate + 'T12:00:00'))}
          </h2>

          {filteredDaySlots.length === 0 ? (
            <p className="text-gray-600 text-sm">{t('calNoSlotsDay')}</p>
          ) : (
            <ul className="space-y-2">
              {filteredDaySlots.map((sl) => {
                const cap = sl.service.capacity_per_slot;
                const booked = sl.booked;
                const isFull = booked >= cap;
                return (
                  <li
                    key={sl.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl text-sm"
                    style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {/* Time */}
                    <div className="w-24 flex-shrink-0">
                      <span className="text-violet-300 font-semibold">{formatTime(sl.starts_at)}</span>
                      <span className="text-gray-600 mx-1">–</span>
                      <span className="text-gray-400">{formatTime(sl.ends_at)}</span>
                    </div>

                    {/* Service */}
                    <div className="flex-1 min-w-0">
                      <span className="text-white font-medium truncate">{sl.service.title}</span>
                      <span className="text-gray-500 ml-2 text-xs">
                        {sl.service.price_tokens === 0 ? t('serviceFree') : t('servicePriceLabel', { n: sl.service.price_tokens })}
                      </span>
                    </div>

                    {/* Booked / capacity */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex gap-0.5">
                        {Array.from({ length: cap }).map((_, i) => (
                          <span
                            key={i}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: i < booked ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }}
                          />
                        ))}
                      </div>
                      {isFull ? (
                        <span className="text-xs text-red-400">{t('calSlotFull')}</span>
                      ) : booked > 0 ? (
                        <span className="text-xs text-violet-300">{t('calSlotBooked', { n: booked })}</span>
                      ) : (
                        <span className="text-xs text-emerald-400">{t('calSlotFree')}</span>
                      )}
                    </div>

                    {/* Delete */}
                    {sl.status === 'scheduled' && booked === 0 && (
                      <button
                        type="button"
                        onClick={() => deleteSlot(sl.id)}
                        className="text-gray-600 hover:text-red-400 text-xs ml-auto flex-shrink-0"
                      >
                        {t('calSlotRemove')}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      {/* ── Schedule generator modal ─────────────────────────────────────────── */}
      {schedSvc && (
        <ScheduleGenerator
          service={schedSvc}
          onClose={() => setSchedSvc(null)}
          onDone={() => {
            setSchedSvc(null);
            loadMonthSlots();
            loadDaySlots();
          }}
        />
      )}

      <ConfirmDialog
        open={!!deletingSvc}
        title={t('serviceDelete')}
        description={deletingSvc ? t('serviceDeleteConfirm', { title: deletingSvc.title }) : ''}
        confirmLabel={t('serviceDelete')}
        cancelLabel={t('serviceCancel')}
        destructive
        onConfirm={confirmDeleteService}
        onCancel={() => setDeletingSvc(null)}
      />
    </div>
  );
}
