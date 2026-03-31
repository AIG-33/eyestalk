'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  venue: {
    id: string;
    name: string;
    type: string;
    logo_url: string | null;
  } | null;
}

const navItems = [
  { href: '/dashboard', icon: '📊', labelKey: 'title' },
  { href: '/dashboard/analytics', icon: '📈', labelKey: 'analytics' },
  { href: '/dashboard/activities', icon: '🎯', labelKey: 'activities' },
  { href: '/dashboard/moderation', icon: '🛡️', labelKey: 'moderation' },
  { href: '/dashboard/qr-codes', icon: '📱', labelKey: 'qrCodes' },
  { href: '/dashboard/settings', icon: '⚙️', labelKey: 'settings' },
];

export function DashboardSidebar({ venue }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tAuth = useTranslations('auth');

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">EyesTalk</h1>
        {venue && (
          <p className="text-sm text-gray-400 mt-1 truncate">{venue.name}</p>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-violet-600/20 text-violet-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleSignOut}
          className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-red-400 hover:bg-gray-800 transition-colors"
        >
          {tAuth('signOut')}
        </button>
      </div>
    </aside>
  );
}
