import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MapView from '@/components/MapView';
import SearchBar from '@/components/SearchBar';
import LocationSearchCard from '@/components/LocationSearchCard';
import ResultsSidebar from '@/components/ResultsSidebar';
import CommunityChat from '@/components/CommunityChat';
import SupportCard from '@/components/SupportCard';
import CrisesSidebar from '@/components/CrisesSidebar';
import { ModerationStatus } from '@/components/ModerationStatus';
import { SocialProfiles } from '@/components/SocialProfiles';
import { DevToolbar } from '@/components/DevToolbar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Users, Plus, Crown, X } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, googleUser, signIn, signOut, loading, isVerifiedHost } = useAuth();
  const [searchResults, setSearchResults] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [titleCardVisible, setTitleCardVisible] = useState(true);
  const [supportCardVisible, setSupportCardVisible] = useState(true);
  const [crisesSidebarOpen, setCrisesSidebarOpen] = useState(false);
  const [mapViewRef, setMapViewRef] = useState<any>(null);
  const [selectedRegion, setSelectedRegion] = useState<'neighborhood' | 'city' | 'state' | 'national' | 'global'>('global');
  const [devLocation, setDevLocation] = useState<{lat: number, lng: number, name: string} | null>(null);

  const handleSearch = (query: string) => {
    // TODO: Implement actual search logic
    console.log('Searching for:', query);
    setSidebarOpen(true);
  };

  const handleFilterChange = (filters: any) => {
    // TODO: Implement filter logic
    console.log('Filters changed:', filters);
  };

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
    if (location.regionData) {
      setSearchResults(location.regionData);
    }
    setSidebarOpen(true);
  };

  const handleCommunityClick = (community: any) => {
    setSelectedCommunity(community);
    setChatOpen(true);
    setSidebarOpen(false);
  };

  const handleChatClose = () => {
    setChatOpen(false);
    setSelectedCommunity(null);
  };

  const dismissTitleCard = () => {
    setTitleCardVisible(false);
  };

  const handleContainerClick = () => {
    if (titleCardVisible) {
      dismissTitleCard();
    }
  };

  const handleHumanitarianClick = () => {
    setCrisesSidebarOpen(true);
  };

  const handleLocationFound = (coordinates: [number, number], locationName: string) => {
    console.log('handleLocationFound called with:', coordinates, locationName);
    console.log('mapViewRef:', mapViewRef);
    
    // Center the map on the found location
    if (mapViewRef && mapViewRef.centerOnLocation) {
      console.log('Calling centerOnLocation...');
      mapViewRef.centerOnLocation(coordinates, locationName);
    } else {
      console.log('mapViewRef or centerOnLocation not available');
    }
  };

  const handleRegionSelect = (region: 'neighborhood' | 'city' | 'state' | 'national' | 'global') => {
    setSelectedRegion(region);
    setSidebarOpen(true);
  };

  const handleDevLocationChange = (lat: number, lng: number, name: string) => {
    console.log('Dev location set:', { lat, lng, name });
    setDevLocation({ lat, lng, name });
    
    // Center map on the new location
    if (mapViewRef && mapViewRef.centerOnLocation) {
      mapViewRef.centerOnLocation([lng, lat], name);
    }
  };

  const handleUseRealLocation = () => {
    // Clear dev location override to use real geolocation
    setDevLocation(null);
  };

  // Admin access: Ctrl+Shift+M to access moderation dashboard
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'M') {
        navigate('/moderation');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="relative h-screen overflow-hidden bg-background" onClick={handleContainerClick}>
      {/* Full-screen Map */}
      <MapView 
        onLocationSelect={handleLocationSelect}
        onHumanitarianClick={handleHumanitarianClick}
        onMapReady={setMapViewRef}
        onRegionSelect={handleRegionSelect}
        devLocation={devLocation}
      />
      
      {/* Authentication & User Status Bar */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        {loading ? (
          <div className="bg-card/95 backdrop-blur-sm rounded-lg border shadow-lg p-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : !googleUser ? (
          <div className="bg-card/95 backdrop-blur-sm rounded-lg border shadow-lg p-4">
            <div className="text-center">
              <h3 className="text-sm font-medium mb-2">Crisis Response Platform</h3>
              <p className="text-xs text-muted-foreground mb-3">Sign in to access communities and submit stories</p>
              <Button onClick={signIn} className="w-full" data-testid="button-sign-in">
                <User className="h-4 w-4 mr-2" />
                Sign in with Google
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-card/95 backdrop-blur-sm rounded-lg border shadow-lg p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 p-2" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={googleUser.picture} alt={googleUser.name} />
                    <AvatarFallback>{googleUser.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium">{googleUser.name}</p>
                    <div className="flex items-center gap-1">
                      {isVerifiedHost ? (
                        <Badge variant="secondary" className="text-xs bg-yellow-900 text-yellow-400" data-testid="badge-verified-host">
                          <Crown className="h-3 w-3 mr-1" />
                          Verified Host
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Regular User</span>
                      )}
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-3">
                  {user && <SocialProfiles user={user} />}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/communities')} data-testid="menu-communities">
                  <Users className="h-4 w-4 mr-2" />
                  View Communities
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/create-community')} data-testid="menu-create-community">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Community
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} data-testid="menu-sign-out">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      {/* Main Title Banner */}
      {titleCardVisible && (
        <div className="absolute top-4 left-60 transform -translate-x-1/2 z-30 text-center">
          <div 
            className="bg-background/90 backdrop-blur-sm rounded-lg border shadow-2xl p-8 max-w-md mx-auto relative" 
            onClick={(e) => e.stopPropagation()}
            data-testid="title-banner"
          >
            <button
              onClick={dismissTitleCard}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Dismiss banner"
              data-testid="button-dismiss-title"
            >
              <X className="h-4 w-4" />
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
           Get Involved in Real Conversations</h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-2">
                A social platform for meaningful local and global connection.
              </p>
              <p className="text-base md:text-lg text-primary font-medium">
                Organize around causes, share stories, and build real-world impact — not just engagement.
           
            </p>
          </div>
        </div>
      )}
      
      {/* Search Bar */}
      <SearchBar 
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />
      
      {/* Location Search Card - positioned below SearchBar */}
      <div className="absolute top-52 left-6 z-20 w-96 max-w-[calc(100vw-3rem)]">
        <LocationSearchCard onLocationFound={handleLocationFound} />
      </div>
      
      {/* Results Sidebar */}
      <ResultsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        searchResults={searchResults}
        onCommunityClick={handleCommunityClick}
        selectedRegion={selectedRegion}
      />
      
      {/* Crises Sidebar */}
      <CrisesSidebar
        isOpen={crisesSidebarOpen}
        onClose={() => setCrisesSidebarOpen(false)}
      />
      
      {/* Community Chat */}
      {chatOpen && selectedCommunity && (
        <CommunityChat
          communityId={selectedCommunity.id || 'unknown'}
          communityName={selectedCommunity.name || 'Unknown Community'}
          currentUserId="user-1"
          currentUserName="Demo User"
          onClose={handleChatClose}
        />
      )}

      {/* Support Card - Bottom Left */}
      {supportCardVisible && (
        <div className="absolute bottom-6 left-6 z-10">
          <SupportCard onClose={() => setSupportCardVisible(false)} />
        </div>
      )}

      {/* Moderation Status - Shows when stories need review */}
      <ModerationStatus />

      {/* Dev Toolbar - Development Mode Only */}
      <DevToolbar 
        onLocationChange={handleDevLocationChange}
        onUseRealLocation={handleUseRealLocation}
      />
    </div>
  );
};

export default Index;
