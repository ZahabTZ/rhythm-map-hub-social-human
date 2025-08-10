import React, { useState } from 'react';
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
  X
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
}

const ResultsSidebar: React.FC<ResultsSidebarProps> = ({ 
  isOpen, 
  onClose, 
  searchResults = [],
  onCommunityClick
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'news' | 'communities' | 'events'>('all');

  // Mock data for demonstration
  const mockResults = [
    {
      id: '1',
      type: 'news',
      title: 'New BART Extension Opens in Mission Bay',
      source: 'SF Chronicle',
      location: 'Mission Bay, San Francisco',
      category: 'Transportation',
      publishedAt: '2024-08-10T09:00:00Z',
      image: '/api/placeholder/80/80',
      author: 'Maria Garcia',
      verified: true,
      description: 'The long-awaited BART extension to Mission Bay officially opens today, connecting the neighborhood to downtown.'
    },
    {
      id: '2',
      type: 'community',
      name: 'Castro Neighborhood Association',
      type_detail: 'Community Group',
      location: 'Castro District, San Francisco',
      category: 'Neighborhood',
      members: 2847,
      image: '/api/placeholder/80/80',
      meetingTime: 'First Tuesday of each month',
      verified: true,
      description: 'Dedicated to preserving the character and community spirit of the Castro District'
    },
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
      id: '4',
      type: 'news',
      title: 'Golden Gate Park Restores Native Plant Garden',
      source: 'Hoodline',
      location: 'Golden Gate Park, San Francisco',
      category: 'Environment',
      publishedAt: '2024-08-09T14:30:00Z',
      image: '/api/placeholder/80/80',
      author: 'James Chen',
      verified: false,
      description: 'A new native plant restoration project aims to bring back indigenous species to the western section of the park.'
    },
    {
      id: '5',
      type: 'community',
      name: 'Mission District Food Co-op',
      type_detail: 'Cooperative',
      location: 'Mission District, San Francisco',
      category: 'Food & Agriculture',
      members: 156,
      image: '/api/placeholder/80/80',
      meetingTime: 'Saturdays 10am-2pm',
      verified: true,
      description: 'Community-owned grocery cooperative focusing on locally sourced and organic foods'
    }
  ];

  // Use searchResults if available, otherwise fall back to mockResults
  const dataToUse = searchResults.length > 0 ? searchResults : mockResults;
  
  const filteredResults = activeTab === 'all' 
    ? dataToUse 
    : dataToUse.filter(result => 
        activeTab === 'news' ? result.type === 'news' :
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
            <h2 className="text-lg font-semibold">Search Results</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-1">
            {[
              { id: 'all', label: 'All', count: dataToUse.length },
              { id: 'news', label: 'News', count: dataToUse.filter(r => r.type === 'news').length },
              { id: 'communities', label: 'Communities', count: dataToUse.filter(r => r.type === 'community').length },
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
                {result.type === 'news' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={result.image} />
                        <AvatarFallback className="bg-news/20 text-news">
                          📰
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{result.title}</h3>
                          {result.verified && (
                            <Badge variant="secondary" className="bg-news/20 text-news text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-news">{result.source}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {result.location}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(result.publishedAt).toLocaleDateString()} • By {result.author}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {result.category}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{result.description}</p>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Read Full Article
                      </Button>
                    </div>
                  </div>
                )}

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
                          {result.members ? result.members.toLocaleString() + ' members' : 'Community Group'}
                        </div>
                        {result.meetingTime && (
                          <p className="text-xs text-muted-foreground">Meets: {result.meetingTime}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {result.category}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{result.description}</p>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => onCommunityClick?.(result)}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Join Community
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