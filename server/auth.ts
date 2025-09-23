import type { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { storage } from './storage';

const googleClient = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Middleware to verify Google ID tokens and attach user to request
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.substring(7);
    
    if (!token) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.VITE_GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    
    // Get or create user in our system
    const googleUser = {
      id: payload.sub,
      email: payload.email!,
      name: payload.name!,
      picture: payload.picture,
    };
    
    const user = await storage.createOrUpdateUser(googleUser);
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Auth verification failed:', error);
    return res.status(401).json({ error: 'Token verification failed' });
  }
}

// Optional auth middleware (doesn't fail if no auth, but attaches user if present)
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        try {
          const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.VITE_GOOGLE_CLIENT_ID,
          });
          
          const payload = ticket.getPayload();
          if (payload) {
            const googleUser = {
              id: payload.sub,
              email: payload.email!,
              name: payload.name!,
              picture: payload.picture,
            };
            
            const user = await storage.createOrUpdateUser(googleUser);
            req.user = user;
          }
        } catch (authError) {
          // Silent fail for optional auth
          console.warn('Optional auth failed:', authError);
        }
      }
    }
    
    next();
  } catch (error) {
    // Silent fail for optional auth
    console.warn('Optional auth middleware error:', error);
    next();
  }
}