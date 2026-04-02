import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { createClient } from './server';
import type { User } from '@supabase/supabase-js';

/**
 * Authenticate an API request using either the Authorization Bearer
 * token (mobile) or session cookies (web dashboard).
 */
export async function getApiUser(
  request: NextRequest,
): Promise<User | null> {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const supabaseWithToken = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const {
      data: { user: tokenUser },
    } = await supabaseWithToken.auth.getUser(token);
    if (tokenUser) return tokenUser;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
