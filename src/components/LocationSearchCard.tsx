import React, { useState } from 'react';
import { MapPin, Search, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LocationSearchCardProps {
  onLocationFound: (coordinates: [number, number], locationName: string) => void;
}

const LocationSearchCard: React.FC<LocationSearchCardProps> = ({ onLocationFound }) => {
  const [locationQuery, setLocationQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Predefined locations for quick testing and fallback
  const predefinedLocations: Record<string, { coordinates: [number, number]; name: string }> = {
    'san francisco': { coordinates: [-122.4194, 37.7749], name: 'San Francisco, California, USA' },
    'new york': { coordinates: [-74.0060, 40.7128], name: 'New York City, New York, USA' },
    'new york city': { coordinates: [-74.0060, 40.7128], name: 'New York City, New York, USA' },
    'london': { coordinates: [-0.1276, 51.5074], name: 'London, England, UK' },
    'tokyo': { coordinates: [139.6503, 35.6762], name: 'Tokyo, Japan' },
    'paris': { coordinates: [2.3522, 48.8566], name: 'Paris, France' },
    'germany': { coordinates: [10.4515, 51.1657], name: 'Germany' },
    'los angeles': { coordinates: [-118.2437, 34.0522], name: 'Los Angeles, California, USA' },
    'chicago': { coordinates: [-87.6298, 41.8781], name: 'Chicago, Illinois, USA' },
    'miami': { coordinates: [-80.1918, 25.7617], name: 'Miami, Florida, USA' },
  };

  const searchLocation = async () => {
    if (!locationQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const queryLower = locationQuery.toLowerCase().trim();
      
      // Check predefined locations first for quick results
      if (predefinedLocations[queryLower]) {
        const location = predefinedLocations[queryLower];
        console.log(`Found predefined location: ${location.name} at [${location.coordinates[0]}, ${location.coordinates[1]}]`);
        onLocationFound(location.coordinates, location.name);
        setLocationQuery(''); // Clear input after successful search
        setIsSearching(false);
        return;
      }

      const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
      console.log('MapBox token available:', !!mapboxToken);
      
      if (!mapboxToken) {
        throw new Error('Mapbox token not configured');
      }

      // Use Mapbox Geocoding API
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationQuery)}.json?access_token=${mapboxToken}&types=country,region,district,place,locality&limit=1`;
      console.log('Making geocoding request for:', locationQuery);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Geocoding response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Geocoding API error:', errorText);
        throw new Error(`Failed to search location: ${response.status}`);
      }

      const data = await response.json();
      console.log('Geocoding data:', data);

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        const locationName = feature.place_name;
        
        console.log(`Found location: ${locationName} at [${lng}, ${lat}]`);
        onLocationFound([lng, lat], locationName);
        setLocationQuery(''); // Clear input after successful search
      } else {
        setError('Location not found. Try searching for a city or country name.');
      }
    } catch (err) {
      console.error('Geocoding error details:', err);
      // Suggest predefined locations as alternatives
      const suggestions = Object.keys(predefinedLocations).slice(0, 3).join(', ');
      setError(`Search failed. Try one of these: ${suggestions}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchLocation();
    }
  };

  const locationExamples = [
    "San Francisco",
    "New York City", 
    "London",
    "Tokyo",
    "Paris",
    "Germany"
  ];

  return (
    <div className="bg-card/95 backdrop-blur-sm rounded-lg border shadow-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <h3 className="font-medium text-sm">Go to Location</h3>
      </div>

      {/* Location Search Input */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Enter city or country name..."
          value={locationQuery}
          onChange={(e) => setLocationQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-16 bg-background/50"
          disabled={isSearching}
          data-testid="input-location-search"
        />
        <Button
          onClick={searchLocation}
          size="sm"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7"
          disabled={isSearching || !locationQuery.trim()}
          data-testid="button-search-location"
        >
          {isSearching ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Search className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Alert className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Location Examples */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Quick examples:</p>
        <div className="flex flex-wrap gap-1">
          {locationExamples.map((example) => (
            <button
              key={example}
              onClick={() => setLocationQuery(example)}
              className="text-xs px-2 py-1 bg-muted/50 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              disabled={isSearching}
              data-testid={`button-example-${example.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationSearchCard;