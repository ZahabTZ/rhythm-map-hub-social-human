import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { InsertStorySchema, ModerationActionSchema, LocationVerificationSchema } from '../shared/schema';
import { storage } from './storage';

const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

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
router.get('/stories/crisis/:crisisId', async (req, res) => {
  try {
    const { crisisId } = req.params;
    const stories = await storage.getApprovedStoriesByCrisis(crisisId);
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// Get pending stories (for moderation)
router.get('/stories/pending', async (req, res) => {
  try {
    const stories = await storage.getPendingStories();
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending stories' });
  }
});

// Submit a new story
router.post('/stories', upload.array('images', 5), validateBody(InsertStorySchema), async (req, res) => {
  try {
    const storyData = req.body;
    const files = req.files as Express.Multer.File[];
    
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

    // Process uploaded images (in a real app, you'd upload to cloud storage)
    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        // Mock image processing - in real app, upload to cloud storage
        const imageUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        imageUrls.push(imageUrl);
      }
    }

    // Create story with location verification
    const story = await storage.createStory({
      ...storyData,
      images: imageUrls,
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
router.post('/stories/:storyId/moderate', validateBody(ModerationActionSchema), async (req, res) => {
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
router.post('/stories/:storyId/like', async (req, res) => {
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
router.post('/location/verify', validateBody(LocationVerificationSchema), async (req, res) => {
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
router.get('/crises', async (req, res) => {
  try {
    const crises = await storage.getAllActiveCrises();
    res.json(crises);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch crises' });
  }
});

// Get specific crisis
router.get('/crises/:crisisId', async (req, res) => {
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