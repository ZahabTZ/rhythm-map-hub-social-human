import React, { useState } from 'react';
import { Heart, X, Coffee, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

interface SupportCardProps {
  onClose: () => void;
}

const SupportCard: React.FC<SupportCardProps> = ({ onClose }) => {
  const [amount, setAmount] = useState(5);
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = () => {
    // TODO: Implement support submission logic
    console.log('Support submission:', { amount, contact, message });
    onClose();
  };

  return (
    <Card className="w-80 bg-background/95 backdrop-blur-sm border shadow-xl">
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500 fill-red-500" />
            <h3 className="font-semibold">
              Support{' '}
              <span className="text-blue-600 underline underline-offset-2">
                The Mission
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-amber-600" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 h-8 w-8"
              data-testid="button-close-support"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground">
          Help us connect communities and local businesses. Every contribution makes a difference! ✨
        </p>

        {/* Amount Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Amount ($5 minimum)</label>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
              onClick={handleSend}
              data-testid="button-buy-coffee"
            >
              <Coffee className="h-4 w-4 mr-1" />
              Buy us a coffee ☕
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">$</span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(5, parseInt(e.target.value) || 5))}
              min={5}
              className="flex-1"
              data-testid="input-amount"
            />
          </div>
        </div>

        {/* Contact Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Phone or Email (optional)</label>
          <Input
            type="text"
            placeholder="your-email@example.com or (555) 123-4567"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            data-testid="input-contact"
          />
        </div>

        {/* Message Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Leave a message (optional)</label>
          <Textarea
            placeholder="Share why you support our mission..."
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 200))}
            className="min-h-[80px] resize-none"
            data-testid="textarea-message"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {message.length}/200
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSend}
              className="flex items-center gap-1"
              data-testid="button-send"
            >
              <Send className="h-3 w-3" />
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupportCard;