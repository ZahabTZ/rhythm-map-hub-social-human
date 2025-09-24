import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Hash, Users, Pin, Settings, Globe, User, MapPin, MessageSquare, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ThreadNav from '@/components/ThreadNav';
import MessageList from '@/components/MessageList';
import MessageInput from '@/components/MessageInput';

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

const CommunityChat: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeThread, setActiveThread] = useState<'intro' | 'content' | 'faq'>('intro');
  const [isLocalMode, setIsLocalMode] = useState(false);

  // Get community data from URL params or default
  const [community] = useState<CommunityData>({
    id: searchParams.get('id') || '1',
    name: searchParams.get('name') || 'Castro Neighborhood Association',
    type_detail: searchParams.get('type') || 'Community Group',
    location: searchParams.get('location') || 'Castro District, San Francisco',
    category: searchParams.get('category') || 'Neighborhood',
    members: parseInt(searchParams.get('members') || '2847'),
    image: searchParams.get('image') || '/api/placeholder/80/80',
    description: searchParams.get('description') || 'Dedicated to preserving the character and community spirit of the Castro District'
  });

  const [messages, setMessages] = useState<{ [key: string]: any[] }>({
    intro: [
      {
        id: '1',
        author: 'Sarah Chen',
        avatar: '/api/placeholder/32/32',
        content: `Welcome everyone to the ${community.name}! 👋`,
        timestamp: '2024-08-10T09:00:00Z',
        pinned: true,
        isLocal: true
      },
      {
        id: '2',
        author: 'Mike Rodriguez',
        avatar: '/api/placeholder/32/32',
        content: 'Great to be here! Looking forward to getting involved in the community.',
        timestamp: '2024-08-10T09:15:00Z',
        isLocal: true
      },
      {
        id: '3',
        author: 'Emma Walsh',
        avatar: '/api/placeholder/32/32',
        content: 'Does anyone know when the next neighborhood cleanup is scheduled?',
        timestamp: '2024-08-10T10:30:00Z',
        isLocal: false
      }
    ],
    content: [
      {
        id: '4',
        author: 'David Kim',
        avatar: '/api/placeholder/32/32',
        content: 'Here\'s the agenda for next week\'s meeting: 1. Park renovation updates 2. New crosswalk proposal 3. Community garden expansion',
        timestamp: '2024-08-10T08:00:00Z',
        pinned: true,
        isLocal: true
      },
      {
        id: '5',
        author: 'Lisa Johnson',
        avatar: '/api/placeholder/32/32',
        content: 'The new mural on 18th Street looks amazing! Thanks to everyone who participated.',
        timestamp: '2024-08-10T11:00:00Z',
        isLocal: false
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
        isBot: true,
        isLocal: true
      },
      {
        id: '7',
        author: 'Community Bot',
        avatar: '/api/placeholder/32/32',
        content: '**How can I get involved?** Check our events calendar and volunteer for committees that interest you!',
        timestamp: '2024-08-01T00:01:00Z',
        pinned: true,
        isBot: true,
        isLocal: true
      },
      {
        id: '8',
        author: 'Alex Thompson',
        avatar: '/api/placeholder/32/32',
        content: 'Is there a WhatsApp group for urgent updates?',
        timestamp: '2024-08-10T12:00:00Z',
        isLocal: false
      }
    ]
  });

  const handleSendMessage = (content: string) => {
    const newMessage = {
      id: Date.now().toString(),
      author: 'You',
      avatar: '/api/placeholder/32/32',
      content,
      timestamp: new Date().toISOString(),
      isLocal: isLocalMode
    };

    setMessages(prev => ({
      ...prev,
      [activeThread]: [...prev[activeThread], newMessage]
    }));
  };

  // Filter messages based on local mode
  const filteredMessages = isLocalMode 
    ? messages[activeThread].filter(msg => msg.isLocal)
    : messages[activeThread];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={community.image} />
                <AvatarFallback className="bg-communities/20 text-communities">
                  <Users className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="text-lg font-semibold">{community.name}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {community.location}
                  <span>•</span>
                  <Users className="h-3 w-3" />
                  {community.members.toLocaleString()} members
                </div>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3">
              {/* Local/Global Toggle */}
              <div className="flex items-center bg-muted/50 rounded-full p-1">
                <button
                  onClick={() => setIsLocalMode(false)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    !isLocalMode 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid="button-global-mode"
                >
                  <Globe className="h-3 w-3" />
                  Global
                </button>
                <button
                  onClick={() => setIsLocalMode(true)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    isLocalMode 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid="button-local-mode"
                >
                  <User className="h-3 w-3" />
                  Local
                </button>
              </div>

              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Community Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 h-full">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-sm text-muted-foreground">{community.description}</p>
                </div>
                
                <div>
                  <Badge variant="outline" className="text-xs">
                    {community.category}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Community Type</h4>
                  <p className="text-sm text-muted-foreground">{community.type_detail}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              {/* Thread Navigation */}
              <div className="border-b p-4">
                <ThreadNav
                  threads={[
                    { id: 'intro', label: 'Introductions', icon: Users, count: messages.intro.length },
                    { id: 'content', label: 'General Discussion', icon: MessageSquare, count: messages.content.length },
                    { id: 'faq', label: 'FAQ & Help', icon: HelpCircle, count: messages.faq.length }
                  ]}
                  activeThread={activeThread}
                  onThreadChange={setActiveThread}
                />
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-hidden">
                <MessageList
                  messages={filteredMessages}
                />
              </div>

              {/* Message Input */}
              <div className="border-t">
                <MessageInput 
                  onSendMessage={handleSendMessage}
                  threadName={activeThread}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityChat;