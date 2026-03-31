import { useTranslations } from 'next-intl';

export default function AnalyticsPage() {
  return <AnalyticsContent />;
}

function AnalyticsContent() {
  const t = useTranslations('dashboard');

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">{t('analytics')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Check-ins Over Time</h2>
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">Chart will be rendered here with Recharts</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Peak Hours</h2>
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">Hourly distribution chart</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Popular Activities</h2>
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">Activity engagement metrics</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">User Retention</h2>
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">Returning visitors chart</p>
          </div>
        </div>
      </div>
    </div>
  );
}
