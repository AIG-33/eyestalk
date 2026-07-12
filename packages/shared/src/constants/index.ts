export const APP_NAME = 'EyesTalk';

export const VENUE_TYPES = [
  'restaurant',
  'cafe',
  'bar',
  'nightclub',
  'sports_bar',
  'karaoke',
  'gym',
  'coworking',
  'beauty_salon',
  'hotel',
  'lounge',
  'event_space',
  'food_court',
  'bowling',
  'billiards',
  'hookah',
  'board_games',
  'arcade',
  'standup',
  'live_music',
  'other',
] as const;

export type VenueType = (typeof VENUE_TYPES)[number];

// Who created the venue and how long it lives:
// - official: business owner via the web panel
// - community: user-added place from the mobile app (unverified)
// - popup: temporary event venue that expires (party, game night, meetup)
export const VENUE_KINDS = ['official', 'community', 'popup'] as const;
export type VenueKind = (typeof VENUE_KINDS)[number];

export const POPUP_DURATION_HOURS_OPTIONS = [6, 12, 24, 48] as const;
export const DEFAULT_POPUP_DURATION_HOURS = 24;
export const VENUE_ADDED_REWARD_TOKENS = 50;

export const AGE_RANGES = ['18-21', '22-25', '26-30', '31-35', '36+'] as const;

export type AgeRange = (typeof AGE_RANGES)[number];

export const INTEREST_OPTIONS = [
  'music',
  'sports',
  'gaming',
  'food',
  'travel',
  'art',
  'tech',
  'fitness',
  'movies',
  'reading',
  'dancing',
  'photography',
  'cooking',
  'nightlife',
  'boardgames',
] as const;

export type Interest = (typeof INTEREST_OPTIONS)[number];

export const STATUS_TAGS = [
  'wantToChat',
  'lookingForCompany',
  'playing',
  'listening',
  'lookingForDancePartner',
  'justChilling',
] as const;

export type StatusTag = (typeof STATUS_TAGS)[number];

export const CHECKIN_METHODS = ['qr', 'geofence', 'code'] as const;
export type CheckinMethod = (typeof CHECKIN_METHODS)[number];

// Methods a venue can let users check in with. QR + geofence are on by default;
// `code` lets the venue hand out a short code that users type to check in.
export const DEFAULT_CHECKIN_METHODS: CheckinMethod[] = ['qr', 'geofence'];
export const MAX_CHECKIN_CODE_LENGTH = 50;

export const CHECKIN_STATUSES = ['active', 'expired', 'manual_checkout', 'geofence_checkout'] as const;
export type CheckinStatus = (typeof CHECKIN_STATUSES)[number];

// Automatic check-out policies a venue owner can enable. Several can be combined,
// except `manual_only`, which means "never auto check-out".
//  - geofence_exit   : check the user out when they leave the venue's geofence
//  - session_timeout : check the user out after CHECKIN_DURATION_HOURS (expires_at)
//  - venue_close     : check the user out when a pop-up venue expires (venues.expires_at)
//  - manual_only     : never auto check-out; the user leaves manually
export const CHECKOUT_POLICIES = ['geofence_exit', 'session_timeout', 'venue_close', 'manual_only'] as const;
export type CheckoutPolicy = (typeof CHECKOUT_POLICIES)[number];

// Keeps today's behaviour: leave the geofence or let the session time out.
export const DEFAULT_CHECKOUT_POLICY: CheckoutPolicy[] = ['geofence_exit', 'session_timeout'];

// Why a check-in ended — recorded on checkins.checkout_reason and shown to the
// user on an automatic check-out. `manual` is not surfaced (the user chose it).
export const CHECKOUT_REASONS = [
  'geofence_exit',
  'session_timeout',
  'venue_closed',
  'checked_in_elsewhere',
  'manual',
] as const;
export type CheckoutReason = (typeof CHECKOUT_REASONS)[number];

export const MESSAGE_TYPES = ['text', 'emoji', 'sticker', 'image', 'wave', 'compliment', 'system', 'announcement'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const CHAT_TYPES = ['venue_general', 'zone', 'direct', 'group'] as const;
export type ChatType = (typeof CHAT_TYPES)[number];

export const ACTIVITY_TYPES = ['poll', 'event', 'auction'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_STATUSES = ['draft', 'active', 'completed', 'cancelled'] as const;
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export const INTEREST_TYPES = ['wave', 'like', 'compliment'] as const;
export type InterestType = (typeof INTEREST_TYPES)[number];

export const REPORT_REASONS = ['spam', 'harassment', 'inappropriate_content', 'fake_profile', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const TOKEN_TRANSACTION_TYPES = [
  'checkin_reward',
  'activity_reward',
  'activity_cost',
  'vote_cost',
  'boost',
  'referral',
  'venue_bonus',
  'purchase',
  'achievement_reward',
  'service_booking',
  'poll_participation_reward',
  'match_reward',
  'venue_added_reward',
] as const;
export type TokenTransactionType = (typeof TOKEN_TRANSACTION_TYPES)[number];

export const SUBSCRIPTION_TIERS = ['free', 'basic', 'premium'] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export const VENUE_STORY_TYPES = ['moment', 'announcement', 'promo'] as const;
export type VenueStoryType = (typeof VENUE_STORY_TYPES)[number];

export const QR_CODE_TYPES = ['permanent', 'rotating', 'one_time'] as const;
export type QrCodeType = (typeof QR_CODE_TYPES)[number];

export const LEADERBOARD_TYPES = ['daily', 'weekly', 'event', 'activity'] as const;
export type LeaderboardType = (typeof LEADERBOARD_TYPES)[number];

export const ACHIEVEMENT_CATEGORIES = ['social', 'explorer', 'loyalty', 'activity'] as const;
export type AchievementCategory = (typeof ACHIEVEMENT_CATEGORIES)[number];

export const ACHIEVEMENT_SLUGS = [
  'first_checkin', 'venues_5', 'venues_10', 'venues_25', 'venues_50',
  'regular_5', 'regular_10', 'regular_25', 'streak_3', 'streak_7',
  'first_wave', 'matches_5', 'matches_10', 'messages_50', 'messages_200',
  'first_activity', 'activities_10', 'first_poll_vote',
] as const;
export type AchievementSlug = (typeof ACHIEVEMENT_SLUGS)[number];

export const MAX_ANNOUNCEMENTS_PER_DAY = 5;

// Defaults
export const CHECKIN_DURATION_HOURS = 4;
export const CHECKIN_REWARD_TOKENS = 10;
export const CHECKIN_REWARD_COOLDOWN_HOURS = 12;
export const POLL_PARTICIPATION_REWARD_TOKENS = 5;
export const MATCH_REWARD_TOKENS = 20;
export const MICRO_CHAT_DURATION_MINUTES = 5;
export const MICRO_CHAT_MESSAGE_LIMIT = 10;
export const DEFAULT_GEOFENCE_RADIUS_METERS = 50;
export const MAX_INTERESTS = 5;
// "Looking for" allows a wider net than your own interests so matching is useful.
export const MAX_LOOKING_FOR_INTERESTS = 8;
export const MAX_NICKNAME_LENGTH = 30;
export const MAX_PROFILE_PHOTOS = 6;
