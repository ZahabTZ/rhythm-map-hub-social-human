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

  // Predefined locations as fallback when geocoding fails
  const predefinedLocations = [
    { name: "San Francisco, CA, USA", coords: [-122.4194, 37.7749] as [number, number], keywords: ["san francisco", "sf", "san fran"] },
    { name: "New York, NY, USA", coords: [-74.0060, 40.7128] as [number, number], keywords: ["new york", "nyc", "new york city"] },
    { name: "London, England, UK", coords: [-0.1276, 51.5074] as [number, number], keywords: ["london", "london uk", "london england"] },
    { name: "Tokyo, Japan", coords: [139.6503, 35.6762] as [number, number], keywords: ["tokyo", "tokyo japan"] },
    { name: "Paris, France", coords: [2.3522, 48.8566] as [number, number], keywords: ["paris", "paris france"] },
    { name: "Berlin, Germany", coords: [13.4050, 52.5200] as [number, number], keywords: ["berlin", "berlin germany", "germany"] },
    { name: "Sydney, Australia", coords: [151.2093, -33.8688] as [number, number], keywords: ["sydney", "sydney australia", "australia"] },
    { name: "Mumbai, India", coords: [72.8777, 19.0760] as [number, number], keywords: ["mumbai", "mumbai india", "india"] }
  ];

  const findPredefinedLocation = (query: string) => {
    const normalizedQuery = query.toLowerCase().trim();
    return predefinedLocations.find(location => 
      location.keywords.some(keyword => keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword))
    );
  };

  const searchLocation = async () => {
    if (!locationQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    // First, check if this matches a predefined location (works without token)
    const predefinedLocation = findPredefinedLocation(locationQuery);
    if (predefinedLocation) {
      console.log(`Found predefined location: ${predefinedLocation.name} at [${predefinedLocation.coords[0]}, ${predefinedLocation.coords[1]}]`);
      onLocationFound(predefinedLocation.coords, predefinedLocation.name);
      setLocationQuery(''); // Clear input after successful search
      setIsSearching(false);
      return;
    }

    // If not predefined and no token, show friendly error
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      setError('Location service unavailable. Try: San Francisco, New York, London, Tokyo, Paris, Berlin');
      setIsSearching(false);
      return;
    }

    try {
      // Use Mapbox Geocoding API for other locations
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationQuery)}.json?access_token=${mapboxToken}&types=country,region,district,place,locality&limit=1`
      );

      if (!response.ok) {
        throw new Error('Failed to search location');
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        const locationName = feature.place_name;

        onLocationFound([lng, lat], locationName);
        setLocationQuery(''); // Clear input after successful search
      } else {
        setError('Location not found. Try searching for a city or country name.');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('Failed to search location. Please try again.');
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