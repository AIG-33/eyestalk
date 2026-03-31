import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/dashboard/sidebar';

export default async function VenuePanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: venue } = await supabase
    .from('venues')
    .select('id, name, type, logo_url')
    .eq('owner_id', user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar venue={venue} />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
}
