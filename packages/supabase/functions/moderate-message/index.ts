import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

Deno.serve(async (req) => {
  const { record } = await req.json();

  if (!record || !record.content) {
    return new Response(JSON.stringify({ moderated: false }), { status: 200 });
  }

  let isFlagged = false;

  if (OPENAI_API_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ input: record.content }),
      });

      const data = await res.json();
      isFlagged = data.results?.[0]?.flagged || false;
    } catch (err) {
      console.error('OpenAI moderation error:', err);
    }
  } else {
    // Basic keyword filter as fallback
    const blocklist = ['spam', 'scam', 'xxx'];
    const lower = record.content.toLowerCase();
    isFlagged = blocklist.some((word) => lower.includes(word));
  }

  if (isFlagged) {
    await supabase
      .from('messages')
      .update({ is_deleted: true, is_moderated: true })
      .eq('id', record.id);

    console.log(`Message ${record.id} flagged and hidden`);
  } else {
    await supabase
      .from('messages')
      .update({ is_moderated: true })
      .eq('id', record.id);
  }

  return new Response(
    JSON.stringify({ moderated: true, flagged: isFlagged }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
