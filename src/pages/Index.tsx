import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MapView from '@/components/MapView';
import SearchBar from '@/components/SearchBar';
import ResultsSidebar from '@/components/ResultsSidebar';
import CommunityChat from '@/components/CommunityChat';
import { ModerationStatus } from '@/components/ModerationStatus';
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
import { User, LogOut, Users, Plus, Crown } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, googleUser, signIn, signOut, loading, isVerifiedHost } = useAuth();
  const [searchResults, setSearchResults] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

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
    <div className="relative h-screen overflow-hidden bg-background">
      {/* Full-screen Map */}
      <MapView onLocationSelect={handleLocationSelect} />
      
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
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/communities')} data-testid="menu-communities">
                  <Users className="h-4 w-4 mr-2" />
                  View Communities
                </DropdownMenuItem>
                {isVerifiedHost ? (
                  <DropdownMenuItem onClick={() => navigate('/create-community')} data-testid="menu-create-community">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Community
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => navigate('/become-host')} data-testid="menu-become-host">
                    <Crown className="h-4 w-4 mr-2" />
                    Become Verified Host ($50/year)
                  </DropdownMenuItem>
                )}
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
      
      {/* Search Bar */}
      <SearchBar 
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />
      
      {/* Results Sidebar */}
      <ResultsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        searchResults={searchResults}
        onCommunityClick={handleCommunityClick}
      />
      
      {/* Community Chat */}
      {chatOpen && selectedCommunity && (
        <CommunityChat
          community={selectedCommunity}
          onClose={handleChatClose}
        />
      )}

      {/* Moderation Status - Shows when stories need review */}
      <ModerationStatus />
    </div>
  );
};

export default Index;
