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

const pollOptionSchema = z.object({
  key: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
});

const pollConfigSchema = z.object({
  question: z.string().min(1).max(500),
  options: z.array(pollOptionSchema).min(2).max(20),
});

const auctionConfigSchema = z.object({
  item_name: z.string().min(1).max(200),
  item_description: z.string().max(1000).optional(),
  starting_price: z.number().int().min(1),
  min_increment: z.number().int().min(1),
});

const activityConfigSchema = z.record(z.unknown());

export const createActivitySchema = z.object({
  venue_id: z.string().uuid(),
  zone_id: z.string().uuid().optional().nullable(),
  type: z.enum(ACTIVITY_TYPES),
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  config: activityConfigSchema,
  max_participants: z.number().int().positive().optional().nullable(),
  token_cost: z.number().int().min(0).default(0),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
}).superRefine((data, ctx) => {
  if (data.type === 'poll') {
    const result = pollConfigSchema.safeParse(data.config);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        ctx.addIssue({ ...issue, path: ['config', ...issue.path] });
      });
    }
  }
  if (data.type === 'auction') {
    const result = auctionConfigSchema.safeParse(data.config);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        ctx.addIssue({ ...issue, path: ['config', ...issue.path] });
      });
    }
  }
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type VenueInput = z.infer<typeof venueSchema>;
export type CheckinInput = z.infer<typeof checkinSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type SendInterestInput = z.infer<typeof sendInterestSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export const updateActivitySchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  type: z.enum(ACTIVITY_TYPES).optional(),
  zone_id: z.string().uuid().optional().nullable(),
  config: activityConfigSchema.optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled'] as const).optional(),
  max_participants: z.number().int().positive().optional().nullable(),
  token_cost: z.number().int().min(0).optional(),
  starts_at: z.string().datetime().optional(),
  ends_at: z.string().datetime().optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'poll' && data.config) {
    const result = pollConfigSchema.safeParse(data.config);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        ctx.addIssue({ ...issue, path: ['config', ...issue.path] });
      });
    }
  }
  if (data.type === 'auction' && data.config) {
    const result = auctionConfigSchema.safeParse(data.config);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        ctx.addIssue({ ...issue, path: ['config', ...issue.path] });
      });
    }
  }
});

export const placeBidSchema = z.object({
  amount: z.number().int().min(1),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type PlaceBidInput = z.infer<typeof placeBidSchema>;

export const createVenueServiceSchema = z.object({
  venue_id: z.string().uuid(),
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional().nullable(),
  price_tokens: z.number().int().min(0).default(0),
  duration_minutes: z.number().int().min(1).max(1440),
  capacity_per_slot: z.number().int().min(1).max(100).default(1),
  sort_order: z.number().int().min(0).optional(),
});

export const updateVenueServiceSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  price_tokens: z.number().int().min(0).optional(),
  duration_minutes: z.number().int().min(1).max(1440).optional(),
  capacity_per_slot: z.number().int().min(1).max(100).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const addVenueServiceSlotSchema = z.object({
  service_id: z.string().uuid(),
  starts_at: z.string().datetime(),
});

export type CreateVenueServiceInput = z.infer<typeof createVenueServiceSchema>;
export type UpdateVenueServiceInput = z.infer<typeof updateVenueServiceSchema>;
export type AddVenueServiceSlotInput = z.infer<typeof addVenueServiceSlotSchema>;
