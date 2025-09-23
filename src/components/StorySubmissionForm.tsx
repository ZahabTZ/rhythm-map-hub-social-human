import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LocationVerification } from './LocationVerification';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Image as ImageIcon, Send, CheckCircle } from 'lucide-react';
import { Crisis, InsertStorySchema } from '../../shared/schema';

// Form validation schema based on InsertStorySchema but with file handling
const StoryFormSchema = InsertStorySchema.omit({ 
  images: true, 
  location: true,
  isLocationVerified: true 
}).extend({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title too long"),
  content: z.string().min(20, "Content must be at least 20 characters").max(5000, "Content too long"),
  author: z.string().min(2, "Author name must be at least 2 characters"),
});

type StoryFormData = z.infer<typeof StoryFormSchema>;

interface StorySubmissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  crisis: Crisis;
  onSubmissionSuccess?: () => void;
}

export const StorySubmissionForm = ({ 
  isOpen, 
  onClose, 
  crisis, 
  onSubmissionSuccess 
}: StorySubmissionFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success'>('idle');

  const form = useForm<StoryFormData>({
    resolver: zodResolver(StoryFormSchema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      author: '',
    },
  });

  const handleLocationVerification = useCallback((isVerified: boolean, location?: { lat: number; lng: number }) => {
    setIsLocationVerified(isVerified);
    if (location) {
      setUserLocation(location);
    }
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        return false;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: `${file.name} is larger than 5MB`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (images.length + validFiles.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 5 images",
        variant: "destructive",
      });
      return;
    }

    setImages(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreviews(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: StoryFormData) => {
    if (!isLocationVerified || !userLocation) {
      toast({
        title: "Location not verified",
        description: "Please verify your location before submitting your story",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create story data matching InsertStorySchema
      const storyData = {
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || data.content.substring(0, 300),
        author: data.author,
        images: imagePreviews, // Use the data URLs we already generated
        location: {
          lat: userLocation.lat,
          lng: userLocation.lng,
          name: crisis.location.name,
          crisisId: crisis.id,
        },
      };

      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit story');
      }

      const story = await response.json();
      
      setSubmissionStatus('success');
      toast({
        title: "Story submitted successfully!",
        description: "Your story has been submitted for review and will be published once approved.",
      });

      // Reset form after short delay
      setTimeout(() => {
        form.reset();
        setImages([]);
        setImagePreviews([]);
        setIsLocationVerified(false);
        setUserLocation(null);
        setSubmissionStatus('idle');
        onSubmissionSuccess?.();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error submitting story:', error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    
    form.reset();
    setImages([]);
    setImagePreviews([]);
    setIsLocationVerified(false);
    setUserLocation(null);
    setSubmissionStatus('idle');
    onClose();
  };

  if (submissionStatus === 'success') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md" data-testid="story-success-dialog">
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Story Submitted!</h3>
            <p className="text-muted-foreground mb-4">
              Your story has been submitted for review and will be published once approved by our moderation team.
            </p>
            <Badge variant="outline" className="bg-blue-50">Under Review</Badge>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="story-submission-dialog">
        <DialogHeader>
          <DialogTitle>Submit Your Story - {crisis.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Location Verification */}
          <LocationVerification 
            crisis={crisis}
            onVerificationComplete={handleLocationVerification}
          />

          {/* Story Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Story Title *</Label>
              <Input
                id="title"
                data-testid="input-story-title"
                placeholder="Enter a compelling title for your story"
                {...form.register('title')}
                className="mt-1"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>

            {/* Author */}
            <div>
              <Label htmlFor="author">Your Name *</Label>
              <Input
                id="author"
                data-testid="input-story-author"
                placeholder="How should we credit you?"
                {...form.register('author')}
                className="mt-1"
              />
              {form.formState.errors.author && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.author.message}</p>
              )}
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content">Your Story *</Label>
              <Textarea
                id="content"
                data-testid="textarea-story-content"
                placeholder="Share your experience, observations, or message of hope..."
                {...form.register('content')}
                className="mt-1 min-h-[150px]"
              />
              {form.formState.errors.content && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.content.message}</p>
              )}
            </div>

            {/* Excerpt */}
            <div>
              <Label htmlFor="excerpt">Short Summary (Optional)</Label>
              <Textarea
                id="excerpt"
                data-testid="textarea-story-excerpt"
                placeholder="A brief summary that will be shown in the story preview"
                {...form.register('excerpt')}
                className="mt-1 h-20"
                maxLength={300}
              />
              {form.formState.errors.excerpt && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.excerpt.message}</p>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <Label>Images (Optional)</Label>
              <div className="mt-1">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  data-testid="input-story-images"
                />
                <Label
                  htmlFor="image-upload"
                  className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
                >
                  <div className="text-center">
                    <Upload className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Upload images (Max 5 files, 5MB each)
                    </span>
                  </div>
                </Label>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                  {imagePreviews.map((preview, index) => (
                    <Card key={index} className="relative">
                      <CardContent className="p-2">
                        <img 
                          src={preview} 
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => removeImage(index)}
                          data-testid={`button-remove-image-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Guidelines */}
            <Alert>
              <ImageIcon className="h-4 w-4" />
              <AlertDescription>
                <strong>Story Guidelines:</strong> Share authentic experiences and messages of hope. 
                Content will be reviewed before publication to ensure it meets community standards. 
                Offensive or inappropriate content will not be approved.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
                data-testid="button-cancel-story"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!isLocationVerified || isSubmitting}
                data-testid="button-submit-story"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Story
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};