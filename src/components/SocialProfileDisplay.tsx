import { Twitter, Instagram, Linkedin, Facebook, Youtube, ExternalLink } from 'lucide-react';
import type { SocialProfile } from '../../shared/schema';
import { Button } from '@/components/ui/button';

interface SocialProfileDisplayProps {
  profiles: SocialProfile[];
  size?: 'sm' | 'md';
}

const SOCIAL_ICONS: Record<string, any> = {
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: null,
};

export function SocialProfileDisplay({ profiles, size = 'md' }: SocialProfileDisplayProps) {
  if (!profiles || profiles.length === 0) {
    return null;
  }

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const buttonSize = size === 'sm' ? 'sm' : 'default';

  return (
    <div className="flex flex-wrap gap-1">
      {profiles.map((profile) => {
        const Icon = SOCIAL_ICONS[profile.platform];
        const url = profile.profileUrl || '#';
        
        return (
          <Button
            key={profile.platform}
            variant="outline"
            size="sm"
            className={size === 'sm' ? 'h-7 px-2' : 'h-8 px-3'}
            onClick={() => url !== '#' && window.open(url, '_blank')}
            title={`${profile.displayName || profile.username || ''} on ${profile.platform}`}
            data-testid={`social-link-${profile.platform}`}
          >
            {Icon && <Icon className={iconSize} />}
            {!Icon && (
              <span className="text-xs font-medium uppercase">{profile.platform[0]}</span>
            )}
            {size === 'md' && profile.username && (
              <span className="ml-1 text-xs">{profile.username}</span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
