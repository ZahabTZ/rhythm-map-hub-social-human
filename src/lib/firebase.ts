// Google Cloud Console OAuth authentication setup
declare global {
  interface Window {
    google: any;
    googleAuth: any;
  }
}

let isGoogleApiLoaded = false;
let authInstance: any = null;

// Load Google API
export function loadGoogleApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isGoogleApiLoaded && window.google && window.google.accounts) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      isGoogleApiLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Initialize Google OAuth
export async function initializeGoogleAuth() {
  await loadGoogleApi();
  
  if (!window.google) {
    throw new Error('Google API not loaded');
  }

  window.google.accounts.id.initialize({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
  });
}

// Handle Google credential response
function handleCredentialResponse(response: any) {
  const credential = response.credential;
  // Decode JWT token to get user info
  const payload = JSON.parse(atob(credential.split('.')[1]));
  
  // Store user info and trigger auth state change
  const userInfo = {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    googleId: payload.sub,
  };
  
  localStorage.setItem('googleUser', JSON.stringify(userInfo));
  localStorage.setItem('googleToken', credential);
  
  // Trigger custom auth state change event
  window.dispatchEvent(new CustomEvent('authStateChange', { detail: userInfo }));
}

// Sign in with Google
export function signInWithGoogle() {
  if (!window.google) {
    throw new Error('Google API not initialized');
  }
  
  window.google.accounts.id.prompt();
}

// Sign out
export function signOutUser() {
  localStorage.removeItem('googleUser');
  localStorage.removeItem('googleToken');
  
  if (window.google && window.google.accounts) {
    window.google.accounts.id.disableAutoSelect();
  }
  
  // Trigger custom auth state change event
  window.dispatchEvent(new CustomEvent('authStateChange', { detail: null }));
}

// Get current user
export function getCurrentUser() {
  const userStr = localStorage.getItem('googleUser');
  return userStr ? JSON.parse(userStr) : null;
}

// Get current token
export function getCurrentToken() {
  return localStorage.getItem('googleToken');
}

// Auth state listener
export function onAuthStateChange(callback: (user: any) => void) {
  // Initial call with current user
  const currentUser = getCurrentUser();
  callback(currentUser);
  
  // Listen for auth state changes
  const handleAuthChange = (event: any) => {
    callback(event.detail);
  };
  
  window.addEventListener('authStateChange', handleAuthChange);
  
  // Return unsubscribe function
  return () => {
    window.removeEventListener('authStateChange', handleAuthChange);
  };
}