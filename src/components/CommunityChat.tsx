import React, { useState } from 'react';
import { ArrowLeft, Hash, Users, Pin, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ThreadNav from './ThreadNav';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface CommunityData {
  id: string;
  name: string;
  type_detail: string;
  location: string;
  category: string;
  members: number;
  image: string;
  description: string;
}

interface CommunityChatProps {
  community: CommunityData;
  onClose: () => void;
}

const CommunityChat: React.FC<CommunityChatProps> = ({ community, onClose }) => {
  const [activeThread, setActiveThread] = useState<'intro' | 'content' | 'faq'>('intro');
  const [messages, setMessages] = useState<{ [key: string]: any[] }>({
    intro: [
      {
        id: '1',
        author: 'Sarah Chen',
        avatar: '/api/placeholder/32/32',
        content: 'Welcome everyone to the Castro Neighborhood Association! 👋',
        timestamp: '2024-08-10T09:00:00Z',
        pinned: true
      },
      {
        id: '2',
        author: 'Mike Rodriguez',
        avatar: '/api/placeholder/32/32',
        content: 'Great to be here! Looking forward to getting involved in the community.',
        timestamp: '2024-08-10T09:15:00Z'
      },
      {
        id: '3',
        author: 'Emma Walsh',
        avatar: '/api/placeholder/32/32',
        content: 'Does anyone know when the next neighborhood cleanup is scheduled?',
        timestamp: '2024-08-10T10:30:00Z'
      }
    ],
    content: [
      {
        id: '4',
        author: 'David Kim',
        avatar: '/api/placeholder/32/32',
        content: 'Here\'s the agenda for next week\'s meeting: 1. Park renovation updates 2. New crosswalk proposal 3. Community garden expansion',
        timestamp: '2024-08-10T08:00:00Z',
        pinned: true
      },
      {
        id: '5',
        author: 'Lisa Johnson',
        avatar: '/api/placeholder/32/32',
        content: 'The new mural on 18th Street looks amazing! Thanks to everyone who participated.',
        timestamp: '2024-08-10T11:00:00Z'
      }
    ],
    faq: [
      {
        id: '6',
        author: 'Community Bot',
        avatar: '/api/placeholder/32/32',
        content: '**How often do we meet?** We meet the first Tuesday of every month at 7 PM at the Castro Community Center.',
        timestamp: '2024-08-01T00:00:00Z',
        pinned: true,
        isBot: true
      },
      {
        id: '7',
        author: 'Community Bot',
        avatar: '/api/placeholder/32/32',
        content: '**How can I get involved?** Check our events calendar and volunteer for committees that interest you!',
        timestamp: '2024-08-01T00:01:00Z',
        pinned: true,
        isBot: true
      },
      {
        id: '8',
        author: 'Alex Thompson',
        avatar: '/api/placeholder/32/32',
        content: 'Is there a WhatsApp group for urgent updates?',
        timestamp: '2024-08-10T12:00:00Z'
      }
    ]
  });

  const handleSendMessage = (content: string) => {
    const newMessage = {
      id: Date.now().toString(),
      author: 'You',
      avatar: '/api/placeholder/32/32',
      content,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => ({
      ...prev,
      [activeThread]: [...prev[activeThread], newMessage]
    }));
  };

  const threads = [
    { id: 'intro' as const, label: 'Intro', icon: Users, count: messages.intro.length },
    { id: 'content' as const, label: 'Content', icon: Hash, count: messages.content.length },
    { id: 'faq' as const, label: 'FAQ', icon: Pin, count: messages.faq.length }
  ];

  return (
    <div className="fixed inset-0 bg-background z-30 flex flex-col">
      {/* Header */}
      <div className="border-b bg-card/95 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={community.image} />
              <AvatarFallback className="bg-communities/20 text-communities">
                <Users className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{community.name}</h2>
              <p className="text-sm text-muted-foreground">
                {community.members.toLocaleString()} members • {community.location}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {community.category}
            </Badge>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with threads */}
        <div className="w-64 border-r bg-card/50 flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Threads
            </h3>
          </div>
          <ThreadNav
            threads={threads}
            activeThread={activeThread}
            onThreadChange={setActiveThread}
          />
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {/* Thread header */}
          <div className="border-b p-4 bg-card/25">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium capitalize">{activeThread}</h3>
              <Badge variant="secondary" className="text-xs">
                {messages[activeThread].length} messages
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {activeThread === 'intro' && 'Welcome new members and introduce yourself'}
              {activeThread === 'content' && 'Share community updates and announcements'}
              {activeThread === 'faq' && 'Frequently asked questions and answers'}
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden">
            <MessageList messages={messages[activeThread]} />
          </div>

          {/* Message input */}
          <div className="border-t p-4">
            <MessageInput onSendMessage={handleSendMessage} threadName={activeThread} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityChat;