# Crisis Response Community Mapping Application

## Overview
This is a React-based crisis response and community mapping application that provides an interactive map interface for connecting communities during emergencies and local events. The application was successfully imported from a GitHub repository and configured for the Replit environment.

## Current State
- ✅ Successfully imported and configured for Replit
- ✅ Dependencies installed via npm
- ✅ Vite development server configured for port 5000
- ✅ Frontend workflow configured and running
- ✅ MapBox integration working with provided API token
- ✅ Deployment configuration set up for autoscale

## Recent Changes (September 23, 2025)
- Configured Vite server to use port 5000 and host 0.0.0.0 for Replit compatibility
- Set up frontend workflow "Start application" running `npm run dev`
- Configured deployment settings for autoscale deployment target
- Verified MapBox token is properly configured in .env file

## Project Architecture
### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.4
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router DOM
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form with Zod validation
- **Map Integration**: MapBox GL JS

### Key Features
- Interactive global map with crisis/community data visualization
- Search functionality for locations and events
- Community chat system
- Crisis-specific pages with routing
- Real-time data updates via React Query
- Dark theme interface
- Responsive design

### File Structure
```
src/
├── components/
│   ├── ui/ (shadcn components)
│   ├── MapView.tsx (main map component)
│   ├── SearchBar.tsx
│   ├── ResultsSidebar.tsx
│   ├── CommunityChat.tsx
│   └── other components...
├── pages/
│   ├── Index.tsx (main page)
│   ├── Crisis.tsx
│   └── NotFound.tsx
├── hooks/
├── lib/
└── App.tsx (main app component)
```

## Environment Configuration
- **Development Server**: Runs on port 5000 with host 0.0.0.0
- **MapBox Token**: Configured via VITE_MAPBOX_TOKEN environment variable
- **Build Command**: `npm run build`
- **Start Command**: `npm run dev`
- **Preview Command**: `npm run preview`

## Development Notes
- The application uses a dark theme by default
- MapBox integration includes global view with crisis/community data overlays
- Community features include neighborhood watch groups, events, and local news
- Sample data is currently hard-coded for San Francisco region
- All UI components follow shadcn/ui patterns with proper accessibility

## Deployment
- Configured for autoscale deployment on Replit
- Build process uses Vite build system
- Preview mode serves optimized production build