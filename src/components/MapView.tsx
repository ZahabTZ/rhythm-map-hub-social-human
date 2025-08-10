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

  // Regional music data
  const getRegionData = (region: string) => {
    const regionData: { [key: string]: any[] } = {
      us: [
        { id: 1, name: 'Drake', type: 'musician', genre: 'Hip Hop', location: 'Toronto/Atlanta', rating: 9.8 },
        { id: 2, name: 'Atlantic Records', type: 'business', category: 'Record Label', location: 'New York', rating: 9.5 },
        { id: 3, name: 'Coachella', type: 'event', venue: 'Empire Polo Club', location: 'California', date: '2024-04-12' },
        { id: 4, name: 'Taylor Swift', type: 'musician', genre: 'Pop', location: 'Nashville', rating: 9.9 },
        { id: 5, name: 'Spotify Studios', type: 'business', category: 'Streaming/Production', location: 'Los Angeles', rating: 9.3 }
      ],
      europe: [
        { id: 6, name: 'Adele', type: 'musician', genre: 'Soul/Pop', location: 'London', rating: 9.7 },
        { id: 7, name: 'Abbey Road Studios', type: 'business', category: 'Recording Studio', location: 'London', rating: 9.8 },
        { id: 8, name: 'Tomorrowland', type: 'event', venue: 'De Schorre', location: 'Belgium', date: '2024-07-19' },
        { id: 9, name: 'Daft Punk', type: 'musician', genre: 'Electronic', location: 'Paris', rating: 9.6 },
        { id: 10, name: 'Universal Music Group', type: 'business', category: 'Record Label', location: 'London', rating: 9.4 }
      ],
      asia: [
        { id: 11, name: 'BTS', type: 'musician', genre: 'K-Pop', location: 'Seoul', rating: 9.9 },
        { id: 12, name: 'YG Entertainment', type: 'business', category: 'Entertainment Company', location: 'Seoul', rating: 9.2 },
        { id: 13, name: 'Summer Sonic', type: 'event', venue: 'ZoZo Marine Stadium', location: 'Tokyo', date: '2024-08-17' },
        { id: 14, name: 'Hikaru Utada', type: 'musician', genre: 'J-Pop', location: 'Tokyo', rating: 9.5 },
        { id: 15, name: 'Avex Group', type: 'business', category: 'Record Label', location: 'Tokyo', rating: 9.1 }
      ],
      southamerica: [
        { id: 16, name: 'Bad Bunny', type: 'musician', genre: 'Reggaeton', location: 'San Juan', rating: 9.8 },
        { id: 17, name: 'Som Livre', type: 'business', category: 'Record Label', location: 'Rio de Janeiro', rating: 9.0 },
        { id: 18, name: 'Rock in Rio', type: 'event', venue: 'Cidade do Rock', location: 'Rio de Janeiro', date: '2024-09-13' },
        { id: 19, name: 'Anitta', type: 'musician', genre: 'Pop/Funk', location: 'Rio de Janeiro', rating: 9.4 },
        { id: 20, name: 'Monstercat Brasil', type: 'business', category: 'Label/Management', location: 'São Paulo', rating: 8.9 }
      ],
      africa: [
        { id: 21, name: 'Burna Boy', type: 'musician', genre: 'Afrobeats', location: 'Lagos', rating: 9.6 },
        { id: 22, name: 'Mavin Records', type: 'business', category: 'Record Label', location: 'Lagos', rating: 9.2 },
        { id: 23, name: 'AfroFuture Festival', type: 'event', venue: 'FNB Stadium', location: 'Johannesburg', date: '2024-12-07' },
        { id: 24, name: 'Wizkid', type: 'musician', genre: 'Afrobeats', location: 'Lagos', rating: 9.5 },
        { id: 25, name: 'Chocolate City', type: 'business', category: 'Record Label', location: 'Abuja', rating: 8.8 }
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
        center: [0, 20],
        zoom: 2,
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

      // Add sample music location markers
      const musicLocations = [
        { id: 'la', coords: [-118.2437, 34.0522], name: 'Los Angeles', type: 'musician', genre: 'Hip Hop' },
        { id: 'ny', coords: [-74.0059, 40.7128], name: 'New York', type: 'business', category: 'Producer' },
        { id: 'london', coords: [-0.1276, 51.5074], name: 'London', type: 'concert', venue: 'Royal Albert Hall' },
        { id: 'tokyo', coords: [139.6917, 35.6895], name: 'Tokyo', type: 'musician', genre: 'Electronic' },
        { id: 'berlin', coords: [13.4050, 52.5200], name: 'Berlin', type: 'business', category: 'Sound Engineer' },
        { id: 'rio', coords: [-43.1729, -22.9068], name: 'Rio de Janeiro', type: 'concert', venue: 'Rock in Rio' },
      ];

      musicLocations.forEach((location) => {
        const color = location.type === 'musician' ? '#ff4d9f' : 
                      location.type === 'business' ? '#ffd700' : '#4df780';
        
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
                    ${location.type === 'musician' ? `Genre: ${location.genre}` :
                      location.type === 'business' ? `Category: ${location.category}` :
                      `Venue: ${location.venue}`}
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
      
      // Simple region detection based on coordinates
      let region = 'Unknown';
      let regionData = [];
      
      if (lng >= -130 && lng <= -60 && lat >= 25 && lat <= 50) {
        region = 'United States';
        regionData = getRegionData('us');
      } else if (lng >= -10 && lng <= 30 && lat >= 35 && lat <= 70) {
        region = 'Europe';
        regionData = getRegionData('europe');
      } else if (lng >= 100 && lng <= 150 && lat >= 20 && lat <= 50) {
        region = 'East Asia';
        regionData = getRegionData('asia');
      } else if (lng >= -80 && lng <= -30 && lat >= -30 && lat <= 15) {
        region = 'South America';
        regionData = getRegionData('southamerica');
      } else if (lng >= -10 && lng <= 50 && lat >= -35 && lat <= 35) {
        region = 'Africa';
        regionData = getRegionData('africa');
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