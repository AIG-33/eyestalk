import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('dashboard');

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title={t('activeUsers')} value="—" />
        <StatCard title={t('totalCheckins')} value="—" />
        <StatCard title={t('activeActivities')} value="—" />
        <StatCard title={t('peakHours')} value="—" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">{t('analytics')}</h2>
          <p className="text-gray-400">Coming soon...</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">{t('activities')}</h2>
          <p className="text-gray-400">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6">
      <p className="text-sm text-gray-400 mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
