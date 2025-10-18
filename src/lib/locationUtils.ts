/**
 * Location utility functions for determining user's geographic context
 */

export interface LocationContext {
  countryCode: string;
  countryName: string;
  stateCode?: string;
  stateName?: string;
  cityName?: string;
  neighborhoodName?: string;
}

// Simple coordinate-based location database
// In production, this would use a reverse geocoding API (Mapbox, Google, etc.)
const LOCATION_DATABASE: { [key: string]: LocationContext } = {
  // San Francisco and neighborhoods
  'SF_BASE': {
    countryCode: 'US',
    countryName: 'United States',
    stateCode: 'CA',
    stateName: 'California',
    cityName: 'San Francisco',
  },
  'SF_MISSION': {
    countryCode: 'US',
    countryName: 'United States',
    stateCode: 'CA',
    stateName: 'California',
    cityName: 'San Francisco',
    neighborhoodName: 'Mission District',
  },
  'SF_HAIGHT': {
    countryCode: 'US',
    countryName: 'United States',
    stateCode: 'CA',
    stateName: 'California',
    cityName: 'San Francisco',
    neighborhoodName: 'Haight-Ashbury',
  },
  'SF_RICHMOND': {
    countryCode: 'US',
    countryName: 'United States',
    stateCode: 'CA',
    stateName: 'California',
    cityName: 'San Francisco',
    neighborhoodName: 'Richmond District',
  },
  'SF_SOMA': {
    countryCode: 'US',
    countryName: 'United States',
    stateCode: 'CA',
    stateName: 'California',
    cityName: 'San Francisco',
    neighborhoodName: 'SoMa',
  },
  'SF_TENDERLOIN': {
    countryCode: 'US',
    countryName: 'United States',
    stateCode: 'CA',
    stateName: 'California',
    cityName: 'San Francisco',
    neighborhoodName: 'Tenderloin',
  },
  
  // Bay Area cities
  'OAKLAND': {
    countryCode: 'US',
    countryName: 'United States',
    stateCode: 'CA',
    stateName: 'California',
    cityName: 'Oakland',
  },
  'SAN_JOSE': {
    countryCode: 'US',
    countryName: 'United States',
    stateCode: 'CA',
    stateName: 'California',
    cityName: 'San Jose',
  },
  
  // Other US cities
  'MIAMI': {
    countryCode: 'US',
    countryName: 'United States',
    stateCode: 'FL',
    stateName: 'Florida',
    cityName: 'Miami',
  },
  
  // International cities
  'TOKYO': {
    countryCode: 'JP',
    countryName: 'Japan',
    cityName: 'Tokyo',
  },
  'AMSTERDAM': {
    countryCode: 'NL',
    countryName: 'Netherlands',
    cityName: 'Amsterdam',
  },
  'SYDNEY': {
    countryCode: 'AU',
    countryName: 'Australia',
    stateCode: 'NSW',
    stateName: 'New South Wales',
    cityName: 'Sydney',
  },
  'ARUSHA': {
    countryCode: 'TZ',
    countryName: 'Tanzania',
    cityName: 'Arusha',
  },
  'MUMBAI': {
    countryCode: 'IN',
    countryName: 'India',
    stateCode: 'MH',
    stateName: 'Maharashtra',
    cityName: 'Mumbai',
  },
  'SAO_PAULO': {
    countryCode: 'BR',
    countryName: 'Brazil',
    stateCode: 'SP',
    stateName: 'São Paulo',
    cityName: 'São Paulo',
  },
  'DUBAI': {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    cityName: 'Dubai',
  },
  'VANCOUVER': {
    countryCode: 'CA',
    countryName: 'Canada',
    stateCode: 'BC',
    stateName: 'British Columbia',
    cityName: 'Vancouver',
  },
  'REYKJAVIK': {
    countryCode: 'IS',
    countryName: 'Iceland',
    cityName: 'Reykjavik',
  },
};

// Coordinate ranges for neighborhoods and cities
const COORDINATE_RANGES = {
  // San Francisco neighborhoods (rough boundaries)
  'SF_MISSION': { latMin: 37.745, latMax: 37.770, lngMin: -122.430, lngMax: -122.405 },
  'SF_HAIGHT': { latMin: 37.765, latMax: 37.775, lngMin: -122.455, lngMax: -122.435 },
  'SF_RICHMOND': { latMin: 37.770, latMax: 37.790, lngMin: -122.490, lngMax: -122.450 },
  'SF_SOMA': { latMin: 37.770, latMax: 37.785, lngMin: -122.415, lngMax: -122.390 },
  'SF_TENDERLOIN': { latMin: 37.782, latMax: 37.788, lngMin: -122.418, lngMax: -122.408 },
  
  // San Francisco city (general)
  'SF_BASE': { latMin: 37.708, latMax: 37.833, lngMin: -122.517, lngMax: -122.357 },
  
  // Bay Area cities
  'OAKLAND': { latMin: 37.705, latMax: 37.885, lngMin: -122.355, lngMax: -122.115 },
  'SAN_JOSE': { latMin: 37.201, latMax: 37.469, lngMin: -122.039, lngMax: -121.654 },
  
  // Other US cities (rough bounding boxes)
  'MIAMI': { latMin: 25.700, latMax: 25.855, lngMin: -80.330, lngMax: -80.130 },
  
  // International cities
  'TOKYO': { latMin: 35.530, latMax: 35.817, lngMin: 139.560, lngMax: 139.910 },
  'AMSTERDAM': { latMin: 52.278, latMax: 52.431, lngMin: 4.728, lngMax: 5.079 },
  'SYDNEY': { latMin: -34.118, latMax: -33.578, lngMin: 150.520, lngMax: 151.343 },
  'ARUSHA': { latMin: -3.450, latMax: -3.300, lngMin: 36.600, lngMax: 36.750 },
  'MUMBAI': { latMin: 18.892, latMax: 19.270, lngMin: 72.776, lngMax: 72.980 },
  'SAO_PAULO': { latMin: -23.710, latMax: -23.392, lngMin: -46.826, lngMax: -46.365 },
  'DUBAI': { latMin: 25.079, latMax: 25.359, lngMin: 55.106, lngMax: 55.543 },
  'VANCOUVER': { latMin: 49.198, latMax: 49.316, lngMin: -123.224, lngMax: -123.024 },
  'REYKJAVIK': { latMin: 64.102, latMax: 64.174, lngMin: -21.970, lngMax: -21.780 },
};

/**
 * Determine user's location context from coordinates
 * Uses simple bounding box checks - in production, use proper reverse geocoding API
 */
export function getLocationContextFromCoordinates(lat: number, lng: number): LocationContext {
  // Check neighborhoods first (more specific)
  for (const [key, range] of Object.entries(COORDINATE_RANGES)) {
    if (
      lat >= range.latMin &&
      lat <= range.latMax &&
      lng >= range.lngMin &&
      lng <= range.lngMax
    ) {
      const context = LOCATION_DATABASE[key];
      if (context) {
        return context;
      }
    }
  }
  
  // Default fallback to San Francisco if no match (for demo purposes)
  return LOCATION_DATABASE['SF_BASE'];
}

/**
 * Get location display name based on region level and context
 */
export function getLocationDisplayName(
  region: 'neighborhood' | 'city' | 'state' | 'national' | 'global',
  context: LocationContext
): string {
  switch (region) {
    case 'neighborhood':
      return context.neighborhoodName || context.cityName || 'Unknown';
    case 'city':
      return context.cityName || 'Unknown City';
    case 'state':
      return context.stateName || context.stateCode || 'Unknown State';
    case 'national':
      return context.countryName || 'Unknown Country';
    case 'global':
      return 'Global';
    default:
      return 'Unknown';
  }
}

