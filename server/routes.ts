import express from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { 
  InsertStorySchema, 
  ModerationActionSchema, 
  LocationVerificationSchema,
  InsertCommunitySchema,
  InsertDiscussionSchema,
  InsertEventSchema
} from '../shared/schema';
import { storage } from './storage';
import { requireAuth, optionalAuth } from './auth';

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const router = express.Router();

// JSON parsing middleware for most routes (small limit)
const defaultJsonParser = express.json({ limit: '1mb' });

// Simple moderator authentication middleware
const checkModeratorAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const moderatorKey = req.headers['x-moderator-key'];
  const validKey = 'crisis-moderator-key'; // In production, use environment variable
  
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

// Community routes
router.get('/communities', defaultJsonParser, async (req, res) => {
  try {
    const communities = await storage.getAllCommunities();
    res.json(communities);
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

router.post('/communities', requireAuth, defaultJsonParser, validateBody(InsertCommunitySchema), async (req: any, res) => {
  try {
    // Check if user is verified host
    const user = req.user;
    if (!user.isVerifiedHost || (user.verifiedHostExpiresAt && new Date(user.verifiedHostExpiresAt) <= new Date())) {
      return res.status(403).json({ error: 'Verified host status required' });
    }

    const community = await storage.createCommunity({
      ...req.body,
      createdBy: user.id, // Set server-side from authenticated user
    });
    res.status(201).json(community);
  } catch (error) {
    console.error('Error creating community:', error);
    res.status(500).json({ error: 'Failed to create community' });
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
  let event;
  
  try {
    // Note: In production, you should set STRIPE_WEBHOOK_SECRET
    event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test');
  } catch (err: any) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const { userId, type } = paymentIntent.metadata;
    
    if (type === 'verified_host_annual_fee') {
      // Update payment status
      await storage.updatePaymentStatus(paymentIntent.id, 'succeeded');
      
      // Grant verified host status for one year
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      
      await storage.updateUserVerifiedHostStatus(userId, true, expiresAt.toISOString());
      
      console.log(`User ${userId} is now a verified host until ${expiresAt.toISOString()}`);
    }
  }
  
  res.json({ received: true });
});

export default router;