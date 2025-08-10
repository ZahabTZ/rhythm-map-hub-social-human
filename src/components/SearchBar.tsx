import React, { useState } from 'react';
import { Search, Sparkles, Filter, HelpCircle } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const quickFilters = [
    { id: 'musicians', label: 'Musicians', color: 'musician' },
    { id: 'business', label: 'Music Business', color: 'business' },
    { id: 'concerts', label: 'Concerts', color: 'concert' },
  ];

  const genreFilters = [
    'Hip Hop', 'Electronic', 'Rock', 'Jazz', 'Classical', 'Latin', 'R&B', 'Country'
  ];

  const businessFilters = [
    'Producer', 'Sound Engineer', 'Mixer', 'Photographer', 'Videographer', 'Manager'
  ];

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const toggleFilter = (filterId: string) => {
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter(f => f !== filterId)
      : [...activeFilters, filterId];
    
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const searchExamples = [
    "Bay Area salsa musicians",
    "Jazz producers in New York",
    "Electronic concerts this weekend",
    "Latin music network in Miami"
  ];

  return (
    <div className="absolute top-6 left-6 z-10 w-96 max-w-[calc(100vw-3rem)]">
      <div className="bg-card/95 backdrop-blur-sm rounded-lg border shadow-lg p-4 space-y-4">
        {/* Main Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Sparkles className="absolute right-12 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
          <Input
            placeholder="AI Search: Find musicians, venues, networking..."
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

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant={activeFilters.includes(filter.id) ? "default" : "secondary"}
              className={`cursor-pointer transition-all ${
                activeFilters.includes(filter.id) 
                  ? filter.color === 'musician' ? 'bg-musician hover:bg-musician/80' :
                    filter.color === 'business' ? 'bg-business hover:bg-business/80 text-black' :
                    filter.color === 'concert' ? 'bg-concert hover:bg-concert/80 text-black' :
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
              <h5 className="text-sm font-medium mb-2">Genres</h5>
              <div className="flex flex-wrap gap-1">
                {genreFilters.map((genre) => (
                  <Badge
                    key={genre}
                    variant={activeFilters.includes(genre) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleFilter(genre)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium mb-2">Business Categories</h5>
              <div className="flex flex-wrap gap-1">
                {businessFilters.map((category) => (
                  <Badge
                    key={category}
                    variant={activeFilters.includes(category) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleFilter(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-musician"></div>
            <span>Musicians</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-business"></div>
            <span>Business</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-concert"></div>
            <span>Events</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;