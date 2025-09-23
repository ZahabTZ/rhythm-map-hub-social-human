import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange, signInWithGoogle, signOutUser, handleRedirect } from '@/lib/firebase';
import type { User } from '../../shared/schema';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  isVerifiedHost: boolean;
  signIn: () => void;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data from our backend
  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      const userData = await fetchUserData(firebaseUser);
      setUser(userData);
    }
  };

  useEffect(() => {
    // Handle redirect result on page load
    handleRedirect().then((result) => {
      if (result?.user) {
        // Successfully signed in via redirect
        console.log('Redirect sign-in successful');
      }
    }).catch((error) => {
      console.error('Redirect sign-in error:', error);
    });

    // Listen for auth state changes
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        const userData = await fetchUserData(firebaseUser);
        setUser(userData);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = () => {
    signInWithGoogle();
  };

  const signOut = async () => {
    await signOutUser();
    setUser(null);
    setFirebaseUser(null);
  };

  const isVerifiedHost = user?.isVerifiedHost && 
    user?.verifiedHostExpiresAt && 
    new Date(user.verifiedHostExpiresAt) > new Date();

  const value = {
    firebaseUser,
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