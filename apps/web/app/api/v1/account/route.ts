import { NextRequest, NextResponse } from 'next/server';
import {
  createApiRouteSupabase,
  getApiUser,
} from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * DELETE /api/v1/account — soft-deletes the authenticated user.
 *
 * Soft-delete: anonymises profile row, drops photos / push tokens, sets
 * profiles.deleted_at. A background job purges auth.users after a 30-day grace
 * period; the ON DELETE CASCADE on profiles.id then removes the anonymised row.
 *
 * Required by Apple App Store (in-app account deletion, 2022) and by Google
 * Play (User Data policy, 2024). The public-facing equivalent for users who
 * cannot sign in lives at /delete-account.
 */
export async function DELETE(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createApiRouteSupabase(request);
  const { error } = await supabase.rpc('request_account_deletion');

  if (error) {
    console.error('[account/delete] rpc failed', error);
    return NextResponse.json(
      { error: 'Failed to delete account', details: error.message },
      { status: 500 },
    );
  }

  const admin = createAdminClient();
  await admin.auth.admin
    .signOut(user.id, 'global')
    .catch(() => undefined);

  return NextResponse.json({ ok: true });
}
