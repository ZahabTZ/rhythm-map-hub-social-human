import { useState, useCallback } from 'react';
import { locationService, UserLocation, LocationVerificationResult } from '@/lib/locationService';
import { Crisis } from '../../shared/schema';

export interface LocationVerificationState {
  isLoading: boolean;
  userLocation: UserLocation | null;
  verificationResult: LocationVerificationResult | null;
  error: string | null;
  hasPermission: boolean | null;
}

export const useLocationVerification = () => {
  const [state, setState] = useState<LocationVerificationState>({
    isLoading: false,
    userLocation: null,
    verificationResult: null,
    error: null,
    hasPermission: null,
  });

  const requestLocationPermission = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const hasPermission = await locationService.requestLocationPermission();
      setState(prev => ({ ...prev, hasPermission, isLoading: false }));
      return hasPermission;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to request location permission',
        isLoading: false,
      }));
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<UserLocation | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const location = await locationService.getCurrentLocation();
      setState(prev => ({ 
        ...prev, 
        userLocation: location, 
        isLoading: false,
        hasPermission: true 
      }));
      return location;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get current location',
        isLoading: false,
        hasPermission: false,
      }));
      return null;
    }
  }, []);

  const verifyLocationWithinCrisis = useCallback(async (crisis: Crisis): Promise<LocationVerificationResult | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Get current location if we don't have it
      let location = state.userLocation;
      if (!location) {
        location = await locationService.getCurrentLocation();
        if (!location) {
          throw new Error('Could not get current location');
        }
      }

      const result = await locationService.verifyLocationWithinCrisis(
        location.lat,
        location.lng,
        crisis.location.lat,
        crisis.location.lng,
        50 // 50km default range
      );

      setState(prev => ({ 
        ...prev, 
        userLocation: location,
        verificationResult: result, 
        isLoading: false,
        hasPermission: true 
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to verify location',
        isLoading: false,
      }));
      return null;
    }
  }, [state.userLocation]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const resetVerification = useCallback(() => {
    setState({
      isLoading: false,
      userLocation: null,
      verificationResult: null,
      error: null,
      hasPermission: null,
    });
  }, []);

  return {
    ...state,
    requestLocationPermission,
    getCurrentLocation,
    verifyLocationWithinCrisis,
    clearError,
    resetVerification,
  };
};