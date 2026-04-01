'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';

interface AnalyticsData {
  daily: { date: string; checkins: number }[];
  hourly: { hour: number; count: number }[];
  topActivities: { type: string; count: number }[];
}

export default function AnalyticsPage() {
  const t = useTranslations('dashboard');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [venueId, setVenueId] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: venue } = await supabase
      .from('venues')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!venue) return;
    setVenueId(venue.id);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: checkins } = await supabase
      .from('checkins')
      .select('created_at')
      .eq('venue_id', venue.id)
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
      .eq('venue_id', venue.id);

    const actMap: Record<string, number> = {};
    (activities || []).forEach((a) => {
      actMap[a.type] = (actMap[a.type] || 0) + 1;
    });
    const topActivities = Object.entries(actMap)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => ({ type, count }));

    setData({ daily, hourly, topActivities });
  };

  if (!data) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-8">{t('analytics')}</h1>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-white">{t('analytics')}</h1>

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

      {data.topActivities.length > 0 && (
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
