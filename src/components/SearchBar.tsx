import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, Filter, HelpCircle, Globe, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: any) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onFilterChange }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isLocalMode, setIsLocalMode] = useState(true);

  const quickFilters = [
    { id: 'communities', label: 'Communities', color: 'communities' },
    { id: 'events', label: 'Events', color: 'events' },
  ];

  const communityFilters = [
    'Decentralized Tech', 'Social Groups', 'Volunteer', 'Professional', 'Hobby', 'Support Groups'
  ];

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const toggleFilter = (filterId: string) => {
    // Navigate to dedicated pages for communities and events
    if (filterId === 'communities') {
      navigate('/communities');
      return;
    }
    
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter(f => f !== filterId)
      : [...activeFilters, filterId];
    
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const searchExamples = [
    "Mission District community events",
    "Castro neighborhood groups",
    "Chinatown volunteer opportunities",
    "Professional networking groups"
  ];

  return (
    <div className="absolute top-6 left-6 z-10 w-96 max-w-[calc(100vw-3rem)]">
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border shadow-lg p-4 space-y-4">
        {/* Main Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Sparkles className="absolute right-12 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
          <Input
            placeholder="AI Search: Find communities, events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 pr-16 bg-background/50"
          />
          <Button
            onClick={handleSearch}
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7"
          >
            <Search className="h-3 w-3" />
          </Button>
        </div>

        {/* Local/Global Filter Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center bg-muted/50 rounded-full p-1">
            <button
              onClick={() => setIsLocalMode(false)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                !isLocalMode 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="button-global-mode"
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
              data-testid="button-local-mode"
            >
              <User className="h-3 w-3" />
              Local
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant={activeFilters.includes(filter.id) ? "default" : "secondary"}
              className={`cursor-pointer transition-all ${
                activeFilters.includes(filter.id) 
                  ? filter.color === 'communities' ? 'bg-communities hover:bg-communities/80 text-black' :
                    filter.color === 'events' ? 'bg-events hover:bg-events/80 text-black' :
                    'bg-primary hover:bg-primary/80'
                  : 'hover:bg-muted'
              }`}
              onClick={() => toggleFilter(filter.id)}
            >
              {filter.label}
            </Badge>
          ))}
        </div>

        {/* Help and Advanced Filters */}
        <div className="flex justify-between items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <HelpCircle className="h-4 w-4 mr-1" />
                Search Help
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-3">
                <h4 className="font-semibold">Search Examples:</h4>
                <div className="space-y-1">
                  {searchExamples.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchQuery(example)}
                      className="block w-full text-left text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 p-2 rounded"
                    >
                      "{example}"
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-muted-foreground"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="space-y-3 border-t pt-4">
            <div>
              <h5 className="text-sm font-medium mb-2">Community Types</h5>
              <div className="flex flex-wrap gap-1">
                {communityFilters.map((type) => (
                  <Badge
                    key={type}
                    variant={activeFilters.includes(type) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleFilter(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-communities"></div>
            <span>Communities</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-events"></div>
            <span>Events</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;