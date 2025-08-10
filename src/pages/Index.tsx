import React, { useState } from 'react';
import MapView from '@/components/MapView';
import SearchBar from '@/components/SearchBar';
import ResultsSidebar from '@/components/ResultsSidebar';

const Index = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

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
      />
    </div>
  );
};

export default Index;
