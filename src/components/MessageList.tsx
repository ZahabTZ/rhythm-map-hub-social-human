import React, { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Pin, Bot } from 'lucide-react';

interface Message {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  pinned?: boolean;
  isBot?: boolean;
}

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatMessageContent = (content: string) => {
    // Simple markdown-like formatting for bold text
    return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {messages.map((message) => (
        <div key={message.id} className="flex gap-3">
          <Avatar className="h-8 w-8 mt-1">
            <AvatarImage src={message.avatar} />
            <AvatarFallback className="text-xs">
              {message.isBot ? <Bot className="h-4 w-4" /> : message.author.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">
                {message.author}
              </span>
              {message.isBot && (
                <Badge variant="outline" className="text-xs h-4 px-1">
                  Bot
                </Badge>
              )}
              {message.pinned && (
                <Pin className="h-3 w-3 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {formatTime(message.timestamp)}
              </span>
            </div>
            
            <div 
              className={`text-sm ${
                message.pinned 
                  ? 'bg-muted/50 border border-muted rounded-md p-3' 
                  : ''
              }`}
              dangerouslySetInnerHTML={{ 
                __html: formatMessageContent(message.content) 
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;