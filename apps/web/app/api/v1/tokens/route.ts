import { NextRequest, NextResponse } from 'next/server';
import { createApiRouteSupabase } from '@/lib/supabase/api-auth';

export async function GET(request: NextRequest) {
  const supabase = await createApiRouteSupabase(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('token_balance')
    .eq('id', user.id)
    .single();

  const { data: transactions } = await supabase
    .from('token_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({
    balance: profile?.token_balance || 0,
    transactions: transactions || [],
  });
}
