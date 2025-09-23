import { LocationVerification } from '../../shared/schema';

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface LocationVerificationResult {
  isWithinRange: boolean;
  distance: number;
  maxDistance: number;
}

export class LocationService {
  private static instance: LocationService;
  
  static getInstance(): LocationService {
    if (!this.instance) {
      this.instance = new LocationService();
    }
    return this.instance;
  }

  /**
   * Get user's current location using browser geolocation API
   */
  async getCurrentLocation(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          let message = 'Failed to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000, // 5 minutes
        }
      );
    });
  }

  /**
   * Verify if user location is within range of a crisis location
   */
  async verifyLocationWithinCrisis(
    userLat: number,
    userLng: number,
    crisisLat: number,
    crisisLng: number,
    maxDistanceKm = 50
  ): Promise<LocationVerificationResult> {
    const verificationData: LocationVerification = {
      userLat,
      userLng,
      crisisLat,
      crisisLng,
      maxDistanceKm,
    };

    try {
      const response = await fetch('/api/location/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
      });

      if (!response.ok) {
        throw new Error('Failed to verify location');
      }

      return await response.json();
    } catch (error) {
      console.warn('API location verification failed, using client-side fallback:', error);
      // Fallback to client-side calculation if API fails
      const distance = this.calculateDistance(userLat, userLng, crisisLat, crisisLng);
      return {
        isWithinRange: distance <= maxDistanceKm,
        distance: Math.round(distance * 100) / 100,
        maxDistance: maxDistanceKm,
      };
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Request location permission
   */
  async requestLocationPermission(): Promise<boolean> {
    if (!navigator.permissions) {
      // Permissions API not supported, try to get location directly
      try {
        await this.getCurrentLocation();
        return true;
      } catch {
        return false;
      }
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state === 'granted';
    } catch {
      return false;
    }
  }
}

export const locationService = LocationService.getInstance();