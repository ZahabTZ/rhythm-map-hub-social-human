import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Send, 
  Search, 
  MessageCircle, 
  User, 
  MoreVertical,
  Phone,
  Video,
  Info
} from 'lucide-react';

interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: DirectMessage;
  unreadCount: number;
  community?: string;
  isOnline: boolean;
}

interface DirectMessagingProps {
  onClose: () => void;
  initialUserId?: string;
  conversations: Conversation[];
  onSendMessage?: (conversationId: string, content: string) => void;
}

const DirectMessaging: React.FC<DirectMessagingProps> = ({ 
  onClose, 
  initialUserId, 
  conversations, 
  onSendMessage 
}) => {
  const [activeConversation, setActiveConversation] = useState<string | null>(
    initialUserId || null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');

  // Sample data for demonstration
  const sampleConversations: Conversation[] = conversations.length > 0 ? conversations : [
    {
      id: '1',
      participantId: 'sarah-chen',
      participantName: 'Sarah Chen',
      participantAvatar: '/api/placeholder/40/40',
      lastMessage: {
        id: 'msg1',
        senderId: 'sarah-chen',
        senderName: 'Sarah Chen',
        senderAvatar: '/api/placeholder/40/40',
        content: 'Hey! Are you joining the tree planting event this weekend?',
        timestamp: '2024-09-25T15:30:00Z',
        isRead: false
      },
      unreadCount: 2,
      community: 'Climate Action SF',
      isOnline: true
    },
    {
      id: '2',
      participantId: 'alex-rivera',
      participantName: 'Alex Rivera',
      participantAvatar: '/api/placeholder/40/40',
      lastMessage: {
        id: 'msg2',
        senderId: 'alex-rivera',
        senderName: 'Alex Rivera',
        senderAvatar: '/api/placeholder/40/40',
        content: 'Thanks for sharing that resource about remote work policies!',
        timestamp: '2024-09-25T12:15:00Z',
        isRead: true
      },
      unreadCount: 0,
      community: 'Global Tech Workers',
      isOnline: false
    },
    {
      id: '3',
      participantId: 'maria-santos',
      participantName: 'Maria Santos',
      participantAvatar: '/api/placeholder/40/40',
      lastMessage: {
        id: 'msg3',
        senderId: 'maria-santos',
        senderName: 'Maria Santos',
        senderAvatar: '/api/placeholder/40/40',
        content: 'The housing workshop was really informative. Let me know if you need the recording.',
        timestamp: '2024-09-24T18:45:00Z',
        isRead: true
      },
      unreadCount: 0,
      community: 'CA Housing Rights',
      isOnline: true
    }
  ];

  const sampleMessages: { [conversationId: string]: DirectMessage[] } = {
    '1': [
      {
        id: 'msg1-1',
        senderId: 'sarah-chen',
        senderName: 'Sarah Chen',
        senderAvatar: '/api/placeholder/40/40',
        content: 'Hi! I saw your comment about urban forestry in the Climate Action group.',
        timestamp: '2024-09-25T14:00:00Z',
        isRead: true
      },
      {
        id: 'msg1-2',
        senderId: 'current-user',
        senderName: 'You',
        senderAvatar: '/api/placeholder/40/40',
        content: 'Yes! I\'m really passionate about tree conservation. Have you been involved in local planting efforts?',
        timestamp: '2024-09-25T14:15:00Z',
        isRead: true
      },
      {
        id: 'msg1-3',
        senderId: 'sarah-chen',
        senderName: 'Sarah Chen',
        senderAvatar: '/api/placeholder/40/40',
        content: 'Absolutely! We have a group that meets monthly. Hey! Are you joining the tree planting event this weekend?',
        timestamp: '2024-09-25T15:30:00Z',
        isRead: false
      }
    ]
  };

  const filteredConversations = sampleConversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.community && conv.community.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentConversation = activeConversation 
    ? sampleConversations.find(c => c.id === activeConversation)
    : null;

  const currentMessages = activeConversation 
    ? sampleMessages[activeConversation] || []
    : [];

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeConversation) return;
    
    if (onSendMessage) {
      onSendMessage(activeConversation, messageInput.trim());
    }
    
    setMessageInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex">
      {/* Conversations List */}
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" data-testid="text-dm-title">Messages</h2>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-dm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-conversations"
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8" data-testid="text-no-conversations">
                <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <Button
                  key={conversation.id}
                  variant={activeConversation === conversation.id ? "secondary" : "ghost"}
                  className="w-full h-auto p-3 mb-2 justify-start"
                  onClick={() => setActiveConversation(conversation.id)}
                  data-testid={`button-conversation-${conversation.id}`}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.participantAvatar} />
                        <AvatarFallback>
                          {conversation.participantName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm truncate" data-testid={`text-participant-${conversation.id}`}>
                          {conversation.participantName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(conversation.lastMessage.timestamp)}
                        </span>
                      </div>
                      
                      {conversation.community && (
                        <div className="mb-1">
                          <Badge variant="outline" className="text-xs h-4 px-1" data-testid={`badge-community-${conversation.id}`}>
                            {conversation.community}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground truncate pr-2" data-testid={`text-last-message-${conversation.id}`}>
                          {conversation.lastMessage.content}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs h-4 px-1" data-testid={`badge-unread-${conversation.id}`}>
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={currentConversation.participantAvatar} />
                      <AvatarFallback>
                        {currentConversation.participantName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {currentConversation.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold" data-testid="text-chat-participant">
                      {currentConversation.participantName}
                    </h3>
                    {currentConversation.community && (
                      <p className="text-xs text-muted-foreground" data-testid="text-chat-community">
                        via {currentConversation.community}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" data-testid="button-voice-call">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" data-testid="button-video-call">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" data-testid="button-chat-info">
                    <Info className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" data-testid="button-chat-options">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {currentMessages.length === 0 ? (
                  <div className="text-center py-8" data-testid="text-no-messages">
                    <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Start a conversation</p>
                  </div>
                ) : (
                  currentMessages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex gap-3 ${message.senderId === 'current-user' ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${message.id}`}
                    >
                      {message.senderId !== 'current-user' && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={message.senderAvatar} />
                          <AvatarFallback className="text-xs">
                            {message.senderName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-xs lg:max-w-md ${message.senderId === 'current-user' ? 'order-first' : ''}`}>
                        <div 
                          className={`p-3 rounded-lg ${
                            message.senderId === 'current-user' 
                              ? 'bg-primary text-primary-foreground ml-auto' 
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm" data-testid={`text-message-content-${message.id}`}>
                            {message.content}
                          </p>
                        </div>
                        <p className={`text-xs text-muted-foreground mt-1 ${message.senderId === 'current-user' ? 'text-right' : 'text-left'}`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>

                      {message.senderId === 'current-user' && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={message.senderAvatar} />
                          <AvatarFallback className="text-xs">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-card">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${currentConversation.participantName}...`}
                    className="resize-none"
                    data-testid="input-message"
                  />
                </div>
                
                <Button 
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" data-testid="text-select-conversation">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessaging;