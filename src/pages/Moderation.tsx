import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Flag, Clock, MapPin, User } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { checkModeratorAccess, promptForModeratorKey, getModeratorHeaders } from '@/lib/auth';
import type { Story, ModerationAction } from '../../shared/schema';

export function Moderation() {
  const { toast } = useToast();
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [moderationNotes, setModerationNotes] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    if (checkModeratorAccess()) {
      setIsAuthenticated(true);
    } else {
      const hasAccess = promptForModeratorKey();
      setIsAuthenticated(hasAccess);
    }
  }, []);

  // Fetch pending stories with auto-refresh
  const { data: pendingStories = [], isLoading } = useQuery<Story[]>({
    queryKey: ['/api/stories/pending'],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    enabled: isAuthenticated, // Only fetch if authenticated
  });

  // Moderate story mutation
  const moderateStoryMutation = useMutation({
    mutationFn: async ({ storyId, moderationData }: { storyId: string; moderationData: Omit<ModerationAction, 'storyId'> }) => {
      return apiRequest(`/api/stories/${storyId}/moderate`, {
        method: 'POST',
        body: JSON.stringify(moderationData),
        headers: getModeratorHeaders(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories/pending'] });
      setSelectedStory(null);
      setModerationNotes('');
      toast({
        title: 'Story moderated successfully',
        description: 'The story has been processed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Moderation failed',
        description: 'Failed to moderate the story. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleModeration = (action: 'approve' | 'reject' | 'flag') => {
    if (!selectedStory || !isAuthenticated) return;

    const moderationData = {
      action,
      notes: moderationNotes || undefined,
      moderatorId: 'admin', // In a real app, this would come from auth context
    };

    moderateStoryMutation.mutate({
      storyId: selectedStory.id,
      moderationData,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6" data-testid="auth-required">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <XCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
            <p>Authentication required for moderation access</p>
            <Button onClick={() => {
              const hasAccess = promptForModeratorKey();
              setIsAuthenticated(hasAccess);
            }} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6" data-testid="loading-moderation">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading pending stories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" data-testid="moderation-dashboard">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Content Moderation</h1>
        <p className="text-muted-foreground">
          Review and moderate user-submitted stories for inappropriate content
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stories List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Stories ({pendingStories.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {pendingStories.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground" data-testid="no-pending-stories">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No pending stories to review</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {pendingStories.map((story: Story) => (
                    <div
                      key={story.id}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedStory?.id === story.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedStory(story)}
                      data-testid={`story-item-${story.id}`}
                    >
                      <div className="space-y-2">
                        <h3 className="font-medium line-clamp-2">{story.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {story.excerpt || story.content}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {story.author}
                          <MapPin className="h-3 w-3 ml-2" />
                          {story.location.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={story.isLocationVerified ? 'default' : 'secondary'}>
                            {story.isLocationVerified ? 'Verified' : 'Unverified'}
                          </Badge>
                          {story.images.length > 0 && (
                            <Badge variant="outline">{story.images.length} image(s)</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Submitted: {new Date(story.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Story Review Panel */}
        <div className="lg:col-span-2">
          {selectedStory ? (
            <Card data-testid="story-review-panel">
              <CardHeader>
                <CardTitle>{selectedStory.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {selectedStory.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedStory.location.name}
                  </span>
                  <Badge variant={selectedStory.isLocationVerified ? 'default' : 'secondary'}>
                    {selectedStory.isLocationVerified ? 'Location Verified' : 'Location Unverified'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Story Content */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Content</h4>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="whitespace-pre-wrap">{selectedStory.content}</p>
                    </div>
                  </div>

                  {/* Images */}
                  {selectedStory.images.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Images ({selectedStory.images.length})</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedStory.images.map((imageUrl, index) => (
                          <div key={index} className="rounded-lg overflow-hidden border">
                            <img
                              src={imageUrl}
                              alt={`Story image ${index + 1}`}
                              className="w-full h-32 object-cover"
                              data-testid={`story-image-${index}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Location Info */}
                  <div>
                    <h4 className="font-medium mb-2">Location Details</h4>
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <p><strong>Name:</strong> {selectedStory.location.name}</p>
                      <p><strong>Coordinates:</strong> {selectedStory.location.lat}, {selectedStory.location.lng}</p>
                      <p><strong>Crisis ID:</strong> {selectedStory.location.crisisId}</p>
                      <p><strong>Verified:</strong> {selectedStory.isLocationVerified ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>

                {/* Moderation Notes */}
                <div>
                  <h4 className="font-medium mb-2">Moderation Notes (Optional)</h4>
                  <Textarea
                    placeholder="Add notes about your moderation decision..."
                    value={moderationNotes}
                    onChange={(e) => setModerationNotes(e.target.value)}
                    className="min-h-20"
                    data-testid="moderation-notes"
                  />
                </div>

                {/* Moderation Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleModeration('approve')}
                    disabled={moderateStoryMutation.isPending}
                    className="flex-1"
                    data-testid="button-approve"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleModeration('flag')}
                    disabled={moderateStoryMutation.isPending}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-flag"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Flag for Review
                  </Button>
                  <Button
                    onClick={() => handleModeration('reject')}
                    disabled={moderateStoryMutation.isPending}
                    variant="destructive"
                    className="flex-1"
                    data-testid="button-reject"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card data-testid="no-story-selected">
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select a Story to Review</h3>
                  <p>Choose a pending story from the list to begin moderation</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}