'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

interface QrCode {
  id: string;
  code: string;
  type: string;
  is_active: boolean;
  created_at: string;
  zone_id: string | null;
}

export default function QrCodesPage() {
  const t = useTranslations('dashboard');
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [venueId, setVenueId] = useState<string | null>(null);

  useEffect(() => {
    loadQrCodes();
  }, []);

  const loadQrCodes = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: venue } = await supabase
      .from('venues')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!venue) {
      setLoading(false);
      return;
    }

    setVenueId(venue.id);

    const { data } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('venue_id', venue.id)
      .order('created_at', { ascending: false });

    setQrCodes(data || []);
    setLoading(false);
  };

  const generateCode = async () => {
    if (!venueId) return;
    const supabase = createClient();
    const code = `EYESTALK-${venueId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    await supabase.from('qr_codes').insert({
      venue_id: venueId,
      code,
      type: 'permanent',
    });

    loadQrCodes();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">{t('qrCodes')}</h1>
        <button
          onClick={generateCode}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Generate New QR Code
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : qrCodes.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl p-12 border border-gray-800 text-center">
          <p className="text-4xl mb-4">📱</p>
          <p className="text-gray-400 mb-4">No QR codes yet</p>
          <button
            onClick={generateCode}
            className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Generate Your First QR Code
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {qrCodes.map((qr) => (
            <div key={qr.id} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${qr.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {qr.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-gray-500 capitalize">{qr.type}</span>
              </div>
              <p className="font-mono text-sm text-white bg-gray-800 rounded-lg p-3 break-all">
                {qr.code}
              </p>
              <p className="text-xs text-gray-500 mt-3">
                Created: {new Date(qr.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
