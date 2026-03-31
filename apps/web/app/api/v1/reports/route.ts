import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reportSchema } from '@eyestalk/shared/validators';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      ...parsed.data,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reportCount = await getReportCount(supabase, parsed.data.reported_user_id);
  if (reportCount >= 3) {
    // TODO: trigger auto-review notification to moderators
  }

  return NextResponse.json({ report });
}

async function getReportCount(supabase: any, userId?: string): Promise<number> {
  if (!userId) return 0;
  const { count } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('reported_user_id', userId)
    .eq('status', 'pending');
  return count || 0;
}
