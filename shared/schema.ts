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

// Social profile schema
export const SocialProfileSchema = z.object({
  platform: z.string(), // 'twitter', 'instagram', 'linkedin', 'facebook', 'tiktok', etc.
  username: z.string().optional(),
  profileUrl: z.string().optional(),
  displayName: z.string().optional(),
  profilePicture: z.string().optional(),
  followerCount: z.number().optional(),
  isVerified: z.boolean().optional(),
  connectedAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type SocialProfile = z.infer<typeof SocialProfileSchema>;

// User schema with verified host status and social profiles
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  profilePicture: z.string().optional(),
  googleId: z.string(),
  isVerifiedHost: z.boolean().default(false),
  verifiedHostExpiresAt: z.string().datetime().optional(),
  verifiedAt: z.string().datetime().optional(),
  socialProfiles: z.array(SocialProfileSchema).default([]), // Connected social accounts
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  lastActiveAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type User = z.infer<typeof UserSchema>;

// Topic schema with global/local filtering
export const TopicSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Topic name is required").max(100, "Topic name too long"),
  description: z.string().max(500, "Description too long"),
  category: z.string(), // e.g., "Health", "Education", "Environment", etc.
  createdBy: z.string(), // User ID of verified host who created it
  maxGeographicScope: z.enum(['neighborhood', 'city', 'state', 'national', 'global']).default('global'), // Maximum geographic scope for filtering
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(), // Geographic coordinates for location-based filtering
  isActive: z.boolean().default(true),
  memberCount: z.number().default(0),
  globalDiscussions: z.array(z.string()).default([]), // Array of discussion IDs
  localDiscussions: z.array(z.string()).default([]), // Array of local discussion IDs
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type Topic = z.infer<typeof TopicSchema>;

// Insert schema for creating new topics
export const InsertTopicSchema = TopicSchema.omit({
  id: true,
  memberCount: true,
  globalDiscussions: true,
  localDiscussions: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTopic = z.infer<typeof InsertTopicSchema>;

// Backwards compatibility aliases
export const CommunitySchema = TopicSchema;
export type Community = Topic;
export const InsertCommunitySchema = InsertTopicSchema;
export type InsertCommunity = InsertTopic;

// Discussion schema for topic conversations
export const DiscussionSchema = z.object({
  id: z.string(),
  topicId: z.string(),
  communityId: z.string().optional(), // Backwards compatibility
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required").max(2000, "Content too long"),
  authorId: z.string(),
  authorName: z.string(),
  authorLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    name: z.string(),
  }).optional(), // For local discussions, author's location
  isLocal: z.boolean().default(false), // Whether this is a local discussion
  replies: z.array(z.string()).default([]), // Array of reply IDs
  likes: z.number().default(0),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type Discussion = z.infer<typeof DiscussionSchema>;

// Insert schema for creating new discussions
export const InsertDiscussionSchema = DiscussionSchema.omit({
  id: true,
  replies: true,
  likes: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDiscussion = z.infer<typeof InsertDiscussionSchema>;

// Event schema
export const EventSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Event title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long"),
  category: z.string(),
  createdBy: z.string(), // User ID of verified host
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    name: z.string(),
    address: z.string().optional(),
  }),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  maxAttendees: z.number().optional(),
  currentAttendees: z.number().default(0),
  attendeeIds: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type Event = z.infer<typeof EventSchema>;

// Insert schema for creating new events
export const InsertEventSchema = EventSchema.omit({
  id: true,
  currentAttendees: true,
  attendeeIds: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEvent = z.infer<typeof InsertEventSchema>;

// Payment record schema for verified host fees
export const PaymentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  stripePaymentIntentId: z.string(),
  amount: z.number(), // Amount in dollars
  currency: z.string().default('usd'),
  status: z.enum(['pending', 'succeeded', 'failed']),
  description: z.string(),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type Payment = z.infer<typeof PaymentSchema>;

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
// Chat message schema for regional chat rooms
export const ChatMessageSchema = z.object({
  id: z.string(),
  communityId: z.string(),
  region: z.enum(['neighborhood', 'city', 'state', 'national', 'global']),
  thread: z.enum(['intro', 'content', 'faq']).default('content'),
  content: z.string().min(1, "Message content is required").max(1000, "Message too long"),
  authorId: z.string(),
  authorName: z.string(),
  authorAvatar: z.string().optional(),
  authorLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    name: z.string(),
  }).optional(),
  messageType: z.enum(['text', 'image', 'link', 'event_share']).default('text'),
  replyToId: z.string().optional(), // For threaded replies
  reactions: z.array(z.object({
    userId: z.string(),
    emoji: z.string(),
  })).default([]),
  isEdited: z.boolean().default(false),
  editedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Insert schema for creating new chat messages
export const InsertChatMessageSchema = ChatMessageSchema.omit({
  id: true,
  reactions: true,
  isEdited: true,
  editedAt: true,
  createdAt: true,
});

export type InsertChatMessage = z.infer<typeof InsertChatMessageSchema>;

// Direct message schema for private 1:1 communication
export const DirectMessageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  senderAvatar: z.string().optional(),
  recipientId: z.string(),
  recipientName: z.string(),
  recipientAvatar: z.string().optional(),
  content: z.string().min(1, "Message content is required").max(1000, "Message too long"),
  messageType: z.enum(['text', 'image', 'link']).default('text'),
  isRead: z.boolean().default(false),
  readAt: z.string().datetime().optional(),
  conversationId: z.string(), // Groups messages between two users
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type DirectMessage = z.infer<typeof DirectMessageSchema>;

// Insert schema for creating new direct messages
export const InsertDirectMessageSchema = DirectMessageSchema.omit({
  id: true,
  isRead: true,
  readAt: true,
  createdAt: true,
});

export type InsertDirectMessage = z.infer<typeof InsertDirectMessageSchema>;

export type SelectStory = Story;
export type SelectCrisis = Crisis;