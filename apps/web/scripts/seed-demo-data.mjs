// Seed demo data for marketing screenshots and Play-Store listing.
//
// Creates / refreshes:
//   • 3 Dubai venues (rooftop bar, karaoke, billiards) owned by the CEO user
//   • 3 demo users with fully filled profiles (avatar, bio, social links, interests)
//   • Active check-ins for all four users at "Sky Lounge DIFC"
//   • Venue-general chat with a realistic, multilingual conversation + 1 venue announcement
//   • Two direct chats (CEO ↔ Aria, CEO ↔ Karim) with seed messages
//   • Mutual-interest waves into CEO's inbox
//   • 3 active activities (poll / contest / auction)
//   • 3 bookable venue services with future slots
//   • Loyalty tiers + token-transaction history + a few unlocked achievements for CEO
//
// Idempotent: re-running upserts users, refreshes venue rows, and re-creates messages
// for the venue-general chat (so screenshots always show a fresh, on-brand conversation).
//
// Usage:
//   node apps/web/scripts/seed-demo-data.mjs
//
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.local.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// ─── Env loader ────────────────────────────────────────────────────────────

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, '..', '.env.local');

function loadEnv(p) {
  const out = {};
  for (const raw of readFileSync(p, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const env = loadEnv(envPath);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Helpers ───────────────────────────────────────────────────────────────

const log = (...a) => console.log('•', ...a);
const die = (msg, err) => {
  console.error('✖', msg, err ? `\n  ${err.message ?? err}` : '');
  process.exit(1);
};

function dicebear(seed) {
  return `https://api.dicebear.com/7.x/notionists-neutral/png` +
    `?seed=${encodeURIComponent(seed)}&backgroundColor=7C6FF7&size=400&radius=50`;
}

// Fun, distinct venue logos so the map markers are easy to tell apart.
// Uses the colourful "shapes" collection with a per-venue background colour.
function venueLogo(seed, bg) {
  return `https://api.dicebear.com/7.x/shapes/png` +
    `?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}&size=400&radius=20`;
}

async function getUserByEmail(email) {
  // listUsers paginates; 1 page of 200 is plenty for this project.
  const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) die(`listUsers failed (${email})`, error);
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function ensureUser(email, password, meta) {
  const existing = await getUserByEmail(email);
  if (existing) {
    log(`reusing user ${email} (${existing.id})`);
    return existing;
  }
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error) die(`createUser ${email}`, error);
  log(`created user ${email} (${data.user.id})`);
  return data.user;
}

async function upsertProfile(id, fields) {
  const { error } = await sb.from('profiles').upsert(
    { id, ...fields },
    { onConflict: 'id' },
  );
  if (error) die(`upsert profile ${fields.nickname}`, error);
}

async function upsertVenueByName(ownerId, v) {
  const { data: existing } = await sb
    .from('venues')
    .select('id')
    .eq('name', v.name)
    .maybeSingle();
  if (existing) {
    const { error } = await sb.from('venues').update({
      ...v,
      owner_id: ownerId,
      is_active: true,
    }).eq('id', existing.id);
    if (error) die(`update venue ${v.name}`, error);
    log(`refreshed venue ${v.name}`);
    return existing.id;
  }
  const { data, error } = await sb
    .from('venues')
    .insert({ ...v, owner_id: ownerId, is_active: true })
    .select('id')
    .single();
  if (error) die(`insert venue ${v.name}`, error);
  log(`created venue ${v.name} (${data.id})`);
  return data.id;
}

async function ensureCheckin(userId, venueId, when) {
  const expires = new Date(when.getTime() + 4 * 60 * 60 * 1000); // 4h
  const { data: existing } = await sb
    .from('checkins')
    .select('id')
    .eq('user_id', userId)
    .eq('venue_id', venueId)
    .eq('status', 'active')
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await sb
    .from('checkins')
    .insert({
      user_id: userId,
      venue_id: venueId,
      method: 'qr',
      status: 'active',
      is_visible: true,
      tokens_earned: 10,
      checked_in_at: when.toISOString(),
      expires_at: expires.toISOString(),
    })
    .select('id')
    .single();
  if (error) die('insert checkin', error);
  return data.id;
}

async function ensureVenueGeneralChat(venueId) {
  const { data: existing } = await sb
    .from('chats')
    .select('id')
    .eq('venue_id', venueId)
    .eq('type', 'venue_general')
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await sb
    .from('chats')
    .insert({ venue_id: venueId, type: 'venue_general', name: null, is_active: true })
    .select('id')
    .single();
  if (error) die('insert venue chat', error);
  return data.id;
}

async function ensureDirectChat(venueId, a, b) {
  // Direct chats are scoped per venue; find one where both users participate.
  const { data } = await sb
    .from('chat_participants')
    .select('chat_id, chats!inner(id, venue_id, type)')
    .in('user_id', [a, b])
    .eq('chats.type', 'direct')
    .eq('chats.venue_id', venueId);
  const counts = new Map();
  for (const row of data ?? []) {
    counts.set(row.chat_id, (counts.get(row.chat_id) ?? 0) + 1);
  }
  for (const [id, c] of counts) if (c >= 2) return id;

  const { data: chat, error } = await sb
    .from('chats')
    .insert({ venue_id: venueId, type: 'direct', is_active: true })
    .select('id')
    .single();
  if (error) die('insert direct chat', error);
  await sb.from('chat_participants').insert([
    { chat_id: chat.id, user_id: a },
    { chat_id: chat.id, user_id: b },
  ]);
  return chat.id;
}

async function ensureParticipant(chatId, userId) {
  const { data: existing } = await sb
    .from('chat_participants')
    .select('id')
    .eq('chat_id', chatId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) return;
  const { error } = await sb.from('chat_participants').insert({
    chat_id: chatId,
    user_id: userId,
  });
  if (error) die('insert participant', error);
}

async function resetMessages(chatId) {
  // Wipe + reseed so screenshots always show the same crisp conversation.
  const { error } = await sb.from('messages').delete().eq('chat_id', chatId);
  if (error) die('reset messages', error);
}

async function insertMessage(chatId, senderId, content, type, minutesAgo) {
  const ts = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
  const { error } = await sb.from('messages').insert({
    chat_id: chatId,
    sender_id: senderId,
    content,
    type: type ?? 'text',
    created_at: ts,
  });
  if (error) die('insert message', error);
}

async function ensureActivity(venueId, createdBy, a) {
  const { data: existing } = await sb
    .from('activities')
    .select('id')
    .eq('venue_id', venueId)
    .eq('title', a.title)
    .maybeSingle();
  if (existing) {
    await sb.from('activities').update({
      ...a,
      venue_id: venueId,
      created_by: createdBy,
      status: 'active',
    }).eq('id', existing.id);
    return existing.id;
  }
  const { data, error } = await sb
    .from('activities')
    .insert({ ...a, venue_id: venueId, created_by: createdBy, status: 'active' })
    .select('id')
    .single();
  if (error) die(`insert activity ${a.title}`, error);
  return data.id;
}

async function ensureService(venueId, svc) {
  const { data: existing } = await sb
    .from('venue_services')
    .select('id')
    .eq('venue_id', venueId)
    .eq('title', svc.title)
    .maybeSingle();
  if (existing) {
    await sb.from('venue_services').update({ ...svc }).eq('id', existing.id);
    return existing.id;
  }
  const { data, error } = await sb
    .from('venue_services')
    .insert({ ...svc, venue_id: venueId })
    .select('id')
    .single();
  if (error) die(`insert service ${svc.title}`, error);
  return data.id;
}

async function ensureSlot(serviceId, startsAt, endsAt) {
  const { data: existing } = await sb
    .from('venue_service_slots')
    .select('id')
    .eq('service_id', serviceId)
    .eq('starts_at', startsAt)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await sb
    .from('venue_service_slots')
    .insert({
      service_id: serviceId,
      starts_at: startsAt,
      ends_at: endsAt,
      status: 'scheduled',
    })
    .select('id')
    .single();
  if (error) die('insert slot', error);
  return data.id;
}

async function ensureLoyaltyTier(venueId, tier) {
  const { data: existing } = await sb
    .from('venue_loyalty_tiers')
    .select('id')
    .eq('venue_id', venueId)
    .eq('name', tier.name)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await sb
    .from('venue_loyalty_tiers')
    .insert({ ...tier, venue_id: venueId })
    .select('id')
    .single();
  if (error) die('insert loyalty tier', error);
  return data.id;
}

async function ensureMutualInterest(venueId, fromId, toId, type, message, mutual) {
  const { data: existing } = await sb
    .from('mutual_interests')
    .select('id, is_mutual')
    .eq('venue_id', venueId)
    .eq('from_user_id', fromId)
    .eq('to_user_id', toId)
    .maybeSingle();
  if (existing) {
    if (existing.is_mutual !== mutual) {
      await sb.from('mutual_interests').update({ is_mutual: mutual }).eq('id', existing.id);
    }
    return existing.id;
  }
  const { data, error } = await sb
    .from('mutual_interests')
    .insert({
      venue_id: venueId,
      from_user_id: fromId,
      to_user_id: toId,
      type,
      message: message ?? null,
      is_mutual: mutual,
    })
    .select('id')
    .single();
  if (error) die('insert mutual interest', error);
  return data.id;
}

async function unlockAchievement(userId, slug) {
  const { data: ach, error: e1 } = await sb
    .from('achievements')
    .select('id, threshold')
    .eq('slug', slug)
    .maybeSingle();
  if (e1 || !ach) return;
  const { data: existing } = await sb
    .from('user_achievements')
    .select('id, unlocked_at')
    .eq('user_id', userId)
    .eq('achievement_id', ach.id)
    .maybeSingle();
  const fields = {
    user_id: userId,
    achievement_id: ach.id,
    progress: ach.threshold,
    unlocked_at: new Date().toISOString(),
  };
  if (existing) {
    await sb.from('user_achievements').update(fields).eq('id', existing.id);
  } else {
    await sb.from('user_achievements').insert(fields);
  }
}

// ─── Data ──────────────────────────────────────────────────────────────────

const CEO_EMAIL = 'ceo@adorisgroup.com';

const DEMO_USERS = [
  {
    email: 'aria@demo.eyestalk.app',
    nickname: 'Aria',
    age_range: '26-30',
    interests: ['music', 'art', 'nightlife', 'photography'],
    bio: 'Resident DJ at Sky Lounge · visual artist · golden-hour person.',
    industry: 'Music & Visual Arts',
    hobbies: 'Vinyl crates, analog film, sunrise rooftops',
    favorite_movie: 'Lost in Translation',
    favorite_band: 'ODESZA',
    about_me: 'Spinning house & disco at venues across DIFC. Say hi after the set.',
    instagram: 'aria.spins',
    telegram: 'aria_spins',
    linkedin: null,
    token_balance: 320,
    is_verified: true,
  },
  {
    email: 'karim@demo.eyestalk.app',
    nickname: 'Karim',
    age_range: '22-25',
    interests: ['sports', 'gaming', 'tech', 'fitness'],
    bio: 'Software engineer · pickup-football organiser · always down for billiards.',
    industry: 'FinTech (Software)',
    hobbies: '5-a-side, FIFA tournaments, trail runs',
    favorite_movie: 'Inception',
    favorite_band: 'Tame Impala',
    about_me: 'Builds payments by day, racks balls by night.',
    instagram: 'karim.codes',
    telegram: null,
    linkedin: 'karim-eyestalk',
    token_balance: 180,
    is_verified: false,
  },
  {
    email: 'lina@demo.eyestalk.app',
    nickname: 'Lina',
    age_range: '26-30',
    interests: ['food', 'travel', 'photography', 'dancing'],
    bio: 'Food blogger · 38 countries · always hunting the best ramen in town.',
    industry: 'Food & Travel Media',
    hobbies: 'Hidden cafés, salsa, golden-hour street photo',
    favorite_movie: 'Chef',
    favorite_band: 'Bruno Major',
    about_me: 'If you spot the good spots in DIFC, DM me — I trade restaurants for stories.',
    instagram: 'linaeats',
    telegram: 'lina_eats',
    linkedin: null,
    token_balance: 540,
    is_verified: true,
  },
];

const VENUES = [
  {
    name: 'Sky Lounge DIFC',
    type: 'sports_bar',
    description:
      "Rooftop sports bar on the 42nd floor of DIFC. Live games, signature mocktails, " +
      "skyline views over the Burj Khalifa, and a resident DJ on Friday nights.",
    address: 'Gate Village 4, DIFC, Dubai',
    latitude: 25.21111,
    longitude: 55.27905,
    geofence_radius: 80,
    logo_url: venueLogo('Sky Lounge DIFC sunset', '0ea5e9'),
    cover_url:
      'https://images.unsplash.com/photo-1519214605650-76a613ee3245?auto=format&fit=crop&w=1200&q=80',
    subscription_tier: 'premium',
    settings: { hours: '17:00–02:00', dress_code: 'Smart casual' },
  },
  {
    name: 'Cloud 9 Karaoke',
    type: 'karaoke',
    description:
      "Private karaoke pods, 80,000-track library (EN/AR/RU/HI), themed cocktail menu, " +
      "and the only place in JBR where you can crowd-vote the next song.",
    address: 'JBR Walk, The Beach, Dubai',
    latitude: 25.08075,
    longitude: 55.13380,
    geofence_radius: 60,
    logo_url: venueLogo('Cloud 9 Karaoke neon', 'ec4899'),
    cover_url:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
    subscription_tier: 'premium',
    settings: { hours: '18:00–03:00' },
  },
  {
    name: 'Vault Billiards',
    type: 'billiards',
    description:
      "Speakeasy-style pool hall in Dubai Marina. Eight Diamond tables, tournament nights, " +
      "and a quiet whiskey bar tucked behind the velvet curtain.",
    address: 'Marina Walk, Dubai Marina',
    latitude: 25.08850,
    longitude: 55.14500,
    geofence_radius: 50,
    logo_url: venueLogo('Vault Billiards whiskey', 'f59e0b'),
    cover_url:
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
    subscription_tier: 'basic',
    settings: { hours: '16:00–02:00' },
  },
];

// ─── Run ───────────────────────────────────────────────────────────────────

async function main() {
  // 1) Resolve CEO
  const ceo = await getUserByEmail(CEO_EMAIL);
  if (!ceo) die(`Cannot find existing ${CEO_EMAIL} — please sign in once with this address first.`);
  log(`CEO user ${CEO_EMAIL} → ${ceo.id}`);

  await upsertProfile(ceo.id, {
    nickname: 'CEO',
    age_range: '31-35',
    avatar_url: dicebear('CEO Eyestalk'),
    interests: ['nightlife', 'music', 'tech', 'travel'],
    bio: 'EyesTalk founder · always at the best new spot in town.',
    industry: 'Founder',
    hobbies: 'New venues, podcasts, courtside seats',
    favorite_movie: 'The Social Network',
    favorite_band: 'Daft Punk',
    about_me: 'Building EyesTalk so strangers in the same room can actually talk.',
    instagram: 'eyestalk.app',
    telegram: 'eyestalk_app',
    linkedin: 'eyestalk',
    token_balance: 240,
    is_verified: true,
  });

  // 2) Demo users
  const demos = {};
  for (const u of DEMO_USERS) {
    const usr = await ensureUser(u.email, 'EyesTalkDemo!2026', { nickname: u.nickname });
    await upsertProfile(usr.id, {
      nickname: u.nickname,
      age_range: u.age_range,
      avatar_url: dicebear(u.nickname),
      interests: u.interests,
      bio: u.bio,
      industry: u.industry,
      hobbies: u.hobbies,
      favorite_movie: u.favorite_movie,
      favorite_band: u.favorite_band,
      about_me: u.about_me,
      instagram: u.instagram,
      telegram: u.telegram,
      linkedin: u.linkedin,
      token_balance: u.token_balance,
      is_verified: u.is_verified,
    });
    demos[u.nickname] = usr.id;
  }

  // 3) Venues
  const venueIds = {};
  for (const v of VENUES) {
    venueIds[v.name] = await upsertVenueByName(ceo.id, v);
  }
  const sky = venueIds['Sky Lounge DIFC'];

  // 4) Check-ins (everyone at Sky Lounge, staggered)
  const now = Date.now();
  await ensureCheckin(ceo.id,        sky, new Date(now - 25 * 60 * 1000));
  await ensureCheckin(demos.Aria,    sky, new Date(now - 90 * 60 * 1000));
  await ensureCheckin(demos.Karim,   sky, new Date(now - 50 * 60 * 1000));
  await ensureCheckin(demos.Lina,    sky, new Date(now - 12 * 60 * 1000));
  log('check-ins ready (everyone at Sky Lounge DIFC)');

  // 5) Venue chat
  const venueChatId = await ensureVenueGeneralChat(sky);
  for (const id of [ceo.id, demos.Aria, demos.Karim, demos.Lina]) {
    await ensureParticipant(venueChatId, id);
  }
  await resetMessages(venueChatId);

  // Conversation: oldest → newest. minutesAgo descending in calls.
  await insertMessage(venueChatId, ceo.id,
    "📢 Welcome to Sky Lounge tonight — DJ Aria spinning at 23:00. First mocktail on the house with check-in!",
    'announcement', 75);
  await insertMessage(venueChatId, demos.Aria,  "Soundcheck done ✨ see you on the floor", 'text', 65);
  await insertMessage(venueChatId, demos.Karim, "Anyone down for a billiards round at Vault after?", 'text', 42);
  await insertMessage(venueChatId, demos.Lina,  "Just got here — what should I order?", 'text', 18);
  await insertMessage(venueChatId, demos.Aria,  "Try the smoked-rosemary mocktail 🍹 it's the move tonight", 'text', 16);
  await insertMessage(venueChatId, demos.Lina,  "Привет всем 👋", 'text', 11);
  await insertMessage(venueChatId, ceo.id,      "Welcome Lina! Tap on anyone's name to say hi 👁️💬", 'text', 9);
  await insertMessage(venueChatId, demos.Karim, "Who's voting in the Friday-night anthem poll? 🗳️", 'text', 5);
  await insertMessage(venueChatId, demos.Lina,  "Voted! 🌅 sunset house wins my heart", 'text', 3);
  await insertMessage(venueChatId, demos.Aria,  "🎧 set starts in 30 — come closer to the bar", 'text', 1);
  log('venue chat seeded');

  // 6) Direct chats
  const dmAria = await ensureDirectChat(sky, ceo.id, demos.Aria);
  await resetMessages(dmAria);
  await insertMessage(dmAria, demos.Aria, "Hey 👋 saw you waved earlier", 'text', 55);
  await insertMessage(dmAria, ceo.id,    "Yeah — loved the warm-up set!", 'text', 50);
  await insertMessage(dmAria, demos.Aria, "Stick around for the closing track, it's special tonight 🌙", 'text', 47);
  await insertMessage(dmAria, ceo.id,    "Wouldn't miss it. Drink after?", 'text', 4);

  const dmKarim = await ensureDirectChat(sky, ceo.id, demos.Karim);
  await resetMessages(dmKarim);
  await insertMessage(dmKarim, demos.Karim, "Билет на FIFA-турнир ещё свободен?", 'text', 30);
  await insertMessage(dmKarim, ceo.id,      "Yep — registration's open in Activities. Go grab it 🎮", 'text', 28);
  await insertMessage(dmKarim, demos.Karim, "Done. Catch you at the table later 🎱", 'text', 6);
  log('direct chats seeded');

  // 7) Mutual-interest waves into CEO's inbox
  await ensureMutualInterest(sky, demos.Lina,  ceo.id, 'wave',
    "Loved your venue picks 🌟", false);
  await ensureMutualInterest(sky, demos.Aria,  ceo.id, 'wave',  null, true);
  await ensureMutualInterest(sky, ceo.id,      demos.Aria, 'wave', null, true);
  await ensureMutualInterest(sky, demos.Karim, ceo.id, 'wave',
    "Pickup billiards later?", false);
  log('waves seeded');

  // 8) Activities
  const startsAt = new Date(now + 30 * 60 * 1000).toISOString();
  const endsAt   = new Date(now + 4 * 60 * 60 * 1000).toISOString();

  await ensureActivity(sky, ceo.id, {
    type: 'poll',
    title: 'Friday-night anthem',
    description: 'Vote for the closing track of the night.',
    config: {
      options: [
        { key: 'house',   label: '🌅 Sunset House (Lane 8)',       votes: 14 },
        { key: 'disco',   label: '🪩 Disco Revival (Daft Punk)',    votes: 22 },
        { key: 'r_b',     label: '🎷 Smooth R&B (SZA)',             votes: 11 },
        { key: 'arabic',  label: '🌙 Modern Arabic House',           votes: 18 },
      ],
    },
    max_participants: null,
    token_cost: 0,
    starts_at: startsAt,
    ends_at: endsAt,
  });

  await ensureActivity(sky, ceo.id, {
    type: 'contest',
    title: 'Best skyline photo',
    description: 'Snap the city, post in #sky-lounge — winner gets a free table on Friday.',
    config: { reward_tokens: 100, judge: 'venue', hashtag: '#sky-lounge' },
    max_participants: 50,
    token_cost: 5,
    starts_at: startsAt,
    ends_at: endsAt,
  });

  await ensureActivity(sky, ceo.id, {
    type: 'auction',
    title: 'VIP table — Friday 10PM',
    description: 'Premium 6-seat table with bottle service. Auction closes at 21:30.',
    config: {
      starting_bid: 50,
      current_bid: 220,
      currency: 'tokens',
      reward: '6-seat VIP table',
    },
    max_participants: null,
    token_cost: 0,
    starts_at: startsAt,
    ends_at: endsAt,
  });
  log('activities seeded');

  // 9) Bookable services
  const svc1 = await ensureService(sky, {
    title: 'Reserve a corner table',
    description: 'Best skyline view, seats up to 4 guests.',
    price_tokens: 60,
    duration_minutes: 90,
    capacity_per_slot: 1,
    is_active: true,
    sort_order: 1,
  });
  const svc2 = await ensureService(sky, {
    title: 'Skip-the-line entry',
    description: 'Use the express queue — valid for 1 person, 1 hour.',
    price_tokens: 25,
    duration_minutes: 60,
    capacity_per_slot: 5,
    is_active: true,
    sort_order: 2,
  });
  const svc3 = await ensureService(sky, {
    title: 'Send a song to the DJ',
    description: 'Aria will play your request before the closing set.',
    price_tokens: 15,
    duration_minutes: 30,
    capacity_per_slot: 3,
    is_active: true,
    sort_order: 3,
  });
  // Slots: each service gets 3 future slots, every hour.
  for (const svcId of [svc1, svc2, svc3]) {
    for (let h = 1; h <= 3; h++) {
      const start = new Date(now + h * 60 * 60 * 1000);
      const end   = new Date(start.getTime() + 60 * 60 * 1000);
      await ensureSlot(svcId, start.toISOString(), end.toISOString());
    }
  }
  log('services + slots seeded');

  // 10) Loyalty tiers (per venue)
  for (const vId of Object.values(venueIds)) {
    await ensureLoyaltyTier(vId, { name: 'Newbie',  min_checkins: 1,  token_reward: 5,  sort_order: 1 });
    await ensureLoyaltyTier(vId, { name: 'Regular', min_checkins: 5,  token_reward: 25, sort_order: 2 });
    await ensureLoyaltyTier(vId, { name: 'VIP',     min_checkins: 15, token_reward: 75, sort_order: 3 });
  }
  log('loyalty tiers seeded');

  // 11) Achievements for CEO
  for (const slug of ['first_checkin', 'first_wave', 'matches_5', 'regular_5', 'first_poll_vote']) {
    await unlockAchievement(ceo.id, slug);
  }
  log('achievements unlocked');

  // 12) Token-transaction history (cosmetic)
  // Wipe demo-y entries and re-create a recent-history strip.
  await sb.from('token_transactions').delete().eq('user_id', ceo.id).eq('venue_id', sky);
  const txs = [
    { amount:  10, type: 'checkin_reward',     description: 'Check-in at Sky Lounge DIFC', mins: 25 },
    { amount:  -5, type: 'vote_cost',          description: 'Voted on “Friday-night anthem”', mins: 12 },
    { amount:  20, type: 'achievement_reward', description: 'Achievement unlocked: matches_5', mins: 6 },
    { amount: -25, type: 'service_booking',   description: 'Skip-the-line entry × 1', mins: 3 },
  ];
  for (const t of txs) {
    await sb.from('token_transactions').insert({
      user_id: ceo.id,
      venue_id: sky,
      amount: t.amount,
      type: t.type,
      description: t.description,
      created_at: new Date(now - t.mins * 60 * 1000).toISOString(),
    });
  }
  log('token transactions seeded');

  console.log('\n✓ Demo data ready.');
  console.log('  Sky Lounge DIFC →', sky);
  console.log('  Demo users:');
  for (const [k, v] of Object.entries(demos)) console.log('   •', k.padEnd(6), v);
}

main().catch((e) => die('seed crashed', e));
