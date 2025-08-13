import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Users, TrendingUp, Calendar, MessageSquare, Heart } from 'lucide-react';

const Crisis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Mock crisis data - in real app, this would come from API based on id
  const crisisData = {
    id: id || '1',
    name: 'Eastern Europe Refugee Crisis',
    severity: 'Critical',
    affected: 2500000,
    description: 'Ongoing humanitarian crisis affecting millions of displaced people in Eastern Europe due to conflict. Urgent need for shelter, food, and medical supplies.',
    image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    location: 'Eastern Europe',
    lastUpdated: '2024-01-15',
    statistics: {
      displaced: 2500000,
      needingAid: 1800000,
      childrenAffected: 800000,
      partnersOnGround: 45
    }
  };

  const communityMembers = [
    { id: 1, name: 'Sarah Johnson', avatar: 'SJ', role: 'Relief Coordinator', online: true },
    { id: 2, name: 'Dr. Ahmed Hassan', avatar: 'AH', role: 'Medical Director', online: true },
    { id: 3, name: 'Maria Garcia', avatar: 'MG', role: 'Logistics Manager', online: false },
    { id: 4, name: 'James Liu', avatar: 'JL', role: 'Field Reporter', online: true }
  ];

  const newsItems = [
    {
      id: 1,
      title: 'New aid shipment arrives at border crossing',
      date: '2024-01-15',
      summary: 'Critical medical supplies and food provisions distributed to refugee camps.'
    },
    {
      id: 2,
      title: 'International donors pledge additional $50M in emergency funding',
      date: '2024-01-14',
      summary: 'Major breakthrough in securing resources for long-term humanitarian response.'
    },
    {
      id: 3,
      title: 'Winter shelter program expanded to accommodate 10,000 more families',
      date: '2024-01-13',
      summary: 'Urgent winterization efforts underway as temperatures drop below freezing.'
    }
  ];

  const events = [
    {
      id: 1,
      title: 'Emergency Relief Distribution',
      date: '2024-01-18',
      time: '09:00 AM',
      location: 'Border Camp A',
      type: 'Aid Distribution'
    },
    {
      id: 2,
      title: 'Medical Clinic Setup',
      date: '2024-01-20',
      time: '10:00 AM',
      location: 'Refugee Center B',
      type: 'Medical'
    },
    {
      id: 3,
      title: 'Volunteer Coordination Meeting',
      date: '2024-01-22',
      time: '02:00 PM',
      location: 'Virtual',
      type: 'Coordination'
    }
  ];

  const stories = [
    {
      id: 1,
      title: 'Finding Hope in Uncertainty',
      author: 'Anna K.',
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      excerpt: 'After fleeing with just the clothes on our backs, the kindness of strangers has restored our faith in humanity...',
      likes: 42,
      date: '2024-01-14'
    },
    {
      id: 2,
      title: 'Rebuilding Community',
      author: 'Marcus T.',
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      excerpt: 'In our temporary shelter, we have created a small school for the children. Education continues even in crisis...',
      likes: 38,
      date: '2024-01-13'
    },
    {
      id: 3,
      title: 'Medical Heroes on the Frontline',
      author: 'Dr. Elena P.',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      excerpt: 'Working 16-hour days to provide medical care to those who need it most. Every life saved gives us strength...',
      likes: 67,
      date: '2024-01-12'
    },
    {
      id: 4,
      title: 'Small Acts of Kindness',
      author: 'Fatima A.',
      image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      excerpt: 'A warm meal shared with strangers becomes a moment of connection and hope for tomorrow...',
      likes: 29,
      date: '2024-01-11'
    },
    {
      id: 5,
      title: 'Letters from Home',
      author: 'Dimitri V.',
      image: 'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      excerpt: 'Messages from family members still in conflict zones remind us why we must keep fighting for peace...',
      likes: 51,
      date: '2024-01-10'
    },
    {
      id: 6,
      title: 'Children\'s Resilience',
      author: 'Teacher Maria',
      image: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      excerpt: 'Despite everything they have been through, the children still laugh and play. Their spirit inspires us all...',
      likes: 73,
      date: '2024-01-09'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Map
            </Button>
            <div className="flex items-center gap-3">
              <Badge variant={crisisData.severity === 'Critical' ? 'destructive' : 'secondary'}>
                {crisisData.severity}
              </Badge>
              <h1 className="text-2xl font-bold">{crisisData.name}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={crisisData.image} 
          alt={crisisData.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent">
          <div className="container mx-auto px-4 h-full flex items-end">
            <div className="text-white pb-8">
              <h2 className="text-3xl font-bold mb-2">{crisisData.name}</h2>
              <p className="text-lg opacity-90">{crisisData.location}</p>
              <p className="text-sm opacity-75">Last updated: {crisisData.lastUpdated}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="stories">Stories</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Crisis Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {crisisData.description}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{crisisData.statistics.displaced.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Displaced</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{crisisData.statistics.needingAid.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Need Aid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{crisisData.statistics.childrenAffected.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Children</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{crisisData.statistics.partnersOnGround}</div>
                    <div className="text-sm text-muted-foreground">Partners</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Population Impact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Displaced</span>
                      <span className="font-semibold">{crisisData.statistics.displaced.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Needing Aid</span>
                      <span className="font-semibold">{crisisData.statistics.needingAid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Children Affected</span>
                      <span className="font-semibold">{crisisData.statistics.childrenAffected.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Response Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Partners on Ground</span>
                      <span className="font-semibold">{crisisData.statistics.partnersOnGround}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aid Coverage</span>
                      <span className="font-semibold">72%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Funding Received</span>
                      <span className="font-semibold">$127M</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Community Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {communityMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.avatar}</AvatarFallback>
                        </Avatar>
                        {member.online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Join Community Chat
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="news" className="space-y-6">
            <div className="space-y-4">
              {newsItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <span className="text-sm text-muted-foreground">{item.date}</span>
                    </div>
                    <p className="text-muted-foreground">{item.summary}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {event.date} at {event.time}
                          </span>
                          <span>{event.location}</span>
                        </div>
                      </div>
                      <Badge variant="outline">{event.type}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stories" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <Card key={story.id} className="overflow-hidden">
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={story.image} 
                      alt={story.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{story.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {story.excerpt}
                    </p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">by {story.author}</span>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span>{story.likes}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{story.date}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Crisis;