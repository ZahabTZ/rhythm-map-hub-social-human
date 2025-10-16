import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Users, TrendingUp, Calendar, MessageSquare, Heart, Plus } from 'lucide-react';
import { StorySubmissionForm } from '@/components/StorySubmissionForm';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import type { Story } from '../../shared/schema';

const Crisis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isStoryFormOpen, setIsStoryFormOpen] = useState(false);

  // Fetch approved stories from API
  const { data: apiStories = [], isLoading: storiesLoading, error: storiesError } = useQuery<Story[]>({
    queryKey: ['/api/stories/crisis', id],
    queryFn: async () => {
      const response = await fetch(`/api/stories/crisis/${id}`);
      if (!response.ok) throw new Error('Failed to fetch stories');
      return response.json();
    },
    enabled: !!id,
  });

  // Like story mutation
  const likeStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const response = await fetch(`/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to like story');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories/crisis', id] });
    },
  });
  
  // Crisis data based on ID - using accurate data from UN sources (Oct 15, 2025)
  const getCrisisData = (crisisId: string) => {
    const crisisMap: Record<string, any> = {
      'gaza-2024': {
        id: crisisId,
        name: 'Gaza Strip',
        severity: 'Critical',
        affected: 2100000,
        description: 'Aid access heavily constrained; nearly entire population displaced during war.',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Gaza, Palestine',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 2100000,
          needingAid: 2100000,
          childrenAffected: 900000,
          partnersOnGround: 88
        }
      },
      'sudan-2025': {
        id: crisisId,
        name: 'Sudan',
        severity: 'Critical',
        affected: 30400000,
        description: 'Largest humanitarian crisis; >4M refugees in neighboring states + massive internal displacement.',
        image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Sudan',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 12000000,
          needingAid: 30400000,
          childrenAffected: 14000000,
          partnersOnGround: 120
        }
      },
      'ukraine-2025': {
        id: crisisId,
        name: 'Ukraine',
        severity: 'Critical',
        affected: 12700000,
        description: 'Ongoing strikes on energy and civilian infrastructure.',
        image: 'https://images.unsplash.com/photo-1605818610003-0a1476dfbc26?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Ukraine',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 6500000,
          needingAid: 12700000,
          childrenAffected: 3500000,
          partnersOnGround: 95
        }
      },
      'syria-2025': {
        id: crisisId,
        name: 'Syria',
        severity: 'Critical',
        affected: 17000000,
        description: 'Response plans remain severely underfunded.',
        image: 'https://images.unsplash.com/photo-1591608971362-f08b2a75731a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Syria',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 7200000,
          needingAid: 17000000,
          childrenAffected: 6800000,
          partnersOnGround: 110
        }
      },
      'yemen-2025': {
        id: crisisId,
        name: 'Yemen',
        severity: 'Critical',
        affected: 19500000,
        description: 'Funding gaps are acute.',
        image: 'https://images.unsplash.com/photo-1591608971362-f08b2a75731a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Yemen',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 4500000,
          needingAid: 19500000,
          childrenAffected: 11000000,
          partnersOnGround: 78
        }
      },
      'afghanistan-2025': {
        id: crisisId,
        name: 'Afghanistan',
        severity: 'Critical',
        affected: 22900000,
        description: 'Agencies warn of winter risks and service shutdowns due to cuts.',
        image: 'https://images.unsplash.com/photo-1564859228273-274232fdb516?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Afghanistan',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 4300000,
          needingAid: 22900000,
          childrenAffected: 12800000,
          partnersOnGround: 85
        }
      },
      'myanmar-2025': {
        id: crisisId,
        name: 'Myanmar',
        severity: 'Critical',
        affected: 21000000,
        description: 'Civil conflict with massive displacement.',
        image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Myanmar',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 3600000,
          needingAid: 21000000,
          childrenAffected: 8400000,
          partnersOnGround: 62
        }
      },
      'drc-2025': {
        id: crisisId,
        name: 'DR Congo',
        severity: 'Critical',
        affected: 28000000,
        description: 'Conflict in the east and record hunger.',
        image: 'https://images.unsplash.com/photo-1584380931214-dbb5b72e7fd0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Democratic Republic of Congo',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 7100000,
          needingAid: 28000000,
          childrenAffected: 14000000,
          partnersOnGround: 92
        }
      },
      'somalia-2025': {
        id: crisisId,
        name: 'Somalia',
        severity: 'High',
        affected: 6000000,
        description: 'Drought, flooding, and conflict.',
        image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Somalia',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 3500000,
          needingAid: 6000000,
          childrenAffected: 2400000,
          partnersOnGround: 54
        }
      },
      'south-sudan-2025': {
        id: crisisId,
        name: 'South Sudan',
        severity: 'Critical',
        affected: 9300000,
        description: 'Flooding and violence; nearly 0.5M newly displaced in 2025.',
        image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'South Sudan',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 2300000,
          needingAid: 9300000,
          childrenAffected: 4200000,
          partnersOnGround: 68
        }
      },
      'haiti-2025': {
        id: crisisId,
        name: 'Haiti',
        severity: 'Critical',
        affected: 5000000,
        description: 'Gang control over Port-au-Prince, political vacuum, kidnappings, cholera resurgence, famine-risk zones.',
        image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Haiti',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 700000,
          needingAid: 5000000,
          childrenAffected: 2200000,
          partnersOnGround: 42
        }
      },
      'burkina-faso-2025': {
        id: crisisId,
        name: 'Burkina Faso',
        severity: 'High',
        affected: 5900000,
        description: 'Severely neglected crisis.',
        image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Burkina Faso',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 2000000,
          needingAid: 5900000,
          childrenAffected: 2950000,
          partnersOnGround: 38
        }
      },
      'chad-2025': {
        id: crisisId,
        name: 'Chad',
        severity: 'High',
        affected: 1280000,
        description: 'Hosting Sudanese refugees, straining fragile context.',
        image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Chad',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 1280000,
          needingAid: 1280000,
          childrenAffected: 640000,
          partnersOnGround: 45
        }
      },
      'rohingya-2025': {
        id: crisisId,
        name: 'Rohingya (Bangladesh)',
        severity: 'High',
        affected: 1200000,
        description: 'Refugees in Cox\'s Bazar and Bhasan Char.',
        image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Cox\'s Bazar, Bangladesh',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 1200000,
          needingAid: 1480000,
          childrenAffected: 600000,
          partnersOnGround: 52
        }
      },
      'car-2025': {
        id: crisisId,
        name: 'Central African Republic',
        severity: 'High',
        affected: 2400000,
        description: 'Limited humanitarian access and funding.',
        image: 'https://images.unsplash.com/photo-1584380931214-dbb5b72e7fd0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Central African Republic',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 800000,
          needingAid: 2400000,
          childrenAffected: 1200000,
          partnersOnGround: 36
        }
      },
      'lebanon-2025': {
        id: crisisId,
        name: 'Lebanon',
        severity: 'High',
        affected: 4100000,
        description: 'Economic collapse and regional conflict spillovers.',
        image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Lebanon',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 850000,
          needingAid: 4100000,
          childrenAffected: 1600000,
          partnersOnGround: 58
        }
      },
      'venezuela-2025': {
        id: crisisId,
        name: 'Venezuela',
        severity: 'Critical',
        affected: 7500000,
        description: 'Largest displacement in Western Hemisphere - comparable to Syria. Economic collapse, food/medicine shortages.',
        image: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Venezuela (Regional Crisis)',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 7500000,
          needingAid: 7500000,
          childrenAffected: 2800000,
          partnersOnGround: 72
        }
      },
      'north-korea-2025': {
        id: crisisId,
        name: 'North Korea',
        severity: 'High',
        affected: 10000000,
        description: 'Severe food insecurity and chronic malnutrition crisis.',
        image: 'https://images.unsplash.com/photo-1564859228273-274232fdb516?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'North Korea',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 0,
          needingAid: 10000000,
          childrenAffected: 3500000,
          partnersOnGround: 12
        }
      },
      'colombia-2025': {
        id: crisisId,
        name: 'Colombia',
        severity: 'High',
        affected: 6000000,
        description: 'Resurgent armed groups (ELN, FARC dissidents), coca-economy violence, Venezuelan refugee strain.',
        image: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Colombia',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 8500000,
          needingAid: 6000000,
          childrenAffected: 2400000,
          partnersOnGround: 64
        }
      },
      'central-america-2025': {
        id: crisisId,
        name: 'Central America (Northern Triangle)',
        severity: 'Medium',
        affected: 3000000,
        description: 'Chronic violence, extortion, corruption, climate crop failures. Millions displaced or migrating north.',
        image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Guatemala, El Salvador, Honduras',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 1200000,
          needingAid: 3000000,
          childrenAffected: 1400000,
          partnersOnGround: 48
        }
      },
      'cuba-2025': {
        id: crisisId,
        name: 'Cuba',
        severity: 'Medium',
        affected: 5000000,
        description: 'Severe economic crisis, power shortages, medicine scarcity, record outward migration to U.S.',
        image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        location: 'Cuba',
        lastUpdated: '2025-10-15',
        statistics: {
          displaced: 500000,
          needingAid: 5000000,
          childrenAffected: 1800000,
          partnersOnGround: 22
        }
      }
    };

    return crisisMap[crisisId] || {
      id: id || '1',
      name: 'Humanitarian Crisis',
      severity: 'High',
      affected: 1000000,
      description: 'Humanitarian crisis requiring urgent international response and support.',
      image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      location: 'Unknown',
      lastUpdated: '2025-10-15',
      statistics: {
        displaced: 500000,
        needingAid: 1000000,
        childrenAffected: 400000,
        partnersOnGround: 25
      }
    };
  };

  const crisisData = getCrisisData(id || '');

  const communityMembers = [
    { id: 1, name: 'Sarah Johnson', avatar: 'SJ', role: 'Relief Coordinator', online: true },
    { id: 2, name: 'Dr. Ahmed Hassan', avatar: 'AH', role: 'Medical Director', online: true },
    { id: 3, name: 'Maria Garcia', avatar: 'MG', role: 'Logistics Manager', online: false },
    { id: 4, name: 'James Liu', avatar: 'JL', role: 'Field Reporter', online: true }
  ];

  const getNewsItems = (crisisId: string) => {
    if (crisisId === 'gaza-2024') {
      return [
        {
          id: 1,
          title: 'UN confirms famine conditions in Gaza City',
          date: '2025-09-20',
          summary: 'Widespread acute malnutrition documented with 28,000 cases among children under 5.'
        },
        {
          id: 2,
          title: 'Less than 35% of required food supplies entering Gaza',
          date: '2025-09-18',
          summary: 'Severe access restrictions hampering humanitarian aid delivery to 1.9 million displaced people.'
        },
        {
          id: 3,
          title: 'Only 17 of 35 hospitals partially functioning',
          date: '2025-09-15',
          summary: 'Healthcare system severely compromised with critical shortages of medical supplies and equipment.'
        }
      ];
    }
    
    return [
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
  };

  const newsItems = getNewsItems(id || '');

  const getEvents = (crisisId: string) => {
    if (crisisId === 'gaza-2024') {
      return [
        {
          id: 1,
          title: 'Emergency Food Distribution',
          date: '2025-09-30',
          time: '08:00 AM',
          location: 'Gaza City Distribution Point',
          type: 'Food Aid'
        },
        {
          id: 2,
          title: 'Mobile Medical Clinic',
          date: '2025-10-02',
          time: '10:00 AM',
          location: 'Khan Younis Refugee Camp',
          type: 'Medical'
        },
        {
          id: 3,
          title: 'Child Malnutrition Screening',
          date: '2025-10-05',
          time: '09:00 AM',
          location: 'Rafah Health Center',
          type: 'Health'
        }
      ];
    }
    
    return [
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
  };

  const events = getEvents(id || '');

  // Use API stories
  const stories = apiStories;

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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="overview" className="text-xs md:text-sm py-2">Overview</TabsTrigger>
            <TabsTrigger value="stories" className="text-xs md:text-sm py-2">Stories</TabsTrigger>
            <TabsTrigger value="get-involved" className="text-xs md:text-sm py-2">Get Involved</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Crisis Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  {crisisData.description}
                </p>
                
                {/* Statistics Section */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
                            <span className="font-semibold">{id === 'gaza-2024' ? '35%' : '72%'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Funding Received</span>
                            <span className="font-semibold">{id === 'gaza-2024' ? '$1.05B' : '$127M'}</span>
                          </div>
                          {id === 'gaza-2024' && (
                            <div className="flex justify-between">
                              <span>Funding Required</span>
                              <span className="font-semibold">$6.6B</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stories" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Archive Your Stories</h2>
              <p className="text-lg text-muted-foreground">Get visibility, forever your pains won't go unheard</p>
            </div>
            
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Community Stories ({stories.length})</h3>
              <Button
                onClick={() => setIsStoryFormOpen(true)}
                className="flex items-center gap-2"
                data-testid="button-submit-story"
              >
                <Plus className="h-4 w-4" />
                Submit Your Story
              </Button>
            </div>
            
            {storiesLoading ? (
              <div className="text-center py-12" data-testid="text-loading-stories">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading stories...</p>
              </div>
            ) : storiesError ? (
              <Card>
                <CardContent className="p-12 text-center" data-testid="text-error-stories">
                  <MessageSquare className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    Failed to Load Stories
                  </h3>
                  <p className="text-muted-foreground">
                    Unable to fetch stories at this time. Please try again later.
                  </p>
                </CardContent>
              </Card>
            ) : stories.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center" data-testid="text-no-stories">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    No Stories Yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to share your story from this crisis
                  </p>
                  <Button onClick={() => setIsStoryFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Your Story
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stories.map((story) => (
                  <Card key={story.id} className="overflow-hidden" data-testid={`story-card-${story.id}`}>
                    {story.images && story.images.length > 0 && (
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src={story.images[0]}
                          alt={story.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2" data-testid={`story-title-${story.id}`}>
                        {story.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3" data-testid={`story-excerpt-${story.id}`}>
                        {story.excerpt}
                      </p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground" data-testid={`story-author-${story.id}`}>
                          by {story.author}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => likeStoryMutation.mutate(story.id)}
                          disabled={likeStoryMutation.isPending}
                          className="flex items-center gap-1"
                          data-testid={`button-like-${story.id}`}
                        >
                          <Heart className="h-4 w-4 text-red-500" />
                          <span>{story.likes}</span>
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1" data-testid={`story-date-${story.id}`}>
                        {new Date(story.submittedAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="get-involved" className="space-y-8">
            {/* Community Section */}
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
                <Button 
                  className="w-full mt-4"
                  onClick={() => {
                    const communityId = `crisis_community_${id}`;
                    const params = new URLSearchParams({
                      id: communityId,
                      name: `${crisisData.name} Support Community`,
                      category: 'Crisis Response',
                    });
                    navigate(`/community-chat?${params.toString()}`);
                  }}
                  data-testid="button-join-crisis-chat"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Join Community Chat
                </Button>
              </CardContent>
            </Card>

            {/* News Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Latest News</h3>
              {newsItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg">{item.title}</h4>
                      <span className="text-sm text-muted-foreground">{item.date}</span>
                    </div>
                    <p className="text-muted-foreground">{item.summary}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Events Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Upcoming Events</h3>
              {events.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{event.title}</h4>
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
        </Tabs>
        
        {/* Story Submission Form */}
        <StorySubmissionForm
          isOpen={isStoryFormOpen}
          onClose={() => setIsStoryFormOpen(false)}
          crisis={{
            id: crisisData.id,
            name: crisisData.name,
            location: {
              lat: id === 'gaza-2024' ? 31.5017 : 49.8397, // Gaza coordinates vs Eastern Europe
              lng: id === 'gaza-2024' ? 34.4668 : 24.0297,
              name: crisisData.location,
            },
            severity: crisisData.severity as 'Low' | 'Medium' | 'High' | 'Critical',
            isActive: true,
            allowStorySubmissions: true,
          }}
          onSubmissionSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/stories/crisis', id] });
            setIsStoryFormOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default Crisis;