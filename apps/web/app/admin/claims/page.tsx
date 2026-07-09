import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ClaimsList, type ClaimRow } from './claims-list';

export const dynamic = 'force-dynamic';

// Platform-admin-only queue of venue ownership claims. Approving a claim
// transfers venue ownership and upgrades the venue to 'official'
// (enforced server-side by the review_venue_claim RPC).
export default async function AdminClaimsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!profile?.is_admin) notFound();

  const { data: claims } = await admin
    .from('venue_claims')
    .select(`
      id, status, contact_phone, contact_email, message, proof_path,
      distance_m, created_at, reviewed_at,
      venue:venues(id, name, address, venue_kind, external_source),
      claimant:profiles!venue_claims_user_id_fkey(id, nickname)
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  // Proof photos live in a private bucket — sign short-lived URLs server-side.
  const rows: ClaimRow[] = await Promise.all(
    (claims || []).map(async (claim: any) => {
      let proofUrl: string | null = null;
      if (claim.proof_path) {
        const { data } = await admin.storage
          .from('claim-proofs')
          .createSignedUrl(claim.proof_path, 3600);
        proofUrl = data?.signedUrl ?? null;
      }
      const venue = Array.isArray(claim.venue) ? claim.venue[0] : claim.venue;
      const claimant = Array.isArray(claim.claimant) ? claim.claimant[0] : claim.claimant;
      return {
        id: claim.id,
        status: claim.status,
        contactPhone: claim.contact_phone,
        contactEmail: claim.contact_email,
        message: claim.message,
        distanceM: claim.distance_m,
        createdAt: claim.created_at,
        proofUrl,
        venueName: venue?.name ?? '—',
        venueAddress: venue?.address ?? '',
        venueKind: venue?.venue_kind ?? '',
        claimantNickname: claimant?.nickname ?? '—',
      };
    }),
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-2">Venue ownership claims</h1>
        <p className="text-gray-400 mb-8">
          Approving a claim transfers the venue to the claimant and marks it official.
        </p>
        <ClaimsList claims={rows} />
      </div>
    </div>
  );
}
