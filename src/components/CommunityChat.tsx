import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Users, 
  Globe,
  Building,
  Home,
  Navigation,
  Flag,
  MessageSquare,
  UserPlus,
  Settings,
  ArrowLeft,
  HelpCircle,
  Hash,
  MapPin
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import ThreadNav from '@/components/ThreadNav';
import type { ChatMessage } from '../../shared/schema';

interface CommunityUser {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  location?: {
    region: 'neighborhood' | 'city' | 'state' | 'national' | 'global';
    name: string;
  };
}

interface CommunityChatProps {
  communityId: string;
  communityName: string;
  currentUserId: string;
  currentUserName: string;
  onOpenDM?: (userId: string, userName: string) => void;
  onClose?: () => void;
}

const CommunityChat: React.FC<CommunityChatProps> = ({
  communityId,
  communityName,
  currentUserId,
  currentUserName,
  onOpenDM,
  onClose
}) => {
  const [selectedRegion, setSelectedRegion] = useState<'neighborhood' | 'city' | 'state' | 'national' | 'global'>('global');
  const [newMessage, setNewMessage] = useState('');
  const [activeThread, setActiveThread] = useState<'intro' | 'content' | 'faq'>('content');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Thread definitions for the community
  const threads = [
    {
      id: 'intro' as const,
      label: 'Introductions',
      icon: UserPlus,
      count: 3
    },
    {
      id: 'content' as const,
      label: 'General Discussion',
      icon: Hash,
      count: 2
    },
    {
      id: 'faq' as const,
      label: 'FAQ & Help',
      icon: HelpCircle,
      count: 3
    }
  ];

  // Fetch chat messages with React Query
  const { data: messages = [], isLoading, refetch } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat', communityId, selectedRegion, activeThread],
    queryFn: async () => {
      const response = await fetch(`/api/chat/${communityId}?region=${selectedRegion}&thread=${activeThread}`);
      if (!response.ok) throw new Error('Failed to fetch chat messages');
      return response.json();
    },
    refetchInterval: 3000, // Poll every 3 seconds for near-real-time updates
  });
  
  // Fetch most active members
  const { data: activeMembersData = [] } = useQuery<Array<{userId: string, userName: string, messageCount: number}>>({
    queryKey: ['/api/chat', communityId, 'active-members'],
    queryFn: async () => {
      const response = await fetch(`/api/chat/${communityId}/active-members?limit=10`);
      if (!response.ok) throw new Error('Failed to fetch active members');
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch chat messages
      queryClient.invalidateQueries({ queryKey: ['/api/chat', communityId, selectedRegion, activeThread] });
      setNewMessage('');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getRegionIcon = (region: string) => {
    switch (region) {
      case 'neighborhood': return <Home className="h-4 w-4" />;
      case 'city': return <Building className="h-4 w-4" />;
      case 'state': return <Navigation className="h-4 w-4" />;
      case 'national': return <Flag className="h-4 w-4" />;
      case 'global': return <Globe className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getRegionColor = (region: string) => {
    switch (region) {
      case 'neighborhood': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'city': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'state': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'national': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'global': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || sendMessageMutation.isPending) return;

    const messageData = {
      communityId,
      region: selectedRegion,
      thread: activeThread,
      content: newMessage,
      authorId: currentUserId,
      authorName: currentUserName,
      messageType: 'text' as const,
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const handleUserClick = (userId: string, userName: string) => {
    if (userId !== currentUserId && onOpenDM) {
      onOpenDM(userId, userName);
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-30 flex flex-col">
      {/* Header */}
      {onClose && (
        <div className="border-b bg-card/95 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-chat">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-communities/20 text-communities">
                  <Users className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{communityName}</h2>
                <p className="text-sm text-muted-foreground">
                  Regional Community Chat
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 p-6">
        {/* Left Sidebar - Community Info & Threads */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">About</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-sm text-muted-foreground mb-4">
                Dedicated to preserving the character and community spirit of the Castro District.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Neighborhood</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Community Type</span>
                  <br />
                  <span className="text-muted-foreground">Community Group</span>
                </div>
              </div>
            </CardContent>
            
            <Separator />
            
            {/* Thread Navigation */}
            <ThreadNav 
              threads={threads}
              activeThread={activeThread}
              onThreadChange={setActiveThread}
            />
          </Card>
        </div>

        {/* Chat Messages Area */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{communityName}</CardTitle>
                  <Badge 
                    variant="outline" 
                    className={`${getRegionColor(selectedRegion)}`}
                    data-testid={`badge-current-region`}
                  >
                    {getRegionIcon(selectedRegion)}
                    <span className="ml-1 capitalize">{selectedRegion} Chat</span>
                  </Badge>
                </div>
                
                <Select value={selectedRegion} onValueChange={(value: any) => setSelectedRegion(value)}>
                  <SelectTrigger className="w-48" data-testid="select-chat-region">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">🌍 Global Chat</SelectItem>
                    <SelectItem value="national">🏛️ National Chat</SelectItem>
                    <SelectItem value="state">🗺️ State Chat</SelectItem>
                    <SelectItem value="city">🏢 City Chat</SelectItem>
                    <SelectItem value="neighborhood">🏠 Neighborhood Chat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-4 py-4">
                  {isLoading ? (
                    <div className="text-center py-12" data-testid="text-loading-messages">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12" data-testid="text-no-messages">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                      <p className="text-muted-foreground">
                        Be the first to start a conversation in the {selectedRegion} chat!
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="flex gap-3" data-testid={`message-${message.id}`}>
                        <Avatar 
                          className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary"
                          onClick={() => handleUserClick(message.authorId, message.authorName)}
                          data-testid={`avatar-${message.authorId}`}
                        >
                          <AvatarImage src={message.authorAvatar} />
                          <AvatarFallback className="text-xs">
                            {message.authorName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span 
                              className="font-semibold text-sm cursor-pointer hover:underline"
                              onClick={() => handleUserClick(message.authorId, message.authorName)}
                              data-testid={`name-${message.authorId}`}
                            >
                              {message.authorName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.createdAt)}
                            </span>
                            {message.authorLocation && (
                              <Badge variant="outline" className="text-xs">
                                📍 {message.authorLocation.name}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-foreground leading-relaxed">
                            {message.content}
                          </p>
                          
                          {message.reactions.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {message.reactions.map((reaction, idx) => (
                                <Button
                                  key={idx}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  data-testid={`reaction-${reaction.emoji}-${message.id}`}
                                >
                                  {reaction.emoji} 1
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Message ${threads.find(t => t.id === activeThread)?.label || 'chat'}...`}
                    className="flex-1"
                    data-testid="input-chat-message"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Members Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Most Active Members ({activeMembersData.length})
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="space-y-1 p-4">
                  {activeMembersData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm" data-testid="text-no-members">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No active members yet</p>
                      <p className="text-xs mt-1">Be the first to chat!</p>
                    </div>
                  ) : (
                    activeMembersData.map((member, index) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => handleUserClick(member.userId, member.userName)}
                        data-testid={`user-${member.userId}`}
                      >
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {member.userName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {index < 3 && (
                            <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.messageCount} message{member.messageCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        {member.userId !== currentUserId && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUserClick(member.userId, member.userName);
                            }}
                            data-testid={`button-dm-${member.userId}`}
                          >
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CommunityChat;