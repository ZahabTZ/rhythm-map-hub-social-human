import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MapViewProps {
  onLocationSelect?: (location: { lat: number; lng: number; name: string; regionData?: any[] }) => void;
  onHumanitarianClick?: () => void;
  humanitarianMode?: boolean;
  onMapReady?: (mapControls: { centerOnLocation: (coordinates: [number, number], locationName?: string) => void }) => void;
  onRegionSelect?: (region: 'neighborhood' | 'city' | 'state' | 'national' | 'global') => void;
}

const MapView: React.FC<MapViewProps> = ({ onLocationSelect, onHumanitarianClick, humanitarianMode: externalHumanitarianMode, onMapReady, onRegionSelect }) => {
  console.log('MapView component rendered');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | undefined>(
    import.meta.env.VITE_MAPBOX_TOKEN
  )
  // const [showTokenInput, setShowTokenInput] = useState(true);
  const [humanitarianMode, setHumanitarianMode] = useState(false);
  const humanitarianModeRef = useRef(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Update ref whenever state changes
  useEffect(() => {
    humanitarianModeRef.current = humanitarianMode;
  }, [humanitarianMode]);

  // Sync external humanitarian mode if provided
  useEffect(() => {
    if (externalHumanitarianMode !== undefined && externalHumanitarianMode !== humanitarianMode) {
      setHumanitarianMode(externalHumanitarianMode);
    }
  }, [externalHumanitarianMode]);

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
  
  console.log('MapView state:', { hasToken: Boolean(mapboxToken), tokenValid: Boolean(mapboxToken && mapboxToken.length > 0) });

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
        center: [0, 20], // Global view
        zoom: 1.2, // Show full globe
        projection: 'globe' as any,
      });

      console.log('Map created successfully');

      // Set map as ready when it loads
      map.current.on('load', () => {
        setMapReady(true);
        console.log('Map loaded and ready');
        
        // Notify parent component that map is ready and provide controls
        if (onMapReady) {
          onMapReady({ centerOnLocation });
        }
      });
    } catch (error) {
      console.error('Error creating map:', error);
      
      // Even if map fails to initialize, provide a fallback centerOnLocation function
      if (onMapReady) {
        const fallbackCenterOnLocation = (coordinates: [number, number], locationName?: string) => {
          console.log(`Fallback: Centering on ${locationName || 'location'} at [${coordinates[0]}, ${coordinates[1]}]`);
          
          // Since visual map failed, simulate map state changes for the UI
          setMapReady(true);
          console.log(`Fallback map centering completed for: ${locationName}`);
          
          // Update user location state to the searched location for UI consistency
          setUserLocation({ lat: coordinates[1], lng: coordinates[0] });
        };
        
        onMapReady({ centerOnLocation: fallbackCenterOnLocation });
      }
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

    // Add click handler for geographical areas (only when not in humanitarian mode)
    map.current.on('click', async (e) => {
      // Handle humanitarian mode clicks
      if (humanitarianModeRef.current) {
        onHumanitarianClick?.();
        return;
      }
      
      // Handle normal mode clicks
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

    // Add humanitarian crisis heatmap data and sources
    map.current.on('load', () => {
      if (!map.current) return;

      // Humanitarian crisis data points (current major crises)
      const crisisData = {
        "type": "FeatureCollection" as const,
        "features": [
          // Gaza/Palestine
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [34.4669, 31.5017]}, "properties": {
            "intensity": 100, 
            "id": "gaza-2024",
            "name": "Gaza Strip", 
            "description": "Severe humanitarian crisis with limited access to food, water, and medical supplies.",
            "affected": "2.3 million people in need",
            "image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
          }}
        ]
      };

      // Add source for crisis data
      map.current.addSource('crisis-data', {
        'type': 'geojson',
        'data': crisisData
      });

      // Add heatmap layer (initially hidden)
      map.current.addLayer({
        'id': 'crisis-heatmap',
        'type': 'heatmap',
        'source': 'crisis-data',
        'layout': {
          'visibility': 'none'
        },
        'paint': {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 0,
            100, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            9, 3
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 0, 0)',
            0.2, '#800000',
            0.4, '#cc0000',
            0.6, '#ff0000',
            0.8, '#ff3333',
            1, '#ff6666'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 20,
            9, 50
          ],
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.8,
            9, 0.6
          ]
        }
      });

      // Add crisis points layer (initially hidden)
      map.current.addLayer({
        'id': 'crisis-points',
        'type': 'circle',
        'source': 'crisis-data',
        'layout': {
          'visibility': 'none'
        },
        'paint': {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 3,
            100, 15
          ],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, '#660000',
            50, '#cc0000',
            100, '#ff0000'
          ],
          'circle-opacity': 0.8,
          'circle-stroke-color': '#330000',
          'circle-stroke-width': 1
        }
      });

      // Add click handler for crisis points
      map.current.on('click', 'crisis-points', (e) => {
        // Prevent event from bubbling to the general map click handler
        e.preventDefault();
        
        if (!humanitarianModeRef.current) return;
        if (!e.features || e.features.length === 0) return;
        
        const feature = e.features[0];
        const properties = feature.properties;
        const coordinates = (feature.geometry as any).coordinates;
        
        if (!coordinates || !properties) return;
        
        // Close any existing popups first
        const existingPopups = document.querySelectorAll('.mapboxgl-popup');
        existingPopups.forEach(popup => popup.remove());
        
        // Generate a unique ID for this crisis (or use properties.id if available)
        const crisisId = properties.id || Math.random().toString(36).substr(2, 9);
        
        // Create popup content with close button and clickable title
        const popupContent = `
          <div class="crisis-popup p-4 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600">
            <div class="flex justify-between items-start mb-3">
              <h3 class="font-bold text-lg text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors leading-tight" 
                  onclick="window.location.href='/crisis/${crisisId}'">${properties.name}</h3>
              <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0" 
                      onclick="this.closest('.mapboxgl-popup').remove()"
                      title="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <img src="${properties.image}" 
                 alt="${properties.name}" 
                 class="w-full h-32 object-cover rounded-md mb-3 shadow-sm"
                 onerror="this.style.display='none'" />
            <p class="text-sm text-gray-700 dark:text-gray-200 mb-3 leading-relaxed">${properties.description}</p>
            <div class="text-sm text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-600 pt-3">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 bg-red-500 rounded-full"></span>
                <span class="font-medium">Affected: ${properties.affected}</span>
              </div>
            </div>
          </div>
        `;
        
        // Create and show popup
        const popup = new mapboxgl.Popup({ 
          closeButton: false,
          closeOnClick: false,
          maxWidth: '320px'
        })
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(map.current);
          
        console.log('Crisis popup created for:', properties.name);
      });

      // Prevent map click when clicking on crisis points
      map.current.on('click', (e) => {
        // Check if we clicked on a crisis point
        const features = map.current!.queryRenderedFeatures(e.point, { layers: ['crisis-points'] });
        
        // If we clicked on a crisis point, don't do anything (let the crisis-points handler deal with it)
        if (features.length > 0 && humanitarianModeRef.current) {
          return;
        }
        
        // Only close popups if we clicked on empty space in humanitarian mode
        if (humanitarianModeRef.current) {
          const popups = document.querySelectorAll('.mapboxgl-popup');
          popups.forEach(popup => popup.remove());
        }
      });

      // Change cursor on hover for crisis points
      map.current.on('mouseenter', 'crisis-points', () => {
        if (humanitarianModeRef.current && map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current.on('mouseleave', 'crisis-points', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });
    });
  };

  const toggleHumanitarianMode = () => {
    if (!map.current) return;
    
    const newMode = !humanitarianMode;
    setHumanitarianMode(newMode);
    // Update the ref so click handlers can access current state
    humanitarianModeRef.current = newMode;
    
    if (newMode) {
      // Show crisis layers
      map.current.setLayoutProperty('crisis-heatmap', 'visibility', 'visible');
      map.current.setLayoutProperty('crisis-points', 'visibility', 'visible');
    } else {
      // Hide crisis layers
      map.current.setLayoutProperty('crisis-heatmap', 'visibility', 'none');
      map.current.setLayoutProperty('crisis-points', 'visibility', 'none');
    }
  };

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to San Francisco coordinates as example
          setUserLocation({ lat: 37.7749, lng: -122.4194 });
        }
      );
    } else {
      // Fallback to San Francisco coordinates if geolocation not supported
      setUserLocation({ lat: 37.7749, lng: -122.4194 });
    }
  };

  // Geographic zoom level constants optimized for U.S. contexts
  const ZOOM_LEVELS = {
    neighborhood: { zoom: 16, description: 'Neighborhood' },
    city: { zoom: 12, description: 'City' },
    state: { zoom: 5.5, description: 'State' },
    national: { zoom: 3.2, description: 'National' },
    global: { zoom: 1.2, description: 'Global' }
  };

  // Geographic center coordinates for regions
  const getGeographicCenter = (level: 'neighborhood' | 'city' | 'state' | 'national' | 'global', userLat: number, userLng: number): [number, number] => {
    switch (level) {
      case 'neighborhood':
        // Use user's exact location for neighborhood view
        return [userLng, userLat];
        
      case 'city':
        // Determine city center based on user location
        return getCityCenter(userLat, userLng);
        
      case 'state':
        // Determine state center based on user location
        return getStateCenter(userLat, userLng);
        
      case 'national':
        // Determine country center based on user location
        return getCountryCenter(userLat, userLng);
        
      case 'global':
        // Center on continent based on user location
        return getContinentCenter(userLat, userLng);
        
      default:
        return [userLng, userLat];
    }
  };

  // Get city center coordinates based on user location
  const getCityCenter = (lat: number, lng: number): [number, number] => {
    // Major US cities
    if (lat >= 37.7 && lat <= 37.8 && lng >= -122.5 && lng <= -122.3) return [-122.4194, 37.7749]; // San Francisco
    if (lat >= 34.0 && lat <= 34.1 && lng >= -118.3 && lng <= -118.2) return [-118.2437, 34.0522]; // Los Angeles
    if (lat >= 40.7 && lat <= 40.8 && lng >= -74.0 && lng <= -73.9) return [-73.9857, 40.7484]; // New York
    if (lat >= 41.8 && lat <= 41.9 && lng >= -87.7 && lng <= -87.6) return [-87.6298, 41.8781]; // Chicago
    if (lat >= 29.7 && lat <= 29.8 && lng >= -95.4 && lng <= -95.3) return [-95.3698, 29.7604]; // Houston
    
    // Default: use user location if city not recognized
    return [lng, lat];
  };

  // Get state center coordinates based on user location
  const getStateCenter = (lat: number, lng: number): [number, number] => {
    // US States
    if (lat >= 32.5 && lat <= 42.0 && lng >= -124.5 && lng <= -114.1) return [-119.4179, 36.7783]; // California
    if (lat >= 25.8 && lat <= 31.0 && lng >= -106.6 && lng <= -93.5) return [-99.9018, 31.9686]; // Texas
    if (lat >= 40.5 && lat <= 45.0 && lng >= -79.8 && lng <= -71.8) return [-74.9000, 42.2000]; // New York
    if (lat >= 39.7 && lat <= 42.5 && lng >= -90.6 && lng <= -84.8) return [-89.3985, 40.6331]; // Illinois
    if (lat >= 45.9 && lat <= 49.4 && lng >= -124.8 && lng <= -116.9) return [-120.5542, 47.0379]; // Washington
    
    // Default: use user location if state not recognized
    return [lng, lat];
  };

  // Get country center coordinates based on user location
  const getCountryCenter = (lat: number, lng: number): [number, number] => {
    // North America
    if (lat >= 25 && lat <= 72 && lng >= -168 && lng <= -52) return [-95.7129, 37.0902]; // USA
    if (lat >= 42 && lat <= 83 && lng >= -141 && lng <= -52) return [-106.3468, 56.1304]; // Canada
    if (lat >= 14 && lat <= 33 && lng >= -118 && lng <= -86) return [-102.5528, 23.6345]; // Mexico
    
    // Europe
    if (lat >= 35 && lat <= 71 && lng >= -10 && lng <= 40) return [10.4515, 51.1657]; // Central Europe
    
    // Asia
    if (lat >= -10 && lat <= 81 && lng >= 26 && lng <= 180) return [104.1954, 35.8617]; // Asia
    
    // Default: use user location
    return [lng, lat];
  };

  // Get continent center coordinates based on user location
  const getContinentCenter = (lat: number, lng: number): [number, number] => {
    // North America
    if (lat >= 7 && lat <= 83 && lng >= -168 && lng <= -34) return [-95.7129, 45.0902]; // North America
    
    // South America
    if (lat >= -56 && lat <= 13 && lng >= -82 && lng <= -34) return [-58.3816, -14.2350]; // South America
    
    // Europe
    if (lat >= 35 && lat <= 71 && lng >= -10 && lng <= 40) return [10.4515, 54.5260]; // Europe
    
    // Asia
    if (lat >= -10 && lat <= 81 && lng >= 26 && lng <= 180) return [104.1954, 34.0479]; // Asia
    
    // Africa
    if (lat >= -35 && lat <= 37 && lng >= -18 && lng <= 52) return [20.0000, 0.0000]; // Africa
    
    // Oceania
    if (lat >= -47 && lat <= -10 && lng >= 113 && lng <= 180) return [133.7751, -25.2744]; // Australia/Oceania
    
    // Default: global center
    return [0, 20];
  };

  // Center map on specific coordinates
  const centerOnLocation = (coordinates: [number, number], locationName?: string) => {
    console.log(`centerOnLocation called with coordinates: [${coordinates[0]}, ${coordinates[1]}], locationName: ${locationName}`);
    console.log('map.current:', !!map.current, 'mapReady:', mapReady);
    
    if (!map.current || !mapReady) {
      console.log('Map not ready or not available');
      return;
    }

    console.log('Calling map.flyTo...');
    map.current.flyTo({
      center: coordinates,
      zoom: 10, // City-level zoom for searched locations
      duration: 1500
    });

    if (locationName) {
      console.log(`Centered map on: ${locationName}`);
    }
  };

  // Zoom to different geographic levels with appropriate centering
  const zoomToLevel = (level: 'neighborhood' | 'city' | 'state' | 'national' | 'global') => {
    if (!map.current || !mapReady) return;
    if (level !== 'global' && !userLocation) return;

    const { zoom } = ZOOM_LEVELS[level];
    const center = level === 'global' && !userLocation 
      ? [0, 20] as [number, number]
      : getGeographicCenter(level, userLocation!.lat, userLocation!.lng);

    map.current.flyTo({
      center: center,
      zoom: zoom,
      duration: 1500
    });

    // Notify parent component of region selection
    if (onRegionSelect) {
      onRegionSelect(level);
    }
  };

  const handleTokenSubmit = () => {
    console.log('handleTokenSubmit called with token:', mapboxToken.substring(0, 10) + '...');
    if (mapboxToken.trim()) {
      console.log('Token is valid, hiding token input...');
      // setShowTokenInput(false);
    } else {
      console.log('Token is empty or invalid');
    }
  };

  // Initialize map when token and container are available, or provide fallback
  useEffect(() => {
    if (mapboxToken && mapboxToken.length > 0 && mapContainer.current) {
      console.log('Container is now available, initializing map...');
      initializeMap(mapboxToken);
    } else if (mapContainer.current && onMapReady) {
      // No token available, provide immediate fallback
      console.log('No valid token available, providing fallback controls immediately');
      const fallbackCenterOnLocation = (coordinates: [number, number], locationName?: string) => {
        console.log(`Fallback: Centering on ${locationName || 'location'} at [${coordinates[0]}, ${coordinates[1]}]`);
        setMapReady(true);
        console.log(`Fallback map centering completed for: ${locationName}`);
        setUserLocation({ lat: coordinates[1], lng: coordinates[0] });
      };
      
      onMapReady({ centerOnLocation: fallbackCenterOnLocation });
    }
  }, [mapboxToken, onMapReady]);

  // Get user location on component mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Animate to user location when it becomes available
  useEffect(() => {
    if (userLocation && map.current && mapReady) {
      // Smooth fly animation from global view to user's location
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 12, // City-level zoom
        duration: 2000, // 2 second animation
        essential: true
      });
    }
  }, [userLocation, mapReady]);

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);



  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Geographic Zoom Level Buttons - Top Row */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex gap-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
          <Button
            onClick={() => zoomToLevel('neighborhood')}
            variant="outline"
            size="sm"
            className="text-xs"
            data-testid="button-zoom-neighborhood"
            disabled={!userLocation || !mapReady}
          >
            Neighborhood
          </Button>
          <Button
            onClick={() => zoomToLevel('city')}
            variant="outline"
            size="sm"
            className="text-xs"
            data-testid="button-zoom-city"
            disabled={!userLocation || !mapReady}
          >
            City
          </Button>
          <Button
            onClick={() => zoomToLevel('state')}
            variant="outline"
            size="sm"
            className="text-xs"
            data-testid="button-zoom-state"
            disabled={!userLocation || !mapReady}
          >
            State
          </Button>
          <Button
            onClick={() => zoomToLevel('national')}
            variant="outline"
            size="sm"
            className="text-xs"
            data-testid="button-zoom-national"
            disabled={!userLocation || !mapReady}
          >
            National
          </Button>
          <Button
            onClick={() => zoomToLevel('global')}
            variant="outline"
            size="sm"
            className="text-xs"
            data-testid="button-zoom-global"
            disabled={!mapReady}
          >
            Global
          </Button>
        </div>
      </div>
      
      {/* Humanitarian Mode Toggle */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <Button
          onClick={toggleHumanitarianMode}
          variant={humanitarianMode ? "destructive" : "secondary"}
          className="shadow-lg backdrop-blur-sm bg-background/90 border"
        >
          {humanitarianMode ? "Exit Humanitarian Mode" : "Humanitarian Mode"}
        </Button>
      </div>
    </div>
  );
};

export default MapView;