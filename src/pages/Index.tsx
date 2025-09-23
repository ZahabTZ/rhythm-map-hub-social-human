import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MapView from '@/components/MapView';
import SearchBar from '@/components/SearchBar';
import ResultsSidebar from '@/components/ResultsSidebar';
import CommunityChat from '@/components/CommunityChat';
import { ModerationStatus } from '@/components/ModerationStatus';

const Index = () => {
  const navigate = useNavigate();
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
