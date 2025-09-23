import express from 'express';
import { z } from 'zod';
import { InsertStorySchema, ModerationActionSchema, LocationVerificationSchema } from '../shared/schema';
import { storage } from './storage';

const router = express.Router();

// JSON parsing middleware for most routes (small limit)
const defaultJsonParser = express.json({ limit: '1mb' });

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
router.get('/stories/pending', defaultJsonParser, async (req, res) => {
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
router.post('/stories/:storyId/moderate', defaultJsonParser, validateBody(ModerationActionSchema), async (req, res) => {
  try {
    const { storyId } = req.params;
    const moderationData = { ...req.body, storyId };
    
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

export default router;