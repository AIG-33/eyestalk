'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { useVenue } from '@/components/dashboard/venue-context';

interface AnalyticsData {
  daily: { date: string; checkins: number }[];
  hourly: { hour: number; count: number }[];
  topActivities: { type: string; count: number }[];
}

function emptyHourly(): { hour: number; count: number }[] {
  return Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
}

export default function AnalyticsPage() {
  const t = useTranslations('dashboard');
  const { current } = useVenue();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    const venueId = current?.id;
    if (!venueId) {
      setData({ daily: [], hourly: emptyHourly(), topActivities: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: checkins } = await supabase
      .from('checkins')
      .select('created_at')
      .eq('venue_id', venueId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const dailyMap: Record<string, number> = {};
    const hourlyMap: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourlyMap[h] = 0;

    (checkins || []).forEach((c) => {
      const d = new Date(c.created_at);
      const dateKey = d.toISOString().split('T')[0];
      dailyMap[dateKey] = (dailyMap[dateKey] || 0) + 1;
      hourlyMap[d.getHours()] = (hourlyMap[d.getHours()] || 0) + 1;
    });

    const daily = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, checkins]) => ({ date: date.slice(5), checkins }));

    const hourly = Object.entries(hourlyMap)
      .map(([hour, count]) => ({ hour: Number(hour), count }));

    const { data: activities } = await supabase
      .from('activities')
      .select('type')
      .eq('venue_id', venueId);

    const actMap: Record<string, number> = {};
    (activities || []).forEach((a) => {
      actMap[a.type] = (actMap[a.type] || 0) + 1;
    });
    const topActivities = Object.entries(actMap)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({ type, count }));

    setData({ daily, hourly, topActivities });
    setLoading(false);
  }, [current?.id]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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

  const hasCheckinData = data.daily.length > 0;
  const hasActivityData = data.topActivities.length > 0;
  const isEmpty = !hasCheckinData && !hasActivityData;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('analytics')}</h1>
        <p className="text-gray-400 max-w-2xl">
          Track your venue performance over the last 30 days. See check-in trends, identify peak hours to optimize staffing and events, and understand which activity types your guests enjoy most.
        </p>
      </div>

      {isEmpty && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">📈</p>
          <p className="text-white font-semibold text-lg mb-2">No data yet</p>
          <p className="text-gray-400 max-w-md mx-auto">
            Analytics will appear once guests start checking in and participating in activities at your venue. Share your QR code to get started.
          </p>
        </div>
      )}

      {hasCheckinData && (
      <ChartCard title={t('checkinsOverTime')}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12 }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Line
              type="monotone" dataKey="checkins" stroke="#8b5cf6"
              strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      )}

      {hasCheckinData && (
      <ChartCard title={t('peakHours')}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.hourly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} tickFormatter={(h) => `${h}:00`} />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12 }}
              labelStyle={{ color: '#9ca3af' }}
              labelFormatter={(h) => `${h}:00`}
            />
            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      )}

      {hasActivityData && (
        <ChartCard title={t('topActivities')}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.topActivities} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis type="number" stroke="#6b7280" fontSize={12} />
              <YAxis dataKey="type" type="category" stroke="#6b7280" fontSize={12} width={100} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12 }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}
