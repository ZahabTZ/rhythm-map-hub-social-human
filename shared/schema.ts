import { z } from 'zod';

// Story data model with moderation and location verification
export const StorySchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required").max(5000, "Content too long"),
  excerpt: z.string().max(300, "Excerpt too long"),
  author: z.string().min(1, "Author name is required"),
  images: z.array(z.string()).optional().default([]), // Array of image URLs
  location: z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
    name: z.string(),
    crisisId: z.string(), // ID of the crisis this story belongs to
  }),
  moderationStatus: z.enum(['pending', 'approved', 'rejected', 'flagged']).default('pending'),
  moderationNotes: z.string().optional(),
  moderatedBy: z.string().optional(), // Moderator ID/name
  moderatedAt: z.string().datetime().optional(),
  submittedAt: z.string().datetime().default(() => new Date().toISOString()),
  likes: z.number().default(0),
  isLocationVerified: z.boolean().default(false), // Whether user location was verified
  submitterIP: z.string().optional(), // For location verification
  submitterUserAgent: z.string().optional(),
});

export type Story = z.infer<typeof StorySchema>;

// Insert schema for creating new stories
export const InsertStorySchema = StorySchema.omit({
  id: true,
  likes: true,
  moderationStatus: true,
  moderationNotes: true,
  moderatedBy: true,
  moderatedAt: true,
  submittedAt: true,
  submitterIP: true,
  submitterUserAgent: true,
});

export type InsertStory = z.infer<typeof InsertStorySchema>;

// Schema for story moderation actions
export const ModerationActionSchema = z.object({
  storyId: z.string(),
  action: z.enum(['approve', 'reject', 'flag']),
  notes: z.string().optional(),
  moderatorId: z.string(),
});

export type ModerationAction = z.infer<typeof ModerationActionSchema>;

// Schema for location verification
export const LocationVerificationSchema = z.object({
  userLat: z.number(),
  userLng: z.number(),
  crisisLat: z.number(),
  crisisLng: z.number(),
  maxDistanceKm: z.number().default(50), // Maximum distance allowed in kilometers
});

export type LocationVerification = z.infer<typeof LocationVerificationSchema>;

// Crisis data model (for story context)
export const CrisisSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    name: z.string(),
  }),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
  isActive: z.boolean().default(true),
  allowStorySubmissions: z.boolean().default(true),
});

export type Crisis = z.infer<typeof CrisisSchema>;

// Select type for stories
export type SelectStory = Story;
export type SelectCrisis = Crisis;