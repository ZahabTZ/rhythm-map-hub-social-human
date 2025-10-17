import express from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { 
  InsertStorySchema, 
  ModerationActionSchema, 
  LocationVerificationSchema,
  InsertCommunitySchema,
  InsertDiscussionSchema,
  InsertEventSchema,
  InsertChatMessageSchema,
  InsertDirectMessageSchema
} from '../shared/schema';
import { storage } from './storage';
import { requireAuth, optionalAuth } from './auth';
import { supabase, isSupabaseConfigured } from './supabase';

// Initialize Stripe (optional for development)
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

if (!stripe) {
  console.warn('⚠️  Stripe not initialized - STRIPE_SECRET_KEY missing. Payment features will be disabled.');
}

const router = express.Router();

// JSON parsing middleware for most routes (small limit)
const defaultJsonParser = express.json({ limit: '1mb' });

// Moderator authentication middleware with environment variable
const checkModeratorAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const moderatorKey = req.headers['x-moderator-key'];
  const validKey = process.env.MODERATOR_SECRET_KEY;
  console.log('validKey:', validKey);
  console.log('moderatorKey:', moderatorKey);

  
  if (!validKey) {
    console.error('MODERATOR_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  if (moderatorKey === validKey) {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized: Invalid moderator key' });
  }
};

// Middleware to validate request body
const validateBody = (schema: z.ZodSchema) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        res.status(400).json({ error: 'Invalid request body' });
      }
    }
  };
};

// Get all approved stories for a crisis
router.get('/stories/crisis/:crisisId', defaultJsonParser, async (req, res) => {
  try {
    const { crisisId } = req.params;
    const stories = await storage.getApprovedStoriesByCrisis(crisisId);
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// Get pending stories (for moderation)
router.get('/stories/pending', defaultJsonParser, checkModeratorAuth, async (req, res) => {
  try {
    const stories = await storage.getPendingStories();
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending stories' });
  }
});

// Submit a new story - with increased body limit for images
router.post('/stories', express.json({ limit: '45mb' }), validateBody(InsertStorySchema), async (req, res) => {
  try {
    const storyData = req.body;
    
    // Validate image constraints
    if (storyData.images && storyData.images.length > 5) {
      return res.status(400).json({ 
        error: 'Maximum 5 images allowed per story' 
      });
    }
    
    // Check data URL sizes (DoS protection - allow up to ~6.5MB base64 per image)
    if (storyData.images) {
      for (const imageUrl of storyData.images) {
        if (typeof imageUrl === 'string') {
          // Check for valid data URL format
          if (!imageUrl.startsWith('data:image/')) {
            return res.status(400).json({ 
              error: 'Only image data URLs are allowed' 
            });
          }
          // Check size (~6.5MB base64 = ~5MB original)
          if (imageUrl.length > 6.5 * 1024 * 1024) {
            return res.status(400).json({ 
              error: 'Individual image size too large. Please use images under 5MB.' 
            });
          }
        }
      }
    }
    
    // Verify user location against crisis location
    const isLocationValid = await storage.isLocationWithinCrisis(
      storyData.location.lat,
      storyData.location.lng,
      storyData.location.crisisId
    );

    if (!isLocationValid) {
      return res.status(403).json({ 
        error: 'You must be within the crisis area to submit a story' 
      });
    }

    // Create story with location verification
    const story = await storage.createStory({
      ...storyData,
      isLocationVerified: isLocationValid,
      submitterIP: req.ip,
      submitterUserAgent: req.get('User-Agent'),
    });

    res.status(201).json(story);
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ error: 'Failed to create story' });
  }
});

// Moderate a story
router.post('/stories/:storyId/moderate', defaultJsonParser, checkModeratorAuth, (req, res, next) => {
  // Inject storyId from params into body before validation
  req.body = { ...req.body, storyId: req.params.storyId };
  next();
}, validateBody(ModerationActionSchema), async (req, res) => {
  try {
    const moderationData = req.body;
    
    const story = await storage.updateStoryModerationStatus(moderationData);
    res.json(story);
  } catch (error) {
    console.error('Error moderating story:', error);
    res.status(500).json({ error: 'Failed to moderate story' });
  }
});

// Like a story
router.post('/stories/:storyId/like', defaultJsonParser, async (req, res) => {
  try {
    const { storyId } = req.params;
    const story = await storage.likeStory(storyId);
    res.json(story);
  } catch (error) {
    console.error('Error liking story:', error);
    res.status(500).json({ error: 'Failed to like story' });
  }
});

// Verify user location against crisis
router.post('/location/verify', defaultJsonParser, validateBody(LocationVerificationSchema), async (req, res) => {
  try {
    const { userLat, userLng, crisisLat, crisisLng, maxDistanceKm = 50 } = req.body;
    
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in kilometers
    const dLat = (crisisLat - userLat) * (Math.PI / 180);
    const dLon = (crisisLng - userLng) * (Math.PI / 180);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLat * (Math.PI / 180)) * Math.cos(crisisLat * (Math.PI / 180)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    const isWithinRange = distance <= maxDistanceKm;
    
    res.json({
      isWithinRange,
      distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
      maxDistance: maxDistanceKm
    });
  } catch (error) {
    console.error('Error verifying location:', error);
    res.status(500).json({ error: 'Failed to verify location' });
  }
});

// Get all active crises
router.get('/crises', defaultJsonParser, async (req, res) => {
  try {
    const crises = await storage.getAllActiveCrises();
    res.json(crises);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch crises' });
  }
});

// Get specific crisis
router.get('/crises/:crisisId', defaultJsonParser, async (req, res) => {
  try {
    const { crisisId } = req.params;
    const crisis = await storage.getCrisisById(crisisId);
    
    if (!crisis) {
      return res.status(404).json({ error: 'Crisis not found' });
    }
    
    res.json(crisis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch crisis' });
  }
});

// Authentication routes
router.get('/auth/user', requireAuth, async (req: any, res) => {
  try {
    // User is already attached to req by requireAuth middleware
    res.json(req.user);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Social profile routes
router.post('/user/social-profiles', requireAuth, defaultJsonParser, async (req: any, res) => {
  try {
    const user = req.user;
    const { platform, username, profileUrl } = req.body;
    
    if (!platform || !username) {
      return res.status(400).json({ error: 'Platform and username are required' });
    }
    
    const updatedUser = await storage.addUserSocialProfile(user.id, {
      platform,
      username,
      profileUrl,
      displayName: req.body.displayName,
      profilePicture: req.body.profilePicture,
      followerCount: req.body.followerCount,
      isVerified: req.body.isVerified,
      connectedAt: new Date().toISOString(),
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error adding social profile:', error);
    res.status(500).json({ error: 'Failed to add social profile' });
  }
});

router.delete('/user/social-profiles/:platform', requireAuth, defaultJsonParser, async (req: any, res) => {
  try {
    const user = req.user;
    const { platform } = req.params;
    
    const updatedUser = await storage.removeUserSocialProfile(user.id, platform);
    res.json(updatedUser);
  } catch (error) {
    console.error('Error removing social profile:', error);
    res.status(500).json({ error: 'Failed to remove social profile' });
  }
});

// Community routes
router.get('/communities', defaultJsonParser, async (req, res) => {
  try {
    // Try Supabase first if configured
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        // Fallback to in-memory storage
        const communities = await storage.getAllCommunities();
        return res.json(communities);
      }
      
      // Transform Supabase data to match Community/Topic type
      const communities = (data || []).map((topic: any) => ({
        id: topic.id,
        name: topic.name,
        description: topic.description || '',
        category: topic.category,
        createdBy: topic.created_by,
        maxGeographicScope: topic.max_geographic_scope,
        coordinates: topic.coordinates,
        isActive: topic.is_active,
        memberCount: topic.member_count || 0,
        globalDiscussions: topic.global_discussions || [],
        localDiscussions: topic.local_discussions || [],
        createdAt: topic.created_at,
        updatedAt: topic.updated_at,
      }));
      
      return res.json(communities);
    }
    
    // Fallback to in-memory storage
    const communities = await storage.getAllCommunities();
    res.json(communities);
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

router.post('/communities', requireAuth, defaultJsonParser, validateBody(InsertCommunitySchema), async (req: any, res) => {
  try {
    // Check if user is verified host - REMOVED: Allow any logged-in user to create community
    const user = req.user;
    // if (!user.isVerifiedHost || (user.verifiedHostExpiresAt && new Date(user.verifiedHostExpiresAt) <= new Date())) {
    //   return res.status(403).json({ error: 'Verified host status required' });
    // }

    const community = await storage.createCommunity({
      ...req.body,
      createdBy: user.id, // Set server-side from authenticated user
    });
    res.status(201).json(community);
  } catch (error: any) {
    console.error('Error creating community:', error);
    if (error.message && error.message.includes('already has a community')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create community' });
  }
});

router.get('/user/has-community', requireAuth, defaultJsonParser, async (req: any, res) => {
  try {
    const user = req.user;
    const hasCommunity = await storage.hasUserCreatedCommunity(user.id);
    res.json({ hasCommunity });
  } catch (error) {
    console.error('Error checking user community:', error);
    res.status(500).json({ error: 'Failed to check user community' });
  }
});

router.get('/communities/:communityId', defaultJsonParser, async (req, res) => {
  try {
    const { communityId } = req.params;
    const community = await storage.getCommunityById(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }
    res.json(community);
  } catch (error) {
    console.error('Error fetching community:', error);
    res.status(500).json({ error: 'Failed to fetch community' });
  }
});

router.get('/communities/:communityId/discussions', defaultJsonParser, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { isLocal, userLat, userLng } = req.query;
    
    let discussions;
    if (isLocal === 'true' && userLat && userLng) {
      // Get local discussions based on user location
      discussions = await storage.getLocalDiscussionsByUserLocation(
        communityId, 
        parseFloat(userLat as string), 
        parseFloat(userLng as string)
      );
    } else {
      // Get all discussions (or filter by isLocal)
      discussions = await storage.getDiscussionsByCommunity(
        communityId, 
        isLocal === 'true' ? true : isLocal === 'false' ? false : undefined
      );
    }
    
    res.json(discussions);
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ error: 'Failed to fetch discussions' });
  }
});

router.post('/discussions', defaultJsonParser, validateBody(InsertDiscussionSchema), async (req, res) => {
  try {
    const discussion = await storage.createDiscussion(req.body);
    res.status(201).json(discussion);
  } catch (error) {
    console.error('Error creating discussion:', error);
    res.status(500).json({ error: 'Failed to create discussion' });
  }
});

router.post('/discussions/:discussionId/like', defaultJsonParser, async (req, res) => {
  try {
    const { discussionId } = req.params;
    const discussion = await storage.likeDiscussion(discussionId);
    res.json(discussion);
  } catch (error) {
    console.error('Error liking discussion:', error);
    res.status(500).json({ error: 'Failed to like discussion' });
  }
});

// Event routes
router.get('/events', defaultJsonParser, async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    let events;
    if (lat && lng) {
      events = await storage.getEventsByLocation(
        parseFloat(lat as string), 
        parseFloat(lng as string), 
        radius ? parseFloat(radius as string) : undefined
      );
    } else {
      events = await storage.getAllEvents();
    }
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/events', requireAuth, defaultJsonParser, validateBody(InsertEventSchema), async (req: any, res) => {
  try {
    // Check if user is verified host
    const user = req.user;
    if (!user.isVerifiedHost || (user.verifiedHostExpiresAt && new Date(user.verifiedHostExpiresAt) <= new Date())) {
      return res.status(403).json({ error: 'Verified host status required' });
    }

    const event = await storage.createEvent({
      ...req.body,
      createdBy: user.id, // Set server-side from authenticated user
    });
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.post('/events/:eventId/join', defaultJsonParser, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const event = await storage.joinEvent(eventId, userId);
    res.json(event);
  } catch (error) {
    console.error('Error joining event:', error);
    res.status(500).json({ error: 'Failed to join event' });
  }
});

router.post('/events/:eventId/leave', defaultJsonParser, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const event = await storage.leaveEvent(eventId, userId);
    res.json(event);
  } catch (error) {
    console.error('Error leaving event:', error);
    res.status(500).json({ error: 'Failed to leave event' });
  }
});

// User routes
router.get('/users/:userId', defaultJsonParser, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.get('/users/:userId/communities', defaultJsonParser, async (req, res) => {
  try {
    const { userId } = req.params;
    const communities = await storage.getCommunitiesByCreator(userId);
    res.json(communities);
  } catch (error) {
    console.error('Error fetching user communities:', error);
    res.status(500).json({ error: 'Failed to fetch user communities' });
  }
});

router.get('/users/:userId/events', defaultJsonParser, async (req, res) => {
  try {
    const { userId } = req.params;
    const events = await storage.getEventsByCreator(userId);
    res.json(events);
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ error: 'Failed to fetch user events' });
  }
});

// Payment routes for verified host subscription
router.post('/create-verified-host-payment', requireAuth, defaultJsonParser, async (req: any, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payment system not available' });
    }
    
    const user = req.user;
    
    // Create payment intent for annual verified host fee ($50)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 5000, // $50 in cents
      currency: 'usd',
      metadata: {
        userId: user.id,
        type: 'verified_host_annual_fee',
      },
    });
    
    // Store payment in our system
    await storage.createPayment({
      userId: user.id, // Use authenticated user ID
      stripePaymentIntentId: paymentIntent.id,
      amount: 50.00,
      currency: 'usd',
      status: 'pending',
      description: 'Annual verified host fee',
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Webhook to handle Stripe payment confirmations
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  if (!sig) {
    console.error('Missing stripe-signature header');
    return res.status(400).send('Missing stripe-signature header');
  }

  if (!stripe) {
    return res.status(503).send('Payment system not available');
  }

  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { userId, type } = paymentIntent.metadata;
      
      if (type === 'verified_host_annual_fee' && userId) {
        // Check if this payment was already processed (idempotency)
        const existingPayment = await storage.getPaymentByStripeId(paymentIntent.id);
        if (existingPayment && existingPayment.status === 'succeeded') {
          console.log(`Payment ${paymentIntent.id} already processed, skipping`);
          return res.json({ received: true });
        }

        // Validate payment amount matches expected value ($50 = 5000 cents)
        if (paymentIntent.amount !== 5000 || paymentIntent.currency !== 'usd') {
          console.error(`Invalid payment amount/currency: ${paymentIntent.amount} ${paymentIntent.currency}`);
          return res.status(400).send('Invalid payment amount');
        }
        
        // Update payment status atomically - only proceed if status changed
        const wasUpdated = await storage.updatePaymentStatus(paymentIntent.id, 'succeeded');
        
        if (wasUpdated) {
          // Grant verified host status for one year from now
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          
          await storage.updateUserVerifiedHostStatus(userId, true, expiresAt.toISOString());
          console.log(`Granted verified host status to user ${userId} until ${expiresAt.toISOString()}`);
        } else {
          console.log(`Payment ${paymentIntent.id} was already processed by another request`);
        }
      } else {
        console.log('Payment succeeded but missing userId or not a verified host payment');
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      console.log('Payment failed:', failedPayment.id);
      await storage.updatePaymentStatus(failedPayment.id, 'failed');
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).send('Error processing webhook');
  }
  
  res.json({ received: true });
});

// Chat message routes
// Note: More specific routes must come first
router.get('/chat/:communityId/active-members', defaultJsonParser, async (req, res) => {
  try {
    const { communityId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const activeMembers = await storage.getMostActiveMembers(communityId, limit);
    res.json(activeMembers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active members' });
  }
});

router.get('/chat/:communityId', defaultJsonParser, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { region, thread } = req.query;
    
    // Try Supabase first if configured
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('topic_id', communityId)
        .order('created_at', { ascending: true });
      
      if (region) {
        query = query.eq('region', region);
      }
      if (thread) {
        query = query.eq('thread', thread);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Supabase error:', error);
        // Fallback to in-memory storage
        const messages = await storage.getChatMessagesByCommunity(communityId, region as string, thread as string);
        return res.json(messages);
      }
      
      // Transform Supabase data to match ChatMessage type
      const messages = (data || []).map((msg: any) => ({
        id: msg.id,
        communityId: msg.topic_id,
        region: msg.region,
        thread: msg.thread,
        content: msg.content,
        authorId: msg.author_id,
        authorName: msg.author_name,
        messageType: msg.message_type || 'text',
        createdAt: msg.created_at,
      }));
      
      return res.json(messages);
    }
    
    // Fallback to in-memory storage
    const messages = await storage.getChatMessagesByCommunity(communityId, region as string, thread as string);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

router.post('/chat', defaultJsonParser, validateBody(InsertChatMessageSchema), async (req, res) => {
  try {
    // Try Supabase first if configured
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          topic_id: req.body.communityId,
          region: req.body.region,
          thread: req.body.thread,
          content: req.body.content,
          author_id: req.body.authorId,
          author_name: req.body.authorName,
          message_type: req.body.messageType || 'text',
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        // Fallback to in-memory storage
        const message = await storage.createChatMessage(req.body);
        return res.status(201).json(message);
      }
      
      // Transform response
      const message = {
        id: data.id,
        communityId: data.topic_id,
        region: data.region,
        thread: data.thread,
        content: data.content,
        authorId: data.author_id,
        authorName: data.author_name,
        messageType: data.message_type,
        createdAt: data.created_at,
      };
      
      return res.status(201).json(message);
    }
    
    // Fallback to in-memory storage
    const message = await storage.createChatMessage(req.body);
    res.status(201).json(message);
  } catch (error) {
    console.error('Error creating chat message:', error);
    res.status(500).json({ error: 'Failed to create chat message' });
  }
});

router.delete('/chat/:messageId', defaultJsonParser, async (req, res) => {
  try {
    const { messageId } = req.params;
    const deleted = await storage.deleteChatMessage(messageId);
    if (!deleted) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete chat message' });
  }
});

// Crisis-specific community routes
router.get('/crisis/:crisisId/community', defaultJsonParser, async (req, res) => {
  try {
    const { crisisId } = req.params;
    const community = await storage.getCommunityByCrisisId(crisisId);
    if (!community) {
      return res.status(404).json({ error: 'Community not found for this crisis' });
    }
    res.json(community);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch crisis community' });
  }
});

// Direct message routes
router.get('/dm/conversation/:conversationId', defaultJsonParser, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await storage.getDirectMessagesByConversation(conversationId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch direct messages' });
  }
});

router.get('/dm/between/:senderId/:recipientId', defaultJsonParser, async (req, res) => {
  try {
    const { senderId, recipientId } = req.params;
    const messages = await storage.getDirectMessagesBetweenUsers(senderId, recipientId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch direct messages' });
  }
});

router.get('/dm/conversations/:userId', defaultJsonParser, async (req, res) => {
  try {
    const { userId } = req.params;
    const conversations = await storage.getUserConversations(userId);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.post('/dm', defaultJsonParser, validateBody(InsertDirectMessageSchema), async (req, res) => {
  try {
    const message = await storage.createDirectMessage(req.body);
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create direct message' });
  }
});

router.patch('/dm/:messageId/read', defaultJsonParser, async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await storage.markDirectMessageAsRead(messageId);
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

export default router;