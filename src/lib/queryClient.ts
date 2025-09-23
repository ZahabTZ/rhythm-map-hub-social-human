import { QueryClient } from '@tanstack/react-query';
import { getModeratorHeaders } from './auth';

// Default fetcher for React Query (for GET requests)
export const defaultQueryFn = async ({ queryKey }: any) => {
  const [url] = queryKey;
  return apiRequest(url);
};

// Create a query client with default configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      queryFn: defaultQueryFn,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Utility function for making API requests
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  // Handle URL construction - don't double-prefix /api
  let url: string;
  if (endpoint.startsWith('http')) {
    url = endpoint;
  } else if (endpoint.startsWith('/api/')) {
    url = endpoint; // Already has /api prefix
  } else {
    url = `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...getModeratorHeaders(), // Always include auth headers if available
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Handle empty responses (like 204 No Content)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
}