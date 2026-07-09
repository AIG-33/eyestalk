'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export interface ClaimRow {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  contactPhone: string | null;
  contactEmail: string | null;
  message: string | null;
  distanceM: number | null;
  createdAt: string;
  proofUrl: string | null;
  venueName: string;
  venueAddress: string;
  venueKind: string;
  claimantNickname: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-gray-500/20 text-gray-400',
};

export function ClaimsList({ claims }: { claims: ClaimRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const review = async (claimId: string, approve: boolean) => {
    setBusyId(claimId);
    setError('');
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc('review_venue_claim', {
      p_claim_id: claimId,
      p_approve: approve,
    });
    setBusyId(null);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    router.refresh();
  };

  if (claims.length === 0) {
    return (
      <div className="rounded-2xl p-12 text-center bg-gray-900 border border-gray-800">
        <p className="text-4xl mb-4">🏢</p>
        <p className="text-lg font-semibold mb-1">No claims yet</p>
        <p className="text-gray-400">Ownership claims from the mobile app will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-2">{error}</p>
      )}
      {claims.map((claim) => (
        <div key={claim.id} className="rounded-xl p-5 bg-gray-900 border border-gray-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[claim.status]}`}>
                  {claim.status}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(claim.createdAt).toLocaleString()}
                </span>
                {claim.distanceM !== null && (
                  <span className="text-xs text-gray-500">
                    📍 {claim.distanceM} m from venue at submission
                  </span>
                )}
              </div>
              <p className="font-semibold text-lg">{claim.venueName}</p>
              <p className="text-sm text-gray-400 mb-2">{claim.venueAddress}</p>
              <p className="text-sm">
                <span className="text-gray-500">Claimant:</span> {claim.claimantNickname}
                {claim.contactPhone && <span className="ml-3 text-gray-300">📞 {claim.contactPhone}</span>}
                {claim.contactEmail && <span className="ml-3 text-gray-300">✉️ {claim.contactEmail}</span>}
              </p>
              {claim.message && (
                <p className="text-sm text-gray-400 mt-2 whitespace-pre-wrap">{claim.message}</p>
              )}
            </div>
            {claim.proofUrl && (
              <a href={claim.proofUrl} target="_blank" rel="noreferrer" className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={claim.proofUrl}
                  alt="Proof document"
                  className="w-28 h-28 object-cover rounded-lg border border-gray-700 hover:opacity-80 transition-opacity"
                />
              </a>
            )}
          </div>

          {claim.status === 'pending' && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => review(claim.id, true)}
                disabled={busyId === claim.id}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-500 disabled:opacity-50 transition-colors"
              >
                Approve — transfer ownership
              </button>
              <button
                onClick={() => review(claim.id, false)}
                disabled={busyId === claim.id}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-50 transition-colors"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
