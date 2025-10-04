import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Globe, MessageSquare, MapPin, Loader2 } from 'lucide-react';

const Join = () => {
  const navigate = useNavigate();
  const { googleUser, signIn, loading } = useAuth();

  useEffect(() => {
    if (googleUser) {
      navigate('/create-community');
    }
  }, [googleUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join Our Community</CardTitle>
          <CardDescription>
            Connect with others and make a difference in your local area
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Create Your Community</h3>
                <p className="text-sm text-muted-foreground">
                  Build and manage your own community with up to 500 members
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 rounded-full bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Engage in Real-Time Chat</h3>
                <p className="text-sm text-muted-foreground">
                  Connect through threaded discussions and stay informed
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 rounded-full bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Set Your Geographic Scope</h3>
                <p className="text-sm text-muted-foreground">
                  Choose from neighborhood to global reach for your community
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 rounded-full bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Access Crisis Response Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Support humanitarian efforts and share important stories
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={signIn} 
            className="w-full" 
            size="lg"
            data-testid="button-join-signin"
          >
            Sign in with Google to Get Started
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to create one community per account
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Join;
