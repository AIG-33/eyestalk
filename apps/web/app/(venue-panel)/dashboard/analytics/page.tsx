'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { useVenue } from '@/components/dashboard/venue-context';

interface KPI {
  totalCheckins: number;
  uniqueVisitors: number;
  avgDaily: number;
  returnRate: number;
  totalMessages: number;
  totalWaves: number;
  totalMatches: number;
  totalAnnouncements: number;
  activitiesCreated: number;
  activityParticipants: number;
}

interface AnalyticsData {
  kpi: KPI;
  daily: { date: string; checkins: number }[];
  hourly: { hour: number; count: number }[];
  weekday: { day: string; count: number }[];
  methodSplit: { method: string; count: number }[];
  topActivities: { type: string; count: number }[];
  loyaltyTiers: { name: string; count: number }[];
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PIE_COLORS = ['#8b5cf6', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

function emptyWeekday() {
  return WEEKDAY_LABELS.map((day) => ({ day, count: 0 }));
}

export default function AnalyticsPage() {
  const t = useTranslations('dashboard');
  const { current } = useVenue();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    const venueId = current?.id;
    if (!venueId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString();

    const [
      { data: checkins },
      { data: chats },
      { data: interests },
      { data: activities },
      { data: loyaltyTiersData },
    ] = await Promise.all([
      supabase.from('checkins').select('created_at, user_id, method').eq('venue_id', venueId).gte('created_at', cutoff),
      supabase.from('chats').select('id').eq('venue_id', venueId),
      supabase.from('interests').select('id, is_mutual').eq('venue_id', venueId).gte('created_at', cutoff),
      supabase.from('activities').select('id, type, created_at').eq('venue_id', venueId),
      supabase.from('venue_loyalty_tiers').select('*').eq('venue_id', venueId).order('min_checkins', { ascending: true }),
    ]);

    const chatIds = (chats || []).map((c) => c.id);

    let totalMessages = 0;
    let totalAnnouncements = 0;
    let activityParticipants = 0;

    if (chatIds.length > 0) {
      const { count: msgCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('chat_id', chatIds)
        .gte('created_at', cutoff);
      totalMessages = msgCount || 0;

      const { count: annCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('chat_id', chatIds)
        .eq('type', 'announcement')
        .gte('created_at', cutoff);
      totalAnnouncements = annCount || 0;
    }

    const activityIds = (activities || []).map((a) => a.id);
    if (activityIds.length > 0) {
      const { count: partCount } = await supabase
        .from('activity_participants')
        .select('id', { count: 'exact', head: true })
        .in('activity_id', activityIds);
      activityParticipants = partCount || 0;
    }

    const rows = checkins || [];
    const dailyMap: Record<string, number> = {};
    const hourlyMap: Record<number, number> = {};
    const weekdayMap: Record<number, number> = {};
    const methodMap: Record<string, number> = {};
    const userSet = new Set<string>();
    const userCheckins: Record<string, number> = {};

    for (let h = 0; h < 24; h++) hourlyMap[h] = 0;
    for (let d = 0; d < 7; d++) weekdayMap[d] = 0;

    rows.forEach((c) => {
      const d = new Date(c.created_at);
      const dateKey = d.toISOString().split('T')[0];
      dailyMap[dateKey] = (dailyMap[dateKey] || 0) + 1;
      hourlyMap[d.getHours()] = (hourlyMap[d.getHours()] || 0) + 1;
      weekdayMap[d.getDay()] = (weekdayMap[d.getDay()] || 0) + 1;
      methodMap[c.method] = (methodMap[c.method] || 0) + 1;
      userSet.add(c.user_id);
      userCheckins[c.user_id] = (userCheckins[c.user_id] || 0) + 1;
    });

    const uniqueVisitors = userSet.size;
    const returningUsers = Object.values(userCheckins).filter((n) => n > 1).length;
    const returnRate = uniqueVisitors > 0 ? Math.round((returningUsers / uniqueVisitors) * 100) : 0;
    const daysWithData = Object.keys(dailyMap).length || 1;

    const daily = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, checkins]) => ({ date: date.slice(5), checkins }));

    const hourly = Object.entries(hourlyMap)
      .map(([hour, count]) => ({ hour: Number(hour), count }));

    const weekday = WEEKDAY_LABELS.map((day, i) => ({ day, count: weekdayMap[i] || 0 }));

    const methodSplit = Object.entries(methodMap)
      .map(([method, count]) => ({ method: method === 'qr' ? 'QR Code' : 'Geolocation', count }));

    const actMap: Record<string, number> = {};
    (activities || []).forEach((a) => { actMap[a.type] = (actMap[a.type] || 0) + 1; });
    const topActivities = Object.entries(actMap)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({ type, count }));

    const tiers = (loyaltyTiersData || []) as { name: string; min_checkins: number }[];
    const loyaltyDist: { name: string; count: number }[] = [];
    if (tiers.length > 0) {
      const checkinCounts = Object.values(userCheckins);
      tiers.forEach((tier, i) => {
        const nextMin = i < tiers.length - 1 ? tiers[i + 1].min_checkins : Infinity;
        const count = checkinCounts.filter((n) => n >= tier.min_checkins && n < nextMin).length;
        loyaltyDist.push({ name: tier.name, count });
      });
      const belowFirst = checkinCounts.filter((n) => n < tiers[0].min_checkins).length;
      if (belowFirst > 0) loyaltyDist.unshift({ name: 'No tier', count: belowFirst });
    }

    const totalWaves = (interests || []).length;
    const totalMatches = (interests || []).filter((i) => i.is_mutual).length;

    setData({
      kpi: {
        totalCheckins: rows.length,
        uniqueVisitors,
        avgDaily: Math.round(rows.length / daysWithData),
        returnRate,
        totalMessages,
        totalWaves,
        totalMatches,
        totalAnnouncements,
        activitiesCreated: (activities || []).length,
        activityParticipants,
      },
      daily,
      hourly,
      weekday,
      methodSplit,
      topActivities,
      loyaltyTiers: loyaltyDist,
    });
    setLoading(false);
  }, [current?.id]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading || !data) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-8">{t('analytics')}</h1>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-8">{t('analytics')}</h1>
        <p className="text-gray-400">No venue selected.</p>
      </div>
    );
  }

  const { kpi } = data;
  const isEmpty = kpi.totalCheckins === 0 && kpi.totalMessages === 0;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('analytics')}</h1>
        <p className="text-gray-400 max-w-2xl">{t('analyticsHint')}</p>
      </div>

      {isEmpty && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">📈</p>
          <p className="text-white font-semibold text-lg mb-2">{t('noDataYet')}</p>
          <p className="text-gray-400 max-w-md mx-auto">{t('noDataYetHint')}</p>
        </div>
      )}

      {!isEmpty && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label={t('kpiTotalCheckins30d')} value={kpi.totalCheckins} icon="📊" />
            <KpiCard label={t('kpiUniqueVisitors')} value={kpi.uniqueVisitors} icon="👤" />
            <KpiCard label={t('kpiAvgDaily')} value={kpi.avgDaily} icon="📅" />
            <KpiCard label={t('kpiReturnRate')} value={`${kpi.returnRate}%`} icon="🔄" />
          </div>

          {/* Engagement KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label={t('kpiMessages')} value={kpi.totalMessages} icon="💬" color="indigo" />
            <KpiCard label={t('kpiWaves')} value={`${kpi.totalWaves} / ${kpi.totalMatches}`} icon="👋" color="pink" />
            <KpiCard label={t('kpiAnnouncements')} value={kpi.totalAnnouncements} icon="📢" color="amber" />
            <KpiCard label={t('kpiActivitiesCreated')} value={`${kpi.activitiesCreated} (${kpi.activityParticipants} ${t('engagementParticipants').toLowerCase()})`} icon="🎯" color="emerald" />
          </div>

          {/* Check-ins Over Time */}
          {data.daily.length > 0 && (
            <ChartCard title={t('checkinsOverTime')}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9ca3af' }} />
                  <Line type="monotone" dataKey="checkins" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Peak Hours + Weekday side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.hourly.some((h) => h.count > 0) && (
              <ChartCard title={t('peakHours')}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.hourly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="hour" stroke="#6b7280" fontSize={11} tickFormatter={(h) => `${h}:00`} />
                    <YAxis stroke="#6b7280" fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9ca3af' }} labelFormatter={(h) => `${h}:00`} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            <ChartCard title={t('weekdayDistribution')}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.weekday}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9ca3af' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Method Split + Loyalty side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.methodSplit.length > 0 && (
              <ChartCard title={t('checkinMethodSplit')}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data.methodSplit} dataKey="count" nameKey="method" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {data.methodSplit.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {data.loyaltyTiers.length > 0 && (
              <ChartCard title={t('loyaltyOverview')}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data.loyaltyTiers} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {data.loyaltyTiers.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          {/* Top Activities */}
          {data.topActivities.length > 0 && (
            <ChartCard title={t('topActivities')}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.topActivities} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis dataKey="type" type="category" stroke="#6b7280" fontSize={12} width={100} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#9ca3af' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </>
      )}
    </div>
  );
}

const tooltipStyle = { background: '#111827', border: '1px solid #1f2937', borderRadius: 12 };

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

const COLOR_MAP: Record<string, string> = {
  default: 'from-violet-500/20 to-violet-600/10 border-violet-500/20',
  indigo: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/20',
  pink: 'from-pink-500/20 to-pink-600/10 border-pink-500/20',
  amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/20',
  emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
};

function KpiCard({ label, value, icon, color = 'default' }: { label: string; value: string | number; icon: string; color?: string }) {
  const gradient = COLOR_MAP[color] || COLOR_MAP.default;
  return (
    <div className={`bg-gradient-to-br ${gradient} border rounded-2xl p-5`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-gray-400 truncate">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white truncate">{value}</p>
    </div>
  );
}
