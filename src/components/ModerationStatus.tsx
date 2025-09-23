import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Clock, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { checkModeratorAccess } from '../lib/auth';
import type { Story } from '../../shared/schema';

export function ModerationStatus() {
  const { data: pendingStories = [] } = useQuery<Story[]>({
    queryKey: ['/api/stories/pending'],
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: checkModeratorAccess(), // Only query if authenticated
  });

  if (pendingStories.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link 
        to="/moderation" 
        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-yellow-950 px-3 py-2 rounded-lg shadow-lg transition-colors"
        data-testid="moderation-status-badge"
      >
        <Shield className="h-4 w-4" />
        <span className="text-sm font-medium">
          {pendingStories.length} stories need review
        </span>
        <Badge variant="secondary" className="ml-1">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      </Link>
    </div>
  );
}