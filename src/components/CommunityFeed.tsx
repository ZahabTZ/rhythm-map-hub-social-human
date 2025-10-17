import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Heart, 
  MessageCircle, 
  Share, 
  Filter,
  Globe,
  Building,
  Home,
  Navigation
} from 'lucide-react';

interface Post {
  id: string;
  type: 'post' | 'event';
  author: string;
  authorAvatar: string;
  community: string;
  communityType: 'local' | 'online';
  content: string;
  timestamp: string;
  location?: string;
  eventDate?: string;
  region: 'neighborhood' | 'city' | 'state' | 'national' | 'global';
  likes: number;
  comments: number;
  tags: string[];
}

interface CommunityFeedProps {
  posts: Post[];
  onOpenDM?: (userId: string) => void;
  onJoinEvent?: (eventId: string) => void;
}

const CommunityFeed: React.FC<CommunityFeedProps> = ({ posts, onOpenDM, onJoinEvent }) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  // Sample data for demonstration
  const samplePosts: Post[] = [
    {
      id: '1',
      type: 'event',
      author: 'Sarah Chen',
      authorAvatar: '/api/placeholder/40/40',
      community: 'Climate Action SF',
      communityType: 'local',
      content: 'Join us for a community tree planting event this Saturday! We\'ll be working to restore the urban canopy in Mission Dolores Park.',
      timestamp: '2024-09-25T10:00:00Z',
      location: 'Mission Dolores Park, San Francisco',
      eventDate: '2024-09-28T09:00:00Z',
      region: 'neighborhood',
      likes: 24,
      comments: 8,
      tags: ['environment', 'volunteer', 'local-action']
    },
    {
      id: '2',
      type: 'post',
      author: 'Alex Rivera',
      authorAvatar: '/api/placeholder/40/40',
      community: 'Global Tech Workers',
      communityType: 'online',
      content: 'Amazing news! Our remote work advocacy efforts led to new legislation supporting digital nomad visas. This affects tech workers globally.',
      timestamp: '2024-09-25T14:30:00Z',
      region: 'global',
      likes: 156,
      comments: 43,
      tags: ['tech', 'remote-work', 'policy']
    },
    {
      id: '3',
      type: 'event',
      author: 'Maria Santos',
      authorAvatar: '/api/placeholder/40/40',
      community: 'CA Housing Rights',
      communityType: 'local',
      content: 'Statewide housing rights workshop - learn about tenant protections and organizing strategies. Virtual event open to all California residents.',
      timestamp: '2024-09-25T16:15:00Z',
      eventDate: '2024-10-02T18:00:00Z',
      region: 'state',
      likes: 67,
      comments: 22,
      tags: ['housing', 'rights', 'education']
    }
  ];

  const feedPosts = posts.length > 0 ? posts : samplePosts;

  const filteredPosts = feedPosts.filter(post => {
    const regionMatch = selectedRegion === 'all' || post.region === selectedRegion;
    const typeMatch = selectedType === 'all' || post.type === selectedType;
    return regionMatch && typeMatch;
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getRegionIcon = (region: string) => {
    switch (region) {
      case 'neighborhood': return <Home className="h-3 w-3" />;
      case 'city': return <Building className="h-3 w-3" />;
      case 'state': return <Navigation className="h-3 w-3" />;
      case 'national': return <Globe className="h-3 w-3" />;
      case 'global': return <Globe className="h-3 w-3" />;
      default: return <MapPin className="h-3 w-3" />;
    }
  };

  const getRegionColor = (region: string) => {
    switch (region) {
      case 'neighborhood': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'city': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'state': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'national': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'global': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-40" data-testid="select-region-filter">
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            <SelectItem value="neighborhood">Neighborhood</SelectItem>
            <SelectItem value="city">City</SelectItem>
            <SelectItem value="state">State</SelectItem>
            <SelectItem value="national">National</SelectItem>
            <SelectItem value="global">Global</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-32" data-testid="select-type-filter">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="post">Posts</SelectItem>
            <SelectItem value="event">Events</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" data-testid="tab-all-feed">All Feed</TabsTrigger>
          <TabsTrigger value="events" data-testid="tab-events-feed">Events</TabsTrigger>
          <TabsTrigger value="discussions" data-testid="tab-discussions-feed">Discussions</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12" data-testid="text-no-feed-items">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts to show</h3>
                <p className="text-muted-foreground">
                  Join some topics to see posts and events in your feed
                </p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow" data-testid={`card-feed-item-${post.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.authorAvatar} />
                        <AvatarFallback>{post.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm" data-testid={`text-author-${post.id}`}>
                            {post.author}
                          </span>
                          <span className="text-muted-foreground text-xs">•</span>
                          <span className="text-muted-foreground text-xs" data-testid={`text-community-${post.id}`}>
                            {post.community}
                          </span>
                          <span className="text-muted-foreground text-xs">•</span>
                          <span className="text-muted-foreground text-xs">{formatTime(post.timestamp)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={post.type === 'event' ? 'default' : 'secondary'} className="text-xs" data-testid={`badge-type-${post.id}`}>
                            {post.type === 'event' ? (
                              <>
                                <Calendar className="h-3 w-3 mr-1" />
                                Event
                              </>
                            ) : (
                              'Discussion'
                            )}
                          </Badge>
                          
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getRegionColor(post.region)}`}
                            data-testid={`badge-region-${post.id}`}
                          >
                            {getRegionIcon(post.region)}
                            <span className="ml-1 capitalize">{post.region}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="mb-4 text-sm leading-relaxed" data-testid={`text-content-${post.id}`}>
                      {post.content}
                    </p>
                    
                    {post.type === 'event' && post.location && (
                      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <MapPin className="h-4 w-4" />
                          <span data-testid={`text-location-${post.id}`}>{post.location}</span>
                        </div>
                        {post.eventDate && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span data-testid={`text-event-date-${post.id}`}>
                              {new Date(post.eventDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs" data-testid={`tag-${tag}-${post.id}`}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="h-8 gap-2" data-testid={`button-like-${post.id}`}>
                          <Heart className="h-4 w-4" />
                          <span className="text-xs">{post.likes}</span>
                        </Button>
                        
                        <Button variant="ghost" size="sm" className="h-8 gap-2" data-testid={`button-comment-${post.id}`}>
                          <MessageCircle className="h-4 w-4" />
                          <span className="text-xs">{post.comments}</span>
                        </Button>
                        
                        <Button variant="ghost" size="sm" className="h-8" data-testid={`button-share-${post.id}`}>
                          <Share className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {post.communityType === 'online' && (
                          <Button variant="outline" size="sm" data-testid={`button-find-nearby-${post.id}`}>
                            <Users className="h-4 w-4 mr-1" />
                            Find Nearby
                          </Button>
                        )}
                        
                        {post.type === 'event' && onJoinEvent && (
                          <Button variant="default" size="sm" onClick={() => onJoinEvent(post.id)} data-testid={`button-join-event-${post.id}`}>
                            Join Event
                          </Button>
                        )}
                        
                        {onOpenDM && (
                          <Button variant="outline" size="sm" onClick={() => onOpenDM(post.author)} data-testid={`button-dm-${post.id}`}>
                            Message
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <div className="space-y-4">
            {filteredPosts.filter(post => post.type === 'event').map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow" data-testid={`card-event-${post.id}`}>
                {/* Same card content as above but filtered for events only */}
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.authorAvatar} />
                      <AvatarFallback>{post.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{post.author}</span>
                        <span className="text-muted-foreground text-xs">•</span>
                        <span className="text-muted-foreground text-xs">{post.community}</span>
                        <span className="text-muted-foreground text-xs">•</span>
                        <span className="text-muted-foreground text-xs">{formatTime(post.timestamp)}</span>
                      </div>
                      
                      <Badge variant="default" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        Event
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="mb-4 text-sm leading-relaxed">{post.content}</p>
                  
                  {post.location && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <MapPin className="h-4 w-4" />
                        <span>{post.location}</span>
                      </div>
                      {post.eventDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(post.eventDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" className="h-8 gap-2">
                        <Heart className="h-4 w-4" />
                        <span className="text-xs">{post.likes}</span>
                      </Button>
                      
                      <Button variant="ghost" size="sm" className="h-8 gap-2">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-xs">{post.comments}</span>
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {onJoinEvent && (
                        <Button variant="default" size="sm" onClick={() => onJoinEvent(post.id)}>
                          Join Event
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="discussions" className="mt-6">
          <div className="space-y-4">
            {filteredPosts.filter(post => post.type === 'post').map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow" data-testid={`card-discussion-${post.id}`}>
                {/* Same card content as above but filtered for discussions only */}
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.authorAvatar} />
                      <AvatarFallback>{post.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{post.author}</span>
                        <span className="text-muted-foreground text-xs">•</span>
                        <span className="text-muted-foreground text-xs">{post.community}</span>
                        <span className="text-muted-foreground text-xs">•</span>
                        <span className="text-muted-foreground text-xs">{formatTime(post.timestamp)}</span>
                      </div>
                      
                      <Badge variant="secondary" className="text-xs">
                        Discussion
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="mb-4 text-sm leading-relaxed">{post.content}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" className="h-8 gap-2">
                        <Heart className="h-4 w-4" />
                        <span className="text-xs">{post.likes}</span>
                      </Button>
                      
                      <Button variant="ghost" size="sm" className="h-8 gap-2">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-xs">{post.comments}</span>
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {post.communityType === 'online' && (
                        <Button variant="outline" size="sm">
                          <Users className="h-4 w-4 mr-1" />
                          Find Nearby
                        </Button>
                      )}
                      
                      {onOpenDM && (
                        <Button variant="outline" size="sm" onClick={() => onOpenDM(post.author)}>
                          Message
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityFeed;