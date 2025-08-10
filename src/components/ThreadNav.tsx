import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface Thread {
  id: 'intro' | 'content' | 'faq';
  label: string;
  icon: LucideIcon;
  count: number;
}

interface ThreadNavProps {
  threads: Thread[];
  activeThread: 'intro' | 'content' | 'faq';
  onThreadChange: (thread: 'intro' | 'content' | 'faq') => void;
}

const ThreadNav: React.FC<ThreadNavProps> = ({ threads, activeThread, onThreadChange }) => {
  return (
    <div className="flex-1 p-2 space-y-1">
      {threads.map((thread) => {
        const Icon = thread.icon;
        return (
          <Button
            key={thread.id}
            variant={activeThread === thread.id ? "secondary" : "ghost"}
            className="w-full justify-start h-auto p-3"
            onClick={() => onThreadChange(thread.id)}
          >
            <div className="flex items-center gap-3 w-full">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">{thread.label}</div>
              </div>
              <Badge 
                variant="outline" 
                className="text-xs h-5 px-2"
              >
                {thread.count}
              </Badge>
            </div>
          </Button>
        );
      })}
    </div>
  );
};

export default ThreadNav;