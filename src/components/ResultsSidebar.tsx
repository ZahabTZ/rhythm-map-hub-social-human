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
}

const ResultsSidebar: React.FC<ResultsSidebarProps> = ({ 
  isOpen, 
  onClose, 
  searchResults = [] 
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'musicians' | 'business' | 'events'>('all');

  // Mock data for demonstration
  const mockResults = [
    {
      id: '1',
      type: 'musician',
      name: 'Carlos Santana Jr.',
      location: 'San Francisco Bay Area',
      genre: ['Latin Rock', 'Salsa', 'Jazz Fusion'],
      rating: 4.8,
      followers: 15420,
      image: '/api/placeholder/80/80',
      languages: ['English', 'Spanish'],
      verified: true,
      description: 'Third-generation guitarist specializing in Bay Area Latin fusion',
      contact: { email: 'carlos@example.com', phone: '+1-415-555-0123' }
    },
    {
      id: '2',
      type: 'business',
      name: 'Elena Rodriguez',
      role: 'Music Producer',
      location: 'Los Angeles, CA',
      specialties: ['Latin Music', 'Urban Latino', 'Reggaeton'],
      rating: 4.9,
      projects: 234,
      image: '/api/placeholder/80/80',
      company: 'Fuego Productions',
      verified: true,
      description: 'Grammy-nominated producer with 15+ years in Latin music industry'
    },
    {
      id: '3',
      type: 'event',
      name: 'Salsa Under the Stars',
      venue: 'Mission Dolores Park',
      location: 'San Francisco, CA',
      date: '2024-08-15',
      time: '7:00 PM',
      price: '$25-45',
      image: '/api/placeholder/80/80',
      organizer: 'Bay Area Latin Music Collective',
      genres: ['Salsa', 'Bachata', 'Merengue']
    }
  ];

  // Use searchResults if available, otherwise fall back to mockResults
  const dataToUse = searchResults.length > 0 ? searchResults : mockResults;
  
  const filteredResults = activeTab === 'all' 
    ? dataToUse 
    : dataToUse.filter(result => 
        activeTab === 'musicians' ? result.type === 'musician' :
        activeTab === 'business' ? result.type === 'business' :
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
              { id: 'musicians', label: 'Musicians', count: dataToUse.filter(r => r.type === 'musician').length },
              { id: 'business', label: 'Business', count: dataToUse.filter(r => r.type === 'business').length },
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
                {result.type === 'musician' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={result.image} />
                        <AvatarFallback className="bg-musician/20 text-musician">
                          <Music className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{result.name}</h3>
                          {result.verified && (
                            <Badge variant="secondary" className="bg-musician/20 text-musician text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {result.location}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {result.rating} • {result.followers ? result.followers.toLocaleString() + ' followers' : result.genre || 'Music'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(result.genre) ? result.genre : [result.genre]).filter(Boolean).map((g: string) => (
                        <Badge key={g} variant="outline" className="text-xs">
                          {g}
                        </Badge>
                      ))}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{result.description}</p>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Mail className="h-3 w-3 mr-1" />
                        Book Gig
                      </Button>
                      <Button variant="outline" size="sm">
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Instagram className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {result.type === 'business' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={result.image} />
                        <AvatarFallback className="bg-business/20 text-business">
                          <Users className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{result.name}</h3>
                        <p className="text-sm font-medium text-business">{result.role || result.category}</p>
                        <p className="text-xs text-muted-foreground">{result.company || 'Music Business'}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {result.location}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {result.rating} • {result.projects || 'Professional'} {result.projects ? 'projects' : ''}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {(result.specialties || [result.category]).filter(Boolean).map((s: string) => (
                        <Badge key={s} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{result.description}</p>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Mail className="h-3 w-3 mr-1" />
                        Contact
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
                        <AvatarFallback className="bg-concert/20 text-concert rounded-lg">
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
                        <div className="text-sm font-medium text-concert">{result.price || 'See event details'}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {(result.genres || ['Music Event']).map((g: string) => (
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