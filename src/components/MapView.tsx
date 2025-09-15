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
  const [mapboxToken, setMapboxToken] = useState<string | undefined>(
    import.meta.env.VITE_MAPBOX_TOKEN
  )
  // const [showTokenInput, setShowTokenInput] = useState(true);
  const [humanitarianMode, setHumanitarianMode] = useState(false);
  const humanitarianModeRef = useRef(false);
  
  // Update ref whenever state changes
  useEffect(() => {
    humanitarianModeRef.current = humanitarianMode;
  }, [humanitarianMode]);

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
  
  console.log('MapView state:', {  tokenLength: mapboxToken.length });

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

    // Add click handler for geographical areas (only when not in humanitarian mode)
    map.current.on('click', async (e) => {
      if (!onLocationSelect || humanitarianModeRef.current) return;
      
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
          // Ukraine conflict
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [31.1656, 48.3794]}, "properties": {
            "intensity": 100, 
            "name": "Ukraine - Kherson Region", 
            "description": "Ongoing conflict with severe humanitarian impact. Over 6 million people displaced internally.",
            "affected": "14.6 million people in need",
            "image": "https://images.unsplash.com/photo-1645731291221-1ac90ac0476e?w=400&h=300&fit=crop"
          }},
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [36.2527, 49.9935]}, "properties": {
            "intensity": 95, 
            "name": "Ukraine - Kharkiv Region", 
            "description": "Heavy bombardment affecting civilian infrastructure and forcing mass displacement.",
            "affected": "3.2 million people in need",
            "image": "https://images.unsplash.com/photo-1648737967328-690b8204f6bb?w=400&h=300&fit=crop"
          }},
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [30.5234, 50.4501]}, "properties": {
            "intensity": 90, 
            "name": "Ukraine - Kyiv Region", 
            "description": "Capital region under siege with critical infrastructure damage affecting millions.",
            "affected": "2.8 million people in need",
            "image": "https://images.unsplash.com/photo-1648738267661-9b6dc1a5743d?w=400&h=300&fit=crop"
          }},
          
          // Gaza/Palestine
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [34.4669, 31.5017]}, "properties": {
            "intensity": 100, 
            "name": "Gaza Strip", 
            "description": "Severe humanitarian crisis with limited access to food, water, and medical supplies.",
            "affected": "2.3 million people in need",
            "image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
          }},
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [35.2137, 31.7683]}, "properties": {
            "intensity": 85, 
            "name": "West Bank", 
            "description": "Ongoing displacement and restricted movement affecting daily life and livelihoods.",
            "affected": "3.1 million people in need",
            "image": "https://images.unsplash.com/photo-1544966503-7cc535ceea3e?w=400&h=300&fit=crop"
          }},
          
          // Sudan
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [32.5599, 15.5007]}, "properties": {
            "intensity": 95, 
            "name": "Sudan - Khartoum", 
            "description": "Armed conflict causing mass displacement and breakdown of essential services.",
            "affected": "25 million people in need",
            "image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
          }},
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [30.2176, 12.8628]}, "properties": {
            "intensity": 80, 
            "name": "Sudan - Darfur", 
            "description": "Renewed violence affecting vulnerable populations with limited humanitarian access.",
            "affected": "2.5 million people in need",
            "image": "https://images.unsplash.com/photo-1568454537842-d933259bb258?w=400&h=300&fit=crop"
          }},
          
          // Afghanistan
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [69.2075, 34.5553]}, "properties": {
            "intensity": 85, 
            "name": "Afghanistan - Kabul", 
            "description": "Economic collapse and drought affecting millions, with severe food insecurity.",
            "affected": "28.8 million people in need",
            "image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
          }},
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [67.7100, 33.7680]}, "properties": {
            "intensity": 75, 
            "name": "Afghanistan - Kandahar", 
            "description": "Severe drought and economic hardship creating widespread malnutrition.",
            "affected": "4.2 million people in need",
            "image": "https://images.unsplash.com/photo-1568454537842-d933259bb258?w=400&h=300&fit=crop"
          }},
          
          // Myanmar
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [95.9560, 21.9162]}, "properties": {
            "intensity": 80, 
            "name": "Myanmar - Mandalay", 
            "description": "Political crisis and armed conflict displacing communities and disrupting services.",
            "affected": "17.6 million people in need",
            "image": "https://images.unsplash.com/photo-1544966503-7cc535ceea3e?w=400&h=300&fit=crop"
          }},
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [96.1951, 16.8661]}, "properties": {
            "intensity": 70, 
            "name": "Myanmar - Yangon", 
            "description": "Ongoing instability affecting access to basic services and livelihoods.",
            "affected": "8.1 million people in need",
            "image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
          }},
          
          // Yemen
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [44.2075, 15.3694]}, "properties": {
            "intensity": 90, 
            "name": "Yemen - Sana'a", 
            "description": "Protracted conflict creating one of the world's worst humanitarian crises.",
            "affected": "21.6 million people in need",
            "image": "https://images.unsplash.com/photo-1568454537842-d933259bb258?w=400&h=300&fit=crop"
          }},
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [48.5164, 14.5995]}, "properties": {
            "intensity": 75, 
            "name": "Yemen - Aden", 
            "description": "Severe food insecurity and cholera outbreaks affecting vulnerable populations.",
            "affected": "4.3 million people in need",
            "image": "https://images.unsplash.com/photo-1544966503-7cc535ceea3e?w=400&h=300&fit=crop"
          }},
          
          // Ethiopia (Tigray)
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [39.4851, 14.1251]}, "properties": {
            "intensity": 75, 
            "name": "Ethiopia - Tigray", 
            "description": "Post-conflict recovery with ongoing humanitarian needs and limited access.",
            "affected": "4.5 million people in need",
            "image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
          }},
          
          // Somalia
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [45.3182, 2.0469]}, "properties": {
            "intensity": 70, 
            "name": "Somalia - Mogadishu", 
            "description": "Severe drought and conflict creating acute food insecurity and displacement.",
            "affected": "7.1 million people in need",
            "image": "https://images.unsplash.com/photo-1568454537842-d933259bb258?w=400&h=300&fit=crop"
          }},
          
          // Haiti
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [-72.2852, 18.9712]}, "properties": {
            "intensity": 75, 
            "name": "Haiti - Port-au-Prince", 
            "description": "Gang violence and political instability affecting access to basic services.",
            "affected": "5.2 million people in need",
            "image": "https://images.unsplash.com/photo-1544966503-7cc535ceea3e?w=400&h=300&fit=crop"
          }},
          
          // Syria
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [38.9637, 35.9375]}, "properties": {
            "intensity": 80, 
            "name": "Syria - Aleppo", 
            "description": "Ongoing conflict aftermath with massive infrastructure damage and displacement.",
            "affected": "15.3 million people in need",
            "image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop"
          }},
          {"type": "Feature" as const, "geometry": {"type": "Point" as const, "coordinates": [36.2765, 33.5138]}, "properties": {
            "intensity": 70, 
            "name": "Syria - Damascus", 
            "description": "Protracted displacement and economic hardship affecting millions of civilians.",
            "affected": "6.8 million people in need",
            "image": "https://images.unsplash.com/photo-1568454537842-d933259bb258?w=400&h=300&fit=crop"
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

  const handleTokenSubmit = () => {
    console.log('handleTokenSubmit called with token:', mapboxToken.substring(0, 10) + '...');
    if (mapboxToken.trim()) {
      console.log('Token is valid, hiding token input...');
      // setShowTokenInput(false);
    } else {
      console.log('Token is empty or invalid');
    }
  };

  // Initialize map when token input is hidden and container is available
  useEffect(() => {
    // if (!showTokenInput && mapboxToken && mapContainer.current) {
    // if ( mapboxToken && mapContainer.current) {
    //   console.log('Container is now available, initializing map...');
      initializeMap(mapboxToken);
    // }
  }, [ ]);

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);



  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      
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