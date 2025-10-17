import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle, 
  XCircle, 
  Flag, 
  Calendar, 
  MapPin, 
  User,
  Eye,
  Lock,
  AlertCircle,
  Plus,
  Edit,
  Trash
} from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Story, ModerationAction, Topic } from '../../shared/schema';
import { useToast } from '@/hooks/use-toast';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function Supadmin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [moderatorKey, setModeratorKey] = useState('');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [moderationNotes, setModerationNotes] = useState('');
  const [activeTab, setActiveTab] = useState('moderation');
  
  // Topic form state
  const [topicName, setTopicName] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [topicCategory, setTopicCategory] = useState('');
  const [topicLevel, setTopicLevel] = useState<'neighborhood' | 'city' | 'state' | 'national' | 'global'>('city');
  const [topicLat, setTopicLat] = useState('');
  const [topicLng, setTopicLng] = useState('');
  
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/stories/pending', {
        headers: {
          'X-Moderator-Key': password,
        },
      });
      
      if (response.ok) {
        setModeratorKey(password);
        setIsAuthenticated(true);
        toast({
          title: 'Authenticated',
          description: 'Access granted to moderation panel',
        });
      } else {
        toast({
          title: 'Authentication Failed',
          description: 'Invalid password. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to authenticate. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const { data: pendingStories = [], isLoading, error } = useQuery<Story[]>({
    queryKey: ['/api/stories/pending'],
    queryFn: async () => {
      const response = await fetch('/api/stories/pending', {
        headers: {
          'X-Moderator-Key': moderatorKey,
        },
      });
      if (!response.ok) {
        if (response.status === 403) {
          setIsAuthenticated(false);
          setModeratorKey('');
          toast({
            title: 'Session Expired',
            description: 'Please login again',
            variant: 'destructive',
          });
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch pending stories');
      }
      return response.json();
    },
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });

  const moderateMutation = useMutation({
    mutationFn: async (actionData: ModerationAction) => {
      const response = await fetch(`/api/stories/${actionData.storyId}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Moderator-Key': moderatorKey,
        },
        body: JSON.stringify({
          action: actionData.action,
          notes: actionData.notes,
          moderatorId: 'supadmin',
        }),
      });
      if (!response.ok) throw new Error('Failed to moderate story');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories/pending'] });
      setSelectedStory(null);
      setModerationNotes('');
      toast({
        title: 'Success',
        description: 'Story moderation completed',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Moderation Failed',
        description: error.message || 'Failed to moderate story. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleModerate = (storyId: string, action: 'approve' | 'reject' | 'flag') => {
    moderateMutation.mutate({
      storyId,
      action,
      notes: moderationNotes,
      moderatorId: 'supadmin',
    });
  };

  // Fetch topics from Supabase - must be before conditional returns
  const { data: topics = [], refetch: refetchTopics } = useQuery<Topic[]>({
    queryKey: ['supabase-topics'],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        // Fallback to API if Supabase not configured
        const response = await fetch('/api/communities');
        if (!response.ok) throw new Error('Failed to fetch topics');
        return response.json();
      }

      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform Supabase data to match Topic type
      return (data || []).map((topic: any) => ({
        id: topic.id,
        name: topic.name,
        description: topic.description || '',
        category: topic.category,
        createdBy: topic.created_by,
        maxGeographicScope: topic.max_geographic_scope,
        coordinates: topic.coordinates,
        isActive: topic.is_active,
        memberCount: topic.member_count,
        globalDiscussions: topic.global_discussions || [],
        localDiscussions: topic.local_discussions || [],
        createdAt: topic.created_at,
        updatedAt: topic.updated_at,
      }));
    },
    enabled: isAuthenticated,
  });

  const createTopicMutation = useMutation({
    mutationFn: async (topicData: any) => {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Supabase not configured');
      }

      const { data, error } = await supabase
        .from('topics')
        .insert([{
          name: topicData.name,
          description: topicData.description,
          category: topicData.category,
          created_by: 'supadmin',
          max_geographic_scope: topicData.level,
          coordinates: topicData.lat && topicData.lng 
            ? { lat: parseFloat(topicData.lat), lng: parseFloat(topicData.lng) }
            : null,
          is_active: true,
          member_count: 0,
        }])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchTopics();
      queryClient.invalidateQueries({ queryKey: ['supabase-topics'] });
      setTopicName('');
      setTopicDescription('');
      setTopicCategory('');
      setTopicLevel('city');
      setTopicLat('');
      setTopicLng('');
      toast({
        title: 'Success',
        description: 'Topic created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create topic',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateTopic = () => {
    if (!topicName || !topicCategory) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in name and category',
        variant: 'destructive',
      });
      return;
    }

    createTopicMutation.mutate({
      name: topicName,
      description: topicDescription,
      category: topicCategory,
      level: topicLevel,
      lat: topicLat,
      lng: topicLng,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Lock className="h-12 w-12 text-purple-500" />
            </div>
            <CardTitle className="text-center text-white text-2xl">
              Super Admin Panel
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              Enter password to access story moderation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="bg-gray-800 border-gray-600 text-white"
                data-testid="input-admin-password"
              />
              <Button 
                onClick={handleLogin} 
                className="w-full"
                data-testid="button-admin-login"
              >
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-gray-800 p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-panel-title">
              <Lock className="h-6 w-6 text-purple-500" />
              Super Admin Panel
            </h1>
            <p className="text-gray-400 text-sm" data-testid="text-panel-description">
              Manage stories and topics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-purple-400 border-purple-400" data-testid="badge-pending-count">
              {pendingStories.length} Pending
            </Badge>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAuthenticated(false);
                setModeratorKey('');
                setPassword('');
              }}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-gray-900 mb-6">
            <TabsTrigger value="moderation">Story Moderation</TabsTrigger>
            <TabsTrigger value="topics">Topic Management</TabsTrigger>
          </TabsList>

          <TabsContent value="moderation">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stories List */}
          <div>
            <h2 className="text-xl font-semibold mb-4" data-testid="text-stories-heading">
              Pending Stories ({pendingStories.length})
            </h2>
            
            {isLoading ? (
              <div className="text-center py-12" data-testid="text-loading">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading pending stories...</p>
              </div>
            ) : error ? (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-12 text-center" data-testid="text-error">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">
                    Failed to Load Stories
                  </h3>
                  <p className="text-gray-500">
                    {error.message || 'An error occurred while loading pending stories'}
                  </p>
                </CardContent>
              </Card>
            ) : pendingStories.length === 0 ? (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-12 text-center" data-testid="text-no-stories">
                  <Eye className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">
                    No Pending Stories
                  </h3>
                  <p className="text-gray-500">
                    All stories have been reviewed
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-4">
                  {pendingStories.map((story) => (
                    <Card 
                      key={story.id} 
                      className={`bg-gray-900 border-gray-700 cursor-pointer transition-colors ${
                        selectedStory?.id === story.id ? 'ring-2 ring-purple-500' : 'hover:bg-gray-800'
                      }`}
                      onClick={() => {
                        setSelectedStory(story);
                        setModerationNotes(story.moderationNotes || '');
                      }}
                      data-testid={`story-card-${story.id}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-white text-lg" data-testid={`story-title-${story.id}`}>
                            {story.title}
                          </CardTitle>
                          <Badge variant="secondary" className="bg-yellow-900 text-yellow-400">
                            Pending
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2" data-testid={`story-excerpt-${story.id}`}>
                          {story.excerpt}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {story.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {story.location.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(story.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {story.images && story.images.length > 0 && (
                          <div className="mt-3">
                            <Badge variant="outline" className="text-gray-400 border-gray-600">
                              {story.images.length} image{story.images.length > 1 ? 's' : ''}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Story Details & Moderation */}
          <div>
            {selectedStory ? (
              <Card className="bg-gray-900 border-gray-700 sticky top-6">
                <CardHeader>
                  <CardTitle className="text-white" data-testid="detail-story-title">
                    {selectedStory.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span data-testid="detail-story-author">by {selectedStory.author}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ScrollArea className="h-64">
                    <div className="space-y-4 pr-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Content</h3>
                        <p className="text-white text-sm" data-testid="detail-story-content">
                          {selectedStory.content}
                        </p>
                      </div>

                      {selectedStory.images && selectedStory.images.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-400 mb-2">
                            Images ({selectedStory.images.length})
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedStory.images.map((img, idx) => (
                              <img 
                                key={idx}
                                src={img} 
                                alt={`Story image ${idx + 1}`}
                                className="w-full h-32 object-cover rounded border border-gray-700"
                                data-testid={`story-image-${idx}`}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">Details</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <MapPin className="h-4 w-4" />
                            <span data-testid="detail-story-location">{selectedStory.location.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="h-4 w-4" />
                            <span data-testid="detail-story-date">
                              {new Date(selectedStory.submittedAt).toLocaleString()}
                            </span>
                          </div>
                          {selectedStory.isLocationVerified && (
                            <Badge variant="outline" className="text-green-400 border-green-400">
                              Location Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Moderation Notes</h3>
                    <Textarea
                      placeholder="Add notes about this story (optional)"
                      value={moderationNotes}
                      onChange={(e) => setModerationNotes(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white min-h-20"
                      data-testid="textarea-moderation-notes"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleModerate(selectedStory.id, 'approve')}
                      disabled={moderateMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      data-testid="button-approve"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleModerate(selectedStory.id, 'reject')}
                      disabled={moderateMutation.isPending}
                      variant="destructive"
                      className="flex-1"
                      data-testid="button-reject"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleModerate(selectedStory.id, 'flag')}
                      disabled={moderateMutation.isPending}
                      variant="outline"
                      className="border-orange-600 text-orange-400 hover:bg-orange-900"
                      data-testid="button-flag"
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-12 text-center">
                  <Eye className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2" data-testid="text-select-story">
                    Select a Story
                  </h3>
                  <p className="text-gray-500">
                    Click on a story from the left to review and moderate
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
          </TabsContent>

          <TabsContent value="topics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Topic Form */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create New Topic
                  </CardTitle>
                  <CardDescription>
                    Add topics for specific locations and levels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isSupabaseConfigured && (
                    <div className="bg-orange-900/30 border border-orange-600 rounded p-3 mb-4">
                      <p className="text-orange-400 text-sm">
                        ⚠️ Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="topic-name">Topic Name *</Label>
                    <Input
                      id="topic-name"
                      placeholder="e.g. Housing Solutions - San Francisco"
                      value={topicName}
                      onChange={(e) => setTopicName(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topic-description">Description</Label>
                    <Textarea
                      id="topic-description"
                      placeholder="Describe this topic..."
                      value={topicDescription}
                      onChange={(e) => setTopicDescription(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white min-h-20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topic-category">Category *</Label>
                    <Select value={topicCategory} onValueChange={setTopicCategory}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Humanitarian">Humanitarian</SelectItem>
                        <SelectItem value="Environmental">Environmental</SelectItem>
                        <SelectItem value="Community">Community</SelectItem>
                        <SelectItem value="Social Justice">Social Justice</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topic-level">Geographic Level</Label>
                    <Select value={topicLevel} onValueChange={(val: any) => setTopicLevel(val)}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neighborhood">🟢 Neighborhood</SelectItem>
                        <SelectItem value="city">🔵 City</SelectItem>
                        <SelectItem value="state">🟣 State/Region</SelectItem>
                        <SelectItem value="national">🟠 National</SelectItem>
                        <SelectItem value="global">🔴 Global</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="topic-lat">Latitude</Label>
                      <Input
                        id="topic-lat"
                        type="number"
                        step="0.000001"
                        placeholder="37.7749"
                        value={topicLat}
                        onChange={(e) => setTopicLat(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="topic-lng">Longitude</Label>
                      <Input
                        id="topic-lng"
                        type="number"
                        step="0.000001"
                        placeholder="-122.4194"
                        value={topicLng}
                        onChange={(e) => setTopicLng(e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateTopic}
                    disabled={createTopicMutation.isPending || !isSupabaseConfigured}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {createTopicMutation.isPending ? 'Creating...' : 'Create Topic'}
                  </Button>
                </CardContent>
              </Card>

              {/* Topics List */}
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Existing Topics</CardTitle>
                  <CardDescription>
                    {topics.length} topics in database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-3">
                      {topics.map((topic) => (
                        <Card key={topic.id} className="bg-gray-800 border-gray-700">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-white text-sm mb-1">
                                  {topic.name}
                                </h4>
                                <p className="text-xs text-gray-400 line-clamp-2">
                                  {topic.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs flex-wrap mt-3">
                              <Badge
                                variant="outline"
                                style={{
                                  backgroundColor:
                                    topic.maxGeographicScope === 'neighborhood' ? '#10b981' :
                                    topic.maxGeographicScope === 'city' ? '#3b82f6' :
                                    topic.maxGeographicScope === 'state' ? '#a855f7' :
                                    topic.maxGeographicScope === 'national' ? '#f97316' :
                                    '#ef4444',
                                  color: 'white',
                                  borderColor: 'transparent'
                                }}
                              >
                                {topic.maxGeographicScope === 'neighborhood' && '🟢'}
                                {topic.maxGeographicScope === 'city' && '🔵'}
                                {topic.maxGeographicScope === 'state' && '🟣'}
                                {topic.maxGeographicScope === 'national' && '🟠'}
                                {topic.maxGeographicScope === 'global' && '🔴'}
                                {' '}{topic.maxGeographicScope}
                              </Badge>
                              <Badge variant="secondary">
                                {topic.category}
                              </Badge>
                              {topic.coordinates && (
                                <Badge variant="outline" className="text-gray-400">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {topic.coordinates.lat.toFixed(4)}, {topic.coordinates.lng.toFixed(4)}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-gray-400">
                                {topic.memberCount} members
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
