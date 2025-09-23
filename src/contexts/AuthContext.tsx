import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChange, signInWithGoogle, signOutUser, initializeGoogleAuth, getCurrentToken } from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '../../shared/schema';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  googleId: string;
}

interface AuthContextType {
  googleUser: GoogleUser | null;
  user: User | null;
  loading: boolean;
  isVerifiedHost: boolean;
  signIn: () => void;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from our backend
  const fetchUserData = async (googleUser: GoogleUser): Promise<User | null> => {
    try {
      const token = getCurrentToken();
      const userData = await apiRequest('/api/auth/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    if (googleUser) {
      const userData = await fetchUserData(googleUser);
      setUser(userData);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Initialize Google Auth
    initializeGoogleAuth().catch((error) => {
      console.error('Failed to initialize Google Auth:', error);
    });

    // Listen for auth state changes
    const unsubscribe = onAuthStateChange(async (googleUser) => {
      if (!isMounted) return;
      
      setGoogleUser(googleUser);
      
      if (googleUser) {
        const userData = await fetchUserData(googleUser);
        if (isMounted) {
          setUser(userData);
        }
      } else {
        if (isMounted) {
          setUser(null);
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = () => {
    signInWithGoogle();
  };

  const signOut = async () => {
    signOutUser();
    setUser(null);
    setGoogleUser(null);
  };

  const isVerifiedHost = user?.isVerifiedHost && 
    user?.verifiedHostExpiresAt && 
    new Date(user.verifiedHostExpiresAt) > new Date();

  const value = {
    googleUser,
    user,
    loading,
    isVerifiedHost,
    signIn,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}