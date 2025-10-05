import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Twitter, Instagram, Linkedin, Facebook, Youtube, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User, SocialProfile } from '../../shared/schema';

interface SocialProfilesProps {
  user: User;
}

const SOCIAL_PLATFORMS = [
  { value: 'twitter', label: 'Twitter/X', icon: Twitter },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'tiktok', label: 'TikTok', icon: null },
];

export function SocialProfiles({ user }: SocialProfilesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState('');
  const [username, setUsername] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addProfileMutation = useMutation({
    mutationFn: async (data: { platform: string; username: string; profileUrl: string }) => {
      return await apiRequest('/api/user/social-profiles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setIsOpen(false);
      setPlatform('');
      setUsername('');
      setProfileUrl('');
      toast({
        title: 'Social profile added',
        description: 'Your social profile has been connected successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add social profile',
        variant: 'destructive',
      });
    },
  });

  const removeProfileMutation = useMutation({
    mutationFn: async (platformToRemove: string) => {
      return await apiRequest(`/api/user/social-profiles/${platformToRemove}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: 'Social profile removed',
        description: 'Your social profile has been disconnected',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove social profile',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform || !username) return;
    
    addProfileMutation.mutate({ platform, username, profileUrl });
  };

  const getSocialIcon = (platformName: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.value === platformName);
    if (!platform || !platform.icon) return null;
    const Icon = platform.icon;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Connected Accounts</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" data-testid="button-add-social">
              <Plus className="h-3 w-3 mr-1" />
              Add Social
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Social Account</DialogTitle>
              <DialogDescription>
                Add your social media profiles to show on your communities
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select value={platform} onValueChange={setPlatform} required>
                  <SelectTrigger id="platform" data-testid="select-platform">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOCIAL_PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="username">Username/Handle</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@username"
                  required
                  data-testid="input-username"
                />
              </div>
              <div>
                <Label htmlFor="profileUrl">Profile URL (optional)</Label>
                <Input
                  id="profileUrl"
                  type="url"
                  value={profileUrl}
                  onChange={(e) => setProfileUrl(e.target.value)}
                  placeholder="https://..."
                  data-testid="input-profile-url"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={addProfileMutation.isPending}
                data-testid="button-submit-social"
              >
                {addProfileMutation.isPending ? 'Connecting...' : 'Connect Account'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {user.socialProfiles && user.socialProfiles.length > 0 ? (
        <div className="space-y-2">
          {user.socialProfiles.map((profile) => (
            <div
              key={profile.platform}
              className="flex items-center justify-between p-2 rounded-md border bg-muted/50"
              data-testid={`social-profile-${profile.platform}`}
            >
              <div className="flex items-center gap-2">
                {getSocialIcon(profile.platform)}
                <div>
                  <p className="text-sm font-medium capitalize">{profile.platform}</p>
                  <p className="text-xs text-muted-foreground">{profile.username}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeProfileMutation.mutate(profile.platform)}
                disabled={removeProfileMutation.isPending}
                data-testid={`button-remove-${profile.platform}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No social accounts connected yet
        </p>
      )}
    </div>
  );
}
