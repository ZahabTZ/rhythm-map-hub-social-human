import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MapViewProps {
  onLocationSelect?: (location: { lat: number; lng: number; name: string; regionData?: any[] }) => void;
}

const MapView: React.FC<MapViewProps> = ({ onLocationSelect }) => {
  console.log('MapView component rendered');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);

  // Regional local data
  const getRegionData = (region: string) => {
    const regionData: { [key: string]: any[] } = {
      sf: [
        { id: 1, title: 'Mission District Street Fair Returns', type: 'news', category: 'Community Events', location: 'Mission District', source: 'Mission Local' },
        { id: 2, name: 'Sunset District Neighborhood Watch', type: 'community', category: 'Safety', location: 'Sunset District', members: 450 },
        { id: 3, name: 'Castro Street Fair', type: 'event', venue: 'Castro Street', location: 'Castro District', date: '2024-10-06' },
        { id: 4, title: 'New Bike Lanes Coming to Valencia Street', type: 'news', category: 'Transportation', location: 'Mission District', source: 'Streetsblog SF' },
        { id: 5, name: 'Chinatown Community Garden', type: 'community', category: 'Environment', location: 'Chinatown', members: 89 }
      ]
    };
    return regionData[region] || [];
  };
  
  console.log('MapView state:', { showTokenInput, tokenLength: mapboxToken.length });

  const initializeMap = (token: string) => {
    console.log('initializeMap function called');
    console.log('mapContainer.current:', mapContainer.current);
    if (!mapContainer.current) {
      console.log('mapContainer.current is null, returning early');
      return;
    }

    console.log('Initializing map with token:', token.substring(0, 20) + '...');
    mapboxgl.accessToken = token;
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-122.4194, 37.7749], // San Francisco
        zoom: 10,
        projection: 'globe' as any,
      });

      console.log('Map created successfully');
    } catch (error) {
      console.error('Error creating map:', error);
      return;
    }

    // Add atmosphere and styling for dark theme
    map.current.on('style.load', () => {
      if (!map.current) return;
      
      map.current.setFog({
        color: 'rgb(20, 20, 30)',
        'high-color': 'rgb(5, 5, 15)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(5, 5, 15)',
        'star-intensity': 0.6,
      });

      // Add sample local content markers in San Francisco
      const localLocations = [
        { id: 'mission', coords: [-122.4194, 37.7593], name: 'Mission District', type: 'news', category: 'New Bike Lanes' },
        { id: 'castro', coords: [-122.4348, 37.7609], name: 'Castro District', type: 'events', category: 'Street Fair' },
        { id: 'chinatown', coords: [-122.4058, 37.7941], name: 'Chinatown', type: 'communities', category: 'Community Garden' },
        { id: 'haight', coords: [-122.4477, 37.7694], name: 'Haight-Ashbury', type: 'news', category: 'Local Business' },
        { id: 'north_beach', coords: [-122.4102, 37.8006], name: 'North Beach', type: 'events', category: 'Italian Festival' },
        { id: 'sunset', coords: [-122.4759, 37.7431], name: 'Sunset District', type: 'communities', category: 'Neighborhood Watch' },
        { id: 'richmond', coords: [-122.4786, 37.7816], name: 'Richmond District', type: 'news', category: 'Park Renovation' },
        { id: 'soma', coords: [-122.4089, 37.7749], name: 'SOMA', type: 'events', category: 'Tech Meetup' },
      ];

      localLocations.forEach((location) => {
        const color = location.type === 'news' ? '#3b82f6' : 
                      location.type === 'communities' ? '#10b981' : '#f59e0b';
        
        const marker = new mapboxgl.Marker({
          color: color,
          scale: 0.8
        })
          .setLngLat(location.coords as [number, number])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div class="p-2 bg-card text-card-foreground rounded">
                  <h3 class="font-semibold">${location.name}</h3>
                  <p class="text-sm text-muted-foreground">
                    ${location.type}: ${location.category}
                  </p>
                </div>
              `)
          )
          .addTo(map.current!);
      });
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    // Add click handler for geographical areas
    map.current.on('click', async (e) => {
      if (!onLocationSelect) return;
      
      const { lng, lat } = e.lngLat;
      
      // Simple region detection based on coordinates (focused on SF)
      let region = 'Unknown';
      let regionData = [];
      
      if (lng >= -122.52 && lng <= -122.35 && lat >= 37.7 && lat <= 37.85) {
        region = 'San Francisco';
        regionData = getRegionData('sf');
      }
      
      onLocationSelect({
        lat,
        lng,
        name: region,
        regionData
      });
    });
  };

  const handleTokenSubmit = () => {
    console.log('handleTokenSubmit called with token:', mapboxToken.substring(0, 10) + '...');
    if (mapboxToken.trim()) {
      console.log('Token is valid, hiding token input...');
      setShowTokenInput(false);
    } else {
      console.log('Token is empty or invalid');
    }
  };

  // Initialize map when token input is hidden and container is available
  useEffect(() => {
    if (!showTokenInput && mapboxToken && mapContainer.current) {
      console.log('Container is now available, initializing map...');
      initializeMap(mapboxToken);
    }
  }, [showTokenInput, mapboxToken]);

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  if (showTokenInput) {
    return (
      <div className="relative w-full h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full mx-4 p-6 bg-card rounded-lg shadow-lg border">
          <h2 className="text-xl font-semibold mb-4 text-center">Setup Required</h2>
          <p className="text-sm text-muted-foreground mb-4">
            To use the map, please enter your Mapbox public token. 
            You can get one at{' '}
            <a 
              href="https://mapbox.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="pk.ey..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTokenSubmit()}
            />
            <Button onClick={handleTokenSubmit} className="w-full" variant="default">
              Initialize Map
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default MapView;