import React, { useState, useRef, useEffect } from 'react';
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
  Info,
  X
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import type { DirectMessage } from '../../shared/schema';

interface Conversation {
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  community?: string;
  isOnline: boolean;
}

interface DirectMessagingProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  selectedUserId?: string;
  selectedUserName?: string;
}

const DirectMessaging: React.FC<DirectMessagingProps> = ({
  isOpen,
  onClose,
  currentUserId,
  currentUserName,
  selectedUserId,
  selectedUserName
}) => {
  const [activeConversation, setActiveConversation] = useState<string | null>(selectedUserId || null);
  const [activeUserName, setActiveUserName] = useState<string | null>(selectedUserName || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user conversations
  const { data: conversations = [] } = useQuery<DirectMessage[]>({
    queryKey: ['/api/dm/conversations', currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/dm/conversations/${currentUserId}`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    },
    enabled: isOpen,
    refetchInterval: 5000,
  });

  // Fetch messages for active conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<DirectMessage[]>({
    queryKey: ['/api/dm/between', currentUserId, activeConversation],
    queryFn: async () => {
      if (!activeConversation) return [];
      const response = await fetch(`/api/dm/between/${currentUserId}/${activeConversation}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: isOpen && !!activeConversation,
    refetchInterval: 2000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await fetch('/api/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dm/between', currentUserId, activeConversation] });
      queryClient.invalidateQueries({ queryKey: ['/api/dm/conversations', currentUserId] });
      setMessageInput('');
    },
  });

  // Generate conversation list from conversations data
  const conversationList: Conversation[] = React.useMemo(() => {
    const conversationMap = new Map<string, Conversation>();
    
    conversations.forEach(msg => {
      const otherUserId = msg.senderId === currentUserId ? msg.recipientId : msg.senderId;
      const otherUserName = msg.senderId === currentUserId ? msg.recipientName || 'User' : msg.senderName;
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          userName: otherUserName,
          lastMessage: msg.content,
          lastMessageTime: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unreadCount: msg.isRead ? 0 : 1,
          isOnline: Math.random() > 0.5 // Mock online status
        });
      }
    });

    return Array.from(conversationMap.values());
  }, [conversations, currentUserId]);

  const filteredConversations = conversationList.filter(conv =>
    conv.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentConversation = activeConversation 
    ? conversationList.find(c => c.userId === activeConversation)
    : null;

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
    if (!messageInput.trim() || !activeConversation || sendMessageMutation.isPending) return;

    const conversationId = [currentUserId, activeConversation].sort().join('_');
    
    const messageData = {
      conversationId,
      senderId: currentUserId,
      recipientId: activeConversation,
      senderName: currentUserName,
      recipientName: activeUserName,
      content: messageInput.trim(),
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedUserId && selectedUserName) {
      setActiveConversation(selectedUserId);
      setActiveUserName(selectedUserName);
    }
  }, [selectedUserId, selectedUserName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[600px] bg-gray-900 border-gray-700 flex">{/* Rest of component */}
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-700">
          <CardTitle className="text-white">Messages</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-dm">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 flex p-0 overflow-hidden">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold text-white mb-2">Conversations</h3>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white"
                  data-testid="input-search-conversations"
                />
              </div>
            </div>
        
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8" data-testid="text-no-conversations">
                    <MessageCircle className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No conversations yet</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Start a conversation by clicking on someone's name in the topic chat
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.userId}
                      className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                        activeConversation === conversation.userId 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        setActiveConversation(conversation.userId);
                        setActiveUserName(conversation.userName);
                      }}
                      data-testid={`conversation-${conversation.userId}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gray-600 text-white text-xs">
                            {conversation.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">{conversation.userName}</p>
                            <span className="text-xs opacity-75">{conversation.lastMessageTime}</span>
                          </div>
                          <p className="text-xs opacity-75 truncate">{conversation.lastMessage}</p>
                        </div>
                        
                        {conversation.unreadCount > 0 && (
                          <div className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {conversation.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
      </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-700 bg-gray-800">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gray-600 text-white text-sm">
                        {activeUserName?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-white">{activeUserName}</h3>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messagesLoading ? (
                      <div className="text-center py-12" data-testid="text-loading-messages">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-gray-400 text-sm">Loading messages...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12" data-testid="text-no-messages">
                        <p className="text-gray-400 text-sm">No messages yet</p>
                        <p className="text-gray-500 text-xs mt-1">Send the first message!</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                          data-testid={`message-${message.id}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderId === currentUserId
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-100'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-75 mt-1">
                              {new Date(message.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Message ${activeUserName}...`}
                      className="flex-1 bg-gray-800 border-gray-600 text-white"
                      data-testid="input-dm-message"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sendMessageMutation.isPending}
                      data-testid="button-send-dm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center" data-testid="text-select-conversation">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">Select a conversation</h3>
                  <p className="text-gray-500">Choose a conversation from the left to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectMessaging;