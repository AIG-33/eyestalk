import { createClient } from '@/lib/supabase/server';
import { useTranslations } from 'next-intl';

export default async function ModerationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: venue } = await supabase
    .from('venues')
    .select('id')
    .eq('owner_id', user!.id)
    .maybeSingle();

  let reports: any[] = [];
  if (venue) {
    const { data } = await supabase
      .from('reports')
      .select('*, reporter:profiles!reporter_id(nickname), reported:profiles!reported_user_id(nickname)')
      .eq('venue_id', venue.id)
      .order('created_at', { ascending: false })
      .limit(50);
    reports = data || [];
  }

  return <ModerationContent reports={reports} />;
}

function ModerationContent({ reports }: { reports: any[] }) {
  const t = useTranslations('dashboard');

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    reviewed: 'bg-blue-500/20 text-blue-400',
    resolved: 'bg-green-500/20 text-green-400',
    dismissed: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">{t('moderation')}</h1>

      {reports.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
          <p className="text-4xl mb-4">🛡️</p>
          <p className="text-gray-400">No reports to review</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[report.status] || ''}`}>
                    {report.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {report.reason}
                  </span>
                </div>
                <p className="text-sm text-white">
                  <span className="text-gray-400">From:</span> {report.reporter?.nickname || 'Unknown'}
                  {' → '}
                  <span className="text-gray-400">User:</span> {report.reported?.nickname || 'Unknown'}
                </p>
                {report.description && (
                  <p className="text-sm text-gray-400 mt-1">{report.description}</p>
                )}
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {new Date(report.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
