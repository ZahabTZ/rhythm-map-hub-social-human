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
      <CardContent className="p-4 space-y-2">
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
        <p className="text-xs text-muted-foreground">
          Help us connect communities and local businesses. Every contribution makes a difference! ✨
        </p>

        {/* Amount Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium">Amount ($5 minimum)</label>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
              onClick={handleSend}
              data-testid="button-buy-coffee"
            >
              <Coffee className="h-3 w-3 mr-1" />
              Buy us a coffee ☕
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">$</span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(5, parseInt(e.target.value) || 5))}
              min={5}
              className="flex-1 h-8"
              data-testid="input-amount"
            />
          </div>
        </div>

        {/* Contact and Message Combined */}
        <div className="space-y-1">
          <Input
            type="text"
            placeholder="Email/Phone (optional)"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="h-8"
            data-testid="input-contact"
          />
          <div className="relative">
            <Textarea
              placeholder="Leave a message (optional)..."
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 200))}
              className="min-h-[40px] resize-none text-xs"
              data-testid="textarea-message"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                {message.length}/200
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSend}
                className="flex items-center gap-1 h-6 px-2"
                data-testid="button-send"
              >
                <Send className="h-3 w-3" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupportCard;