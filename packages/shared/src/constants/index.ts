export const APP_NAME = 'EyesTalk';

export const VENUE_TYPES = [
  'karaoke',
  'nightclub',
  'sports_bar',
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

export const CHECKIN_STATUSES = ['active', 'expired', 'manual_checkout'] as const;
export type CheckinStatus = (typeof CHECKIN_STATUSES)[number];

export const MESSAGE_TYPES = ['text', 'emoji', 'sticker', 'image', 'wave', 'compliment', 'system'] as const;
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

// Defaults
export const CHECKIN_DURATION_HOURS = 4;
export const CHECKIN_REWARD_TOKENS = 10;
export const MICRO_CHAT_DURATION_MINUTES = 5;
export const MICRO_CHAT_MESSAGE_LIMIT = 10;
export const DEFAULT_GEOFENCE_RADIUS_METERS = 50;
export const MAX_INTERESTS = 5;
export const MAX_NICKNAME_LENGTH = 30;
export const MAX_PROFILE_PHOTOS = 6;
