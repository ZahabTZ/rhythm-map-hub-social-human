import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useLocationVerification } from '@/hooks/useLocationVerification';
import { Crisis } from '../../shared/schema';

interface LocationVerificationProps {
  crisis: Crisis;
  onVerificationComplete: (isVerified: boolean, userLocation?: { lat: number; lng: number }) => void;
  className?: string;
}

export const LocationVerification = ({ 
  crisis, 
  onVerificationComplete, 
  className = '' 
}: LocationVerificationProps) => {
  const {
    isLoading,
    userLocation,
    verificationResult,
    error,
    hasPermission,
    requestLocationPermission,
    getCurrentLocation,
    verifyLocationWithinCrisis,
    clearError,
  } = useLocationVerification();

  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'checking' | 'verified' | 'failed'>('idle');

  useEffect(() => {
    if (verificationResult) {
      const status = verificationResult.isWithinRange ? 'verified' : 'failed';
      setVerificationStatus(status);
      onVerificationComplete(
        verificationResult.isWithinRange,
        userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined
      );
    }
  }, [verificationResult, userLocation, onVerificationComplete]);

  const handleVerifyLocation = async () => {
    setVerificationStatus('checking');
    clearError();

    // Directly verify location - this will prompt for permission if needed
    const result = await verifyLocationWithinCrisis(crisis);
    if (!result) {
      setVerificationStatus('failed');
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <MapPin className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'checking':
        return <Badge variant="outline" className="bg-blue-50">Verifying...</Badge>;
      case 'verified':
        return <Badge variant="default" className="bg-green-100 text-green-800">Location Verified</Badge>;
      case 'failed':
        return <Badge variant="destructive">Location Not Verified</Badge>;
      default:
        return <Badge variant="outline">Not Verified</Badge>;
    }
  };

  return (
    <Card className={className} data-testid="location-verification-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getStatusIcon()}
          Location Verification
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>To submit a story about <strong>{crisis.name}</strong>, you must be within the crisis area.</p>
          <p className="mt-1">Crisis location: {crisis.location.name}</p>
        </div>

        {error && (
          <Alert variant="destructive" data-testid="location-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {verificationResult && !verificationResult.isWithinRange && (
          <Alert variant="destructive" data-testid="location-out-of-range">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              You are {verificationResult.distance.toFixed(1)}km away from the crisis area. 
              You must be within {verificationResult.maxDistance}km to submit a story.
            </AlertDescription>
          </Alert>
        )}

        {verificationResult && verificationResult.isWithinRange && (
          <Alert variant="default" className="border-green-200 bg-green-50" data-testid="location-verified">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Location verified! You are {verificationResult.distance.toFixed(1)}km from the crisis area.
            </AlertDescription>
          </Alert>
        )}

        {userLocation && (
          <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded">
            <p>Your coordinates: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
            <p>Accuracy: ±{userLocation.accuracy.toFixed(0)}m</p>
          </div>
        )}

        <div className="flex gap-2">
          {verificationStatus === 'idle' || verificationStatus === 'failed' ? (
            <Button 
              onClick={handleVerifyLocation}
              disabled={isLoading}
              className="flex items-center gap-2"
              data-testid="button-verify-location"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              {verificationStatus === 'failed' ? 'Try Again' : 'Verify Location'}
            </Button>
          ) : null}

          {error && (
            <Button 
              variant="outline" 
              onClick={clearError}
              data-testid="button-clear-error"
            >
              Clear Error
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>💡 Make sure location services are enabled in your browser and device settings.</p>
        </div>
      </CardContent>
    </Card>
  );
};