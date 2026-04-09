'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/lib/supabase/client';
import { useVenue } from '@/components/dashboard/venue-context';
import { useToast } from '@/components/dashboard/toast';

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
  const { current } = useVenue();
  const { toast } = useToast();
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQrCodes = useCallback(async () => {
    const venueId = current?.id;
    if (!venueId) {
      setQrCodes([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: false });

    setQrCodes(data || []);
    setLoading(false);
  }, [current?.id]);

  useEffect(() => {
    setLoading(true);
    void loadQrCodes();
  }, [loadQrCodes]);

  const venueName = current?.name ?? '';

  const generateCode = async () => {
    const venueId = current?.id;
    if (!venueId) return;
    const supabase = createClient();
    const code = `EYESTALK-${venueId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    await supabase.from('qr_codes').insert({
      venue_id: venueId,
      code,
      type: 'permanent',
    });

    toast('QR code generated', 'success');
    loadQrCodes();
  };

  const toggleActive = async (qr: QrCode) => {
    const supabase = createClient();
    await supabase
      .from('qr_codes')
      .update({ is_active: !qr.is_active })
      .eq('id', qr.id);
    toast(qr.is_active ? 'QR deactivated' : 'QR activated', 'success');
    loadQrCodes();
  };

  if (!current?.id) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t('qrCodes')}</h1>
        <p className="text-gray-400">No venue selected.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('qrCodes')}</h1>
          <p className="text-gray-400 text-sm mt-1">{t('qrCodesHint')}</p>
        </div>
        <button
          onClick={generateCode}
          className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('qrGenerate')}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 animate-pulse">
              <div className="w-full aspect-square bg-gray-800 rounded-xl mb-4" />
              <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : qrCodes.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl p-16 border border-gray-800 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gray-800 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm14 3h.01M14 14h3v3h-3v-3zm3 3h3v3h-3v-3zm-3 3h3v.01H14V20z" />
            </svg>
          </div>
          <p className="text-white text-lg font-semibold mb-2">{t('qrEmpty')}</p>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">{t('qrEmptyHint')}</p>
          <button
            onClick={generateCode}
            className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {t('qrGenerateFirst')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrCodes.map((qr) => (
            <QrCard
              key={qr.id}
              qr={qr}
              venueName={venueName}
              onToggleActive={() => toggleActive(qr)}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QrCard({
  qr,
  venueName,
  onToggleActive,
  t,
}: {
  qr: QrCode;
  venueName: string;
  onToggleActive: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const qrRef = useRef<HTMLDivElement>(null);

  const qrValue = `eyestalk://checkin/${qr.code}`;

  const handleDownload = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const size = 1024;
    const padding = 80;
    const totalSize = size + padding * 2;
    canvas.width = totalSize;
    canvas.height = totalSize + 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.roundRect(0, 0, canvas.width, canvas.height, 32);
    ctx.fill();

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size);

      ctx.fillStyle = '#0F0F1A';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${t('qrScanHint')} ${venueName}`, canvas.width / 2, totalSize + 50);

      const link = document.createElement('a');
      link.download = `eyestalk-qr-${qr.code.slice(-8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  }, [qr.code, venueName, t]);

  const handlePrint = useCallback(() => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>EyesTalk QR - ${qr.code}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: system-ui, sans-serif; }
            .qr-container { text-align: center; padding: 40px; }
            .qr-container svg { width: 300px; height: 300px; }
            .venue-name { font-size: 18px; font-weight: bold; margin-top: 20px; color: #0F0F1A; }
            .code { font-family: monospace; font-size: 12px; color: #666; margin-top: 8px; }
            .hint { font-size: 14px; color: #444; margin-top: 12px; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${svgData}
            <div class="venue-name">${venueName}</div>
            <div class="hint">${t('qrScanHint')} EyesTalk</div>
            <div class="code">${qr.code}</div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  }, [qr.code, venueName, t]);

  return (
    <div className={`bg-gray-900 rounded-2xl border overflow-hidden transition-all ${qr.is_active ? 'border-gray-800' : 'border-gray-800/50 opacity-60'}`}>
      {/* QR Code Display */}
      <div className="p-6 flex flex-col items-center" ref={qrRef}>
        <div className="bg-white rounded-xl p-4 mb-4">
          <QRCodeSVG
            value={qrValue}
            size={200}
            level="H"
            includeMargin={false}
            bgColor="#FFFFFF"
            fgColor="#0F0F1A"
          />
        </div>
        <p className="font-mono text-xs text-gray-500 text-center break-all px-2">
          {qr.code}
        </p>
      </div>

      {/* Info & Actions */}
      <div className="px-6 pb-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${qr.is_active ? 'bg-green-500/15 text-green-400 ring-1 ring-green-500/20' : 'bg-gray-500/15 text-gray-400 ring-1 ring-gray-500/20'}`}>
            {qr.is_active ? t('qrActive') : t('qrInactive')}
          </span>
          <span className="text-xs text-gray-500 capitalize">{qr.type}</span>
        </div>

        <p className="text-xs text-gray-500">
          {t('qrCreated')}: {new Date(qr.created_at).toLocaleDateString()}
        </p>

        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('qrDownload')}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {t('qrPrint')}
          </button>
        </div>

        <button
          onClick={onToggleActive}
          className={`w-full text-xs py-2 rounded-lg transition-colors ${qr.is_active ? 'text-red-400 hover:bg-red-500/10' : 'text-green-400 hover:bg-green-500/10'}`}
        >
          {qr.is_active ? t('qrDeactivate') : t('qrActivate')}
        </button>
      </div>
    </div>
  );
}
