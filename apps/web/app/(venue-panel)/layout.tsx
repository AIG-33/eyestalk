import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { VenueProvider } from '@/components/dashboard/venue-context';
import { ThemeProvider } from '@/components/dashboard/theme-context';
import { ToastProvider } from '@/components/dashboard/toast';

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

  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, type, logo_url')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true });

  return (
    <ThemeProvider>
      <VenueProvider venues={venues || []}>
        <ToastProvider>
          <div className="flex min-h-screen">
            <DashboardSidebar />
            <main className="flex-1 md:ml-64">
              {children}
            </main>
          </div>
        </ToastProvider>
      </VenueProvider>
    </ThemeProvider>
  );
}
