import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  X, 
  ChevronDown, 
  ChevronUp,
  Navigation,
  Crosshair
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DevToolbarProps {
  onLocationChange: (lat: number, lng: number, name: string) => void;
  onUseRealLocation?: () => void;
}

// Preset locations matching the community markers on the map
const PRESET_LOCATIONS = [
  { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194, category: 'US West' },
  { name: 'Miami, Florida', lat: 25.7617, lng: -80.1918, category: 'US Southeast' },
  { name: 'New York, NY', lat: 40.7128, lng: -74.0060, category: 'US Northeast' },
  { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437, category: 'US West' },
  { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298, category: 'US Midwest' },
  { name: 'Vancouver, Canada', lat: 49.2827, lng: -123.1207, category: 'North America' },
  { name: 'Tokyo, Japan', lat: 35.6895, lng: 139.6917, category: 'Asia' },
  { name: 'Mumbai, India', lat: 19.0760, lng: 72.8777, category: 'Asia' },
  { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708, category: 'Middle East' },
  { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093, category: 'Oceania' },
  { name: 'Amsterdam, Netherlands', lat: 52.3676, lng: 4.9041, category: 'Europe' },
  { name: 'Reykjavik, Iceland', lat: 64.1466, lng: -21.8174, category: 'Europe' },
  { name: 'São Paulo, Brazil', lat: -23.5505, lng: -46.6333, category: 'South America' },
  { name: 'Arusha, Tanzania', lat: -3.3667, lng: 36.6833, category: 'Africa' },
  // Crisis locations for testing
  { name: 'Gaza City', lat: 31.5, lng: 34.45, category: 'Crisis Zones' },
  { name: 'Kyiv, Ukraine', lat: 50.4501, lng: 30.5234, category: 'Crisis Zones' },
  { name: 'Port-au-Prince, Haiti', lat: 18.5944, lng: -72.3074, category: 'Crisis Zones' },
];

const LOCATION_CATEGORIES = [
  'US West',
  'US Southeast', 
  'US Northeast',
  'US Midwest',
  'North America',
  'Europe',
  'Asia',
  'Middle East',
  'Africa',
  'South America',
  'Oceania',
  'Crisis Zones'
];

export const DevToolbar: React.FC<DevToolbarProps> = ({ 
  onLocationChange, 
  onUseRealLocation 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('No location set');
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');

  // Only show in development mode
  // Temporarily disabled check for testing
  // if (import.meta.env.PROD) {
  //   return null;
  // }

  const handlePresetSelect = (value: string) => {
    const location = PRESET_LOCATIONS.find(loc => loc.name === value);
    if (location) {
      setCurrentLocation(location.name);
      onLocationChange(location.lat, location.lng, location.name);
    }
  };

  const handleCustomLocation = () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude values');
      return;
    }

    if (lat < -90 || lat > 90) {
      alert('Latitude must be between -90 and 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      alert('Longitude must be between -180 and 180');
      return;
    }

    const locationName = `Custom: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    setCurrentLocation(locationName);
    onLocationChange(lat, lng, locationName);
    setCustomLat('');
    setCustomLng('');
  };

  const handleRealLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation(`Real Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          onLocationChange(latitude, longitude, 'Your Real Location');
          if (onUseRealLocation) {
            onUseRealLocation();
          }
        },
        (error) => {
          alert(`Failed to get location: ${error.message}`);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isExpanded ? (
        <Button
          onClick={() => setIsExpanded(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg"
          size="lg"
        >
          <MapPin className="h-5 w-5 mr-2" />
          Dev Location Tools
        </Button>
      ) : (
        <div className="bg-card border-2 border-orange-600 rounded-lg shadow-2xl p-4 w-96 max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              <h3 className="font-bold text-lg">Dev Location Tools</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Current Location Display */}
          <div className="mb-4 p-3 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground mb-1">Current Mock Location:</p>
            <p className="text-sm font-medium">{currentLocation}</p>
          </div>

          {/* Real Location Button */}
          <Button
            onClick={handleRealLocation}
            variant="outline"
            className="w-full mb-4 border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Use Real Location
          </Button>

          {/* Preset Locations */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">
              Quick Locations:
            </label>
            <Select onValueChange={handlePresetSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a city..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {LOCATION_CATEGORIES.map((category) => {
                  const locations = PRESET_LOCATIONS.filter((loc) => loc.category === category);
                  if (!locations || locations.length === 0) return null;
                  
                  return (
                    <React.Fragment key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {category}
                      </div>
                      {locations.map(location => (
                        <SelectItem key={location.name} value={location.name}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Coordinates */}
          <div className="space-y-2">
            <label className="text-sm font-medium block">
              Custom Coordinates:
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.0001"
                placeholder="Latitude"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                step="0.0001"
                placeholder="Longitude"
                value={customLng}
                onChange={(e) => setCustomLng(e.target.value)}
                className="flex-1"
              />
            </div>
            <Button
              onClick={handleCustomLocation}
              variant="outline"
              className="w-full"
              disabled={!customLat || !customLng}
            >
              <Crosshair className="h-4 w-4 mr-2" />
              Set Custom Location
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950 rounded-md border border-orange-200 dark:border-orange-800">
            <p className="text-xs text-orange-900 dark:text-orange-200">
              <strong>💡 Tip:</strong> Set your location to test how communities appear based on proximity. 
              Try locations near community markers to see hyperlocal features in action!
            </p>
          </div>

          {/* Dev Badge */}
          <div className="mt-3 flex justify-center">
            <Badge variant="outline" className="text-xs border-orange-600 text-orange-600">
              Development Mode Only
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};


