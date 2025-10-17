import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Community } from '../../shared/schema';
import { 
  Users, 
  Music, 
  Calendar, 
  MapPin, 
  Star, 
  ExternalLink,
  Play,
  Mail,
  Phone,
  Instagram,
  X,
  Globe,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface ResultsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  searchResults?: any[];
  onCommunityClick?: (community: any) => void;
  selectedRegion?: 'neighborhood' | 'city' | 'state' | 'national' | 'global';
  selectedCommunityLevel?: string | 'all'; // New: level filter
  userLocation?: { lat: number; lng: number } | null; // User's location for proximity sorting
}

const ResultsSidebar: React.FC<ResultsSidebarProps> = ({ 
  isOpen, 
  onClose, 
  searchResults = [],
  onCommunityClick,
  selectedRegion = 'global',
  selectedCommunityLevel = 'all',
  userLocation
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'communities' | 'events'>('all');
  const [isLocalMode, setIsLocalMode] = useState(true);

  // Fetch communities from API
  const { data: communities = [], isLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  // Geographic scope hierarchy
  const scopeHierarchy = ['neighborhood', 'city', 'state', 'national', 'global'];
  const selectedScopeIndex = scopeHierarchy.indexOf(selectedRegion);

  // Haversine distance calculation (in kilometers)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Extract location from community name (needs to be before getUserGeographicContext)
  const getLocationFromName = (name: string) => {
    const dashMatch = name.match(/\s-\s([^-]+)$/);
    if (dashMatch) return dashMatch[1];
    
    const parenMatch = name.match(/\(([^)]+)\)$/);
    if (parenMatch) return parenMatch[1];
    
    return null;
  };

  // Determine user's geographic context based on closest communities
  const getUserGeographicContext = () => {
    if (!userLocation) return { city: null, state: null, country: 'USA' };
    
    // Find closest city, state communities
    const cityCommunities = communities.filter(c => c.maxGeographicScope === 'city' && c.coordinates);
    const stateCommunities = communities.filter(c => c.maxGeographicScope === 'state' && c.coordinates);
    
    let closestCity = null;
    let minCityDist = Infinity;
    
    cityCommunities.forEach(c => {
      if (c.coordinates) {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, c.coordinates.lat, c.coordinates.lng);
        if (dist < minCityDist) {
          minCityDist = dist;
          closestCity = getLocationFromName(c.name);
        }
      }
    });
    
    let closestState = null;
    let minStateDist = Infinity;
    
    stateCommunities.forEach(c => {
      if (c.coordinates) {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, c.coordinates.lat, c.coordinates.lng);
        if (dist < minStateDist) {
          minStateDist = dist;
          closestState = getLocationFromName(c.name);
        }
      }
    });
    
    return { city: closestCity, state: closestState, country: 'USA' };
  };

  const geoContext = getUserGeographicContext();

  // Get current location context based on selected level
  const getCurrentLocationContext = () => {
    if (selectedCommunityLevel === 'all') return 'All Locations';
    
    switch (selectedCommunityLevel) {
      case 'neighborhood':
        return geoContext.city || 'Local Area';
      case 'city':
        return geoContext.city || 'Your City';
      case 'state':
        return geoContext.state || 'Your State';
      case 'national':
        return geoContext.country;
      case 'global':
        return 'Global';
      default:
        return 'All Locations';
    }
  };

  const locationContext = getCurrentLocationContext();

  // Filter communities based on:
  // 1. Selected community level (exact match, not hierarchy)
  // 2. Geographic proximity (only show communities in user's location at that level)
  const filteredCommunities = (Array.isArray(communities) ? communities : [])
    .filter(community => {
      // If 'all', show everything
      if (selectedCommunityLevel === 'all') return true;

      // Must match the selected level EXACTLY
      if (community.maxGeographicScope !== selectedCommunityLevel) return false;

      // For global, show all global communities
      if (selectedCommunityLevel === 'global') return true;

      // If no user location, show all communities of this level (sorted by popularity)
      if (!userLocation) return true;

      // For other levels, filter by proximity to user location if coordinates exist
      if (!community.coordinates) return true; // Show communities without coordinates

      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        community.coordinates.lat,
        community.coordinates.lng
      );

      // Distance thresholds by level (in km)
      const thresholds = {
        neighborhood: 5,    // Within 5km
        city: 50,           // Within 50km (same city/metro area)
        state: 500,         // Within 500km (same state/region)
        national: 10000,    // Within country
      };

      return distance <= (thresholds[selectedCommunityLevel as keyof typeof thresholds] || Infinity);
    })
    .map(community => {
      // Calculate distance if user location and community coordinates are available
      const distance = (userLocation && community.coordinates)
        ? calculateDistance(
            userLocation.lat,
            userLocation.lng,
            community.coordinates.lat,
            community.coordinates.lng
          )
        : Infinity;
      return { ...community, distance };
    })
    .sort((a, b) => {
      // Sort by proximity first (if user location is available)
      if (userLocation) {
        const distanceDiff = a.distance - b.distance;
        if (distanceDiff !== 0) return distanceDiff;
      }
      // Then by member count (most popular first)
      return (b.memberCount || 0) - (a.memberCount || 0);
    });

  // Get level display with location context
  const getLevelDisplay = (community: any) => {
    const location = getLocationFromName(community.name);
    const level = community.maxGeographicScope;
    
    if (!location) return level.charAt(0).toUpperCase() + level.slice(1);
    
    switch (level) {
      case 'neighborhood':
        return location;
      case 'city':
        return location;
      case 'state':
        return location.includes('California') || location.includes('Texas') 
          ? location.split(',')[0].trim() 
          : `${location} (State)`;
      case 'national':
        return 'National (USA)';
      case 'global':
        return 'Global';
      default:
        return level.charAt(0).toUpperCase() + level.slice(1);
    }
  };

  // Convert to results format
  const communityResults = filteredCommunities.map(community => ({
    id: community.id,
    type: 'community',
    name: community.name,
    type_detail: 'Topic Group',
    location: getLevelDisplay(community),
    category: community.category,
    members: community.memberCount,
    image: '/api/placeholder/80/80',
    meetingTime: '',
    verified: true,
    description: community.description,
    maxGeographicScope: community.maxGeographicScope,
    distance: (community as any).distance
  }));

  // Mock event data (keep for now)
  const mockEvents = [
    {
      id: '3',
      type: 'event',
      name: 'Chinatown Night Market',
      venue: 'Grant Avenue',
      location: 'Chinatown, San Francisco',
      date: '2024-08-15',
      time: '6:00 PM - 11:00 PM',
      price: 'Free',
      image: '/api/placeholder/80/80',
      organizer: 'Chinatown Community Development Center',
      categories: ['Food', 'Culture', 'Shopping']
    },
    {
      id: '6',
      type: 'event',
      name: 'Golden Gate Park Volunteer Day',
      venue: 'Golden Gate Park',
      location: 'Golden Gate Park, San Francisco',
      date: '2024-08-20',
      time: '9:00 AM - 2:00 PM',
      price: 'Free',
      image: '/api/placeholder/80/80',
      organizer: 'SF Parks Alliance',
      categories: ['Volunteer', 'Environment', 'Community']
    }
  ];

  // Combine communities and events
  const dataToUse = [...communityResults, ...mockEvents];
  
  const filteredResults = activeTab === 'all' 
    ? dataToUse 
    : dataToUse.filter(result => 
        activeTab === 'communities' ? result.type === 'community' :
        activeTab === 'events' ? result.type === 'event' : true
      );

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-96 max-w-[calc(100vw-2rem)] bg-card/95 backdrop-blur-sm border-l shadow-xl z-20 overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Topics</h2>
                <Button variant="ghost" size="sm" onClick={onClose} className="ml-auto">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {selectedCommunityLevel !== 'all' && locationContext && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    variant="default" 
                    className="text-xs font-medium"
                    style={{
                      backgroundColor: 
                        selectedCommunityLevel === 'neighborhood' ? '#10b981' :
                        selectedCommunityLevel === 'city' ? '#3b82f6' :
                        selectedCommunityLevel === 'state' ? '#a855f7' :
                        selectedCommunityLevel === 'national' ? '#f97316' :
                        selectedCommunityLevel === 'global' ? '#ef4444' : undefined,
                      color: 'white'
                    }}
                  >
                    {selectedCommunityLevel === 'neighborhood' && '🟢'}
                    {selectedCommunityLevel === 'city' && '🔵'}
                    {selectedCommunityLevel === 'state' && '🟣'}
                    {selectedCommunityLevel === 'national' && '🟠'}
                    {selectedCommunityLevel === 'global' && '🔴'}
                    {' '}{locationContext}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {selectedCommunityLevel.charAt(0).toUpperCase() + selectedCommunityLevel.slice(1)} level
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Local/Global Filter Toggle */}
          {/* <div className="flex items-center justify-center mb-3">
            <div className="flex items-center bg-muted/50 rounded-full p-1">
              <button
                onClick={() => setIsLocalMode(false)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  !isLocalMode 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="button-global-mode-sidebar"
              >
                <Globe className="h-3 w-3" />
                Global
              </button>
              <button
                onClick={() => setIsLocalMode(true)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  isLocalMode 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="button-local-mode-sidebar"
              >
                <User className="h-3 w-3" />
                Local
              </button>
            </div>
          </div> */}

          {/* Tab Navigation */}
          <div className="flex gap-1">
            {[
              { id: 'all', label: 'All', count: dataToUse.length },
              { id: 'communities', label: 'Topics', count: dataToUse.filter(r => r.type === 'community').length },
              { id: 'events', label: 'Events', count: dataToUse.filter(r => r.type === 'event').length }
            ].map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-1 text-xs"
              >
                {tab.label}
                <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                  {tab.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredResults.map((result) => (
            <Card key={result.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">

                {result.type === 'community' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={result.image} />
                        <AvatarFallback className="bg-communities/20 text-communities">
                          <Users className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{result.name}</h3>
                        <p className="text-sm font-medium text-communities">{result.type_detail}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {result.location}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="h-3 w-3" />
                          {result.members ? result.members.toLocaleString() + ' members' : 'Topic Group'}
                        </div>
                        {result.meetingTime && (
                          <p className="text-xs text-muted-foreground">Meets: {result.meetingTime}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      <Badge 
                        variant="default" 
                        className="text-xs"
                        style={{
                          backgroundColor: 
                            result.maxGeographicScope === 'neighborhood' ? '#10b981' :
                            result.maxGeographicScope === 'city' ? '#3b82f6' :
                            result.maxGeographicScope === 'state' ? '#a855f7' :
                            result.maxGeographicScope === 'national' ? '#f97316' :
                            result.maxGeographicScope === 'global' ? '#ef4444' : undefined,
                          color: 'white'
                        }}
                      >
                        {result.maxGeographicScope === 'neighborhood' && '🟢 '}
                        {result.maxGeographicScope === 'city' && '🔵 '}
                        {result.maxGeographicScope === 'state' && '🟣 '}
                        {result.maxGeographicScope === 'national' && '🟠 '}
                        {result.maxGeographicScope === 'global' && '🔴 '}
                        {result.maxGeographicScope.charAt(0).toUpperCase() + result.maxGeographicScope.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {result.category}
                      </Badge>
                      {result.distance && result.distance !== Infinity && (
                        <Badge variant="secondary" className="text-xs">
                          📍 {result.distance < 1 ? '<1' : Math.round(result.distance)} km
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{result.description}</p>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          const params = new URLSearchParams({
                            id: result.id,
                            name: result.name,
                            type: result.type_detail,
                            location: result.location,
                            category: result.category,
                            members: result.members?.toString() || '0',
                            description: result.description || ''
                          });
                          navigate(`/community-chat?${params.toString()}`);
                        }}
                        data-testid={`button-join-community-${result.id}`}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Join Topic
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {result.type === 'event' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 rounded-lg">
                        <AvatarImage src={result.image} />
                        <AvatarFallback className="bg-events/20 text-events rounded-lg">
                          <Calendar className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{result.name}</h3>
                        <p className="text-sm text-muted-foreground">{result.venue}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {result.location}
                        </div>
                        <div className="text-sm">
                          {result.date ? new Date(result.date).toLocaleDateString() : 'TBA'} • {result.time || 'TBA'}
                        </div>
                        <div className="text-sm font-medium text-events">{result.price || 'See event details'}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {(result.categories || ['Community Event']).map((g: string) => (
                        <Badge key={g} variant="outline" className="text-xs">
                          {g}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Get Tickets
                      </Button>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultsSidebar;