import { z } from 'zod';
import {
  AGE_RANGES,
  VENUE_TYPES,
  INTEREST_OPTIONS,
  STATUS_TAGS,
  INTEREST_TYPES,
  REPORT_REASONS,
  ACTIVITY_TYPES,
  MAX_NICKNAME_LENGTH,
  MAX_INTERESTS,
} from '../constants';

export const profileSchema = z.object({
  nickname: z
    .string()
    .min(2)
    .max(MAX_NICKNAME_LENGTH)
    .regex(/^[a-zA-Zа-яА-Я0-9_\- ]+$/),
  age_range: z.enum(AGE_RANGES),
  avatar_url: z.string().url().optional().nullable(),
  interests: z.array(z.enum(INTEREST_OPTIONS)).max(MAX_INTERESTS),
  status_tag: z.enum(STATUS_TAGS).optional().nullable(),
});

export const venueSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(VENUE_TYPES),
  description: z.string().max(1000).optional(),
  address: z.string().min(5).max(300),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  geofence_radius: z.number().min(10).max(500).default(50),
  wifi_ssid: z.string().max(100).optional().nullable(),
});

export const checkinSchema = z.object({
  venue_id: z.string().uuid(),
  qr_code: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const messageSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(['text', 'emoji', 'sticker', 'image', 'wave', 'compliment']).default('text'),
  media_url: z.string().url().optional(),
});

export const sendInterestSchema = z.object({
  target_user_id: z.string().uuid(),
  venue_id: z.string().uuid(),
  type: z.enum(INTEREST_TYPES),
  message: z.string().max(200).optional(),
});

export const reportSchema = z.object({
  reported_user_id: z.string().uuid().optional(),
  reported_message_id: z.string().uuid().optional(),
  venue_id: z.string().uuid(),
  reason: z.enum(REPORT_REASONS),
  description: z.string().max(1000).optional(),
});

export const createActivitySchema = z.object({
  venue_id: z.string().uuid(),
  zone_id: z.string().uuid().optional().nullable(),
  type: z.enum(ACTIVITY_TYPES),
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  config: z.record(z.unknown()),
  max_participants: z.number().int().positive().optional().nullable(),
  token_cost: z.number().int().min(0).default(0),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type VenueInput = z.infer<typeof venueSchema>;
export type CheckinInput = z.infer<typeof checkinSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type SendInterestInput = z.infer<typeof sendInterestSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
