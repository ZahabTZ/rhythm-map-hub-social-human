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

## Recent Changes (October 16, 2025)
- **Fixed crisis page data - all 21 crisis locations now display correct information**:
  - Added complete crisis data mapping for all locations (Gaza, Sudan, Ukraine, Syria, Yemen, Afghanistan, Myanmar, DR Congo, Somalia, South Sudan, Haiti, Burkina Faso, Chad, Rohingya, CAR, Lebanon, Venezuela, North Korea, Colombia, Central America, Cuba)
  - Crisis pages now show accurate titles, descriptions, affected populations, and statistics
  - Each crisis displays Oct 15, 2025 snapshot data from UN/OCHA sources
  - Clicking any crisis dot navigates to correct crisis detail page
- **Expanded Americas region crisis tracking (21 total crisis locations)**:
  - **Updated Venezuela**: Now shows 7-8M displaced (largest in Western Hemisphere, comparable to Syria)
  - **Updated Haiti**: >5M in need (≈ half population), gang control, cholera resurgence, famine-risk zones
  - **Added Colombia**: ~6M in humanitarian need, resurgent armed groups (ELN, FARC dissidents)
  - **Added Central America (Northern Triangle)**: Chronic violence, millions displaced/migrating (Guatemala, El Salvador, Honduras)
  - **Added Cuba**: Severe economic crisis, power shortages, record migration to U.S. in 2024-25
- **Humanitarian mode now hides community pins, only shows crisis dots**:
  - Community markers automatically hidden when humanitarian mode is activated
  - Clean view showing only red crisis dots for focus on humanitarian emergencies
  - Community pins reappear when humanitarian mode is toggled off
- **Added North Korea to crisis tracking**:
  - North Korea: ~10M+ facing food shortages due to severe food insecurity
  - Intensity rating: 80, positioned at Pyongyang coordinates
- **Updated with real-world humanitarian crisis dots (Oct 15, 2025 snapshot)**:
  - **Updated existing crises with accurate data**:
    - Gaza (~2.1M need food aid, aid access heavily constrained)
    - Sudan (30.4M in need, >4M refugees in neighboring states - largest crisis ever)
    - Ukraine (12.7M need assistance, ongoing infrastructure strikes)
    - Syria (~17M need aid, severely underfunded response)
    - Yemen (~19.5M need aid, acute funding gaps)
    - Afghanistan (~22.9M need aid, winter risks & service shutdowns)
    - Myanmar (~20-22M need aid, ~3.6M IDPs)
    - DR Congo (~28M require assistance, record hunger)
    - Somalia (~6M in need, >3.5M displaced)
    - Haiti (~6M in need, spiraling gang violence)
    - Burkina Faso (~5.9M in need, >2M IDPs, severely neglected)
    - Chad (~1.28M Sudanese refugees)
  - **Added 5 new crisis locations**:
    - South Sudan (~9.3M in need, flooding + violence, 0.5M newly displaced)
    - Rohingya/Bangladesh (~1.1-1.2M refugees in Cox's Bazar)
    - Central African Republic (~2.4M highly vulnerable, limited access)
    - Lebanon (~4.1M in need, economic collapse)
    - Venezuela (~6.87M refugees & migrants across Latin America/Caribbean)
  - Crisis dots use GeoJSON circle layer visualization with intensity 70-100
  - Red heatmap layer toggleable via Humanitarian Mode button
  - All dots clickable with detailed popups and crisis page navigation

## Previous Changes (October 6, 2025)
- **Replaced local San Francisco markers with global distribution**:
  - 11 markers now spread across major world cities: San Francisco (CA), Nairobi (Kenya), Miami (Florida), Tokyo (Japan), Amsterdam (Netherlands), Sydney (Australia), Mumbai (India), São Paulo (Brazil), Dubai (UAE), Vancouver (Canada), Reykjavik (Iceland)
  - Each marker has contextually relevant descriptions (e.g., Housing & Homelessness Solutions in SF, Wildlife Conservation in Nairobi, Hurricane Preparedness in Miami, Earthquake Response in Tokyo)
  - Created matching communities with appropriate categories and member counts
  - Added sample chat messages for each community with contextually relevant content (housing advocacy in SF, conservation discussions in Nairobi, hurricane prep tips in Miami, etc.)
  - **Made marker popups clickable**: Clicking on a marker popup now navigates directly to the community chat page with hover effects and visual feedback
- **Restored map load animation**:
  - Globe now animates from global view to user's location on initial load
  - Smooth 2-second fly-to animation centers map at city-level zoom (zoom 12)
  - Uses browser geolocation API with San Francisco fallback
  - Animation triggers when both map and user location are ready

## Previous Changes (October 5, 2025)
- **Implemented social profile integration system**:
  - Added social profiles to User schema supporting Twitter/X, Instagram, LinkedIn, TikTok, YouTube, Facebook
  - Each profile includes: platform, username, profileUrl, displayName, followerCount, isVerified, profilePicture
  - Backend API routes for managing social profiles (GET/POST/DELETE /api/user/social-profiles)
  - SocialProfiles component in profile dropdown for adding/removing connected accounts
  - SocialProfileDisplay component for showing social links in compact format with platform icons
  - Community chat "About" section now displays creator's social profiles
  - Active members list shows member social profiles for easy connection
  - All social profile links open in new tabs when clicked
  - Manual entry system (username/URL) instead of OAuth for simplicity

## Previous Changes (October 4, 2025)
- Added Gaza Humanitarian Crisis to backend storage with full story submission support
- Created password-protected /supadmin admin panel for story moderation
- Implemented complete story approval workflow: submit → pending review → admin approval → public display
- Updated Crisis pages to fetch and display approved stories from API
- Added error handling and loading states for story fetching and moderation
- Integrated React Query for story management and cache invalidation
- **Implemented crisis-specific community chat system**:
  - Each crisis now has a dedicated community (e.g., "crisis_community_gaza-2024")
  - Join Community Chat button navigates users to crisis-specific communities
  - Replaced "Online Users" with "Most Active Members" ranked by message count
  - All 3 chat threads (Introductions, General Discussion, FAQ & Help) work correctly with thread filtering
  - Added `/api/chat/:communityId/active-members` endpoint for engagement tracking
  - Added `/api/crisis/:crisisId/community` endpoint to fetch crisis communities
  - Thread field added to ChatMessageSchema to support separate discussion channels
- **Implemented user-based community creation system**:
  - Each logged-in user can now create ONE community (no verified host requirement)
  - Added `maxGeographicScope` field to Community schema (neighborhood/city/state/national/global)
  - Backend enforces one-community-per-user rule via storage validation
  - CreateCommunity page includes geographic scope selector with clear UI
  - CommunityChat dynamically filters available regions based on community's maxGeographicScope
  - Geographic hierarchy: users can filter by maxScope or smaller regions, global always available
  - Added `/api/user/has-community` endpoint to check user's community status
  - Cache invalidation properly handles community creation state updates
- **Implemented region-based community discovery on home screen**:
  - Region selector buttons (Neighborhood/City/State/National/Global) on map now trigger community discovery
  - ResultsSidebar displays most popular communities filtered by selected region and maxGeographicScope
  - Filtering logic: selecting narrower regions shows fewer communities (more focused), broader regions show more
  - Communities sorted by popularity (memberCount) in descending order
  - Geographic hierarchy properly enforced: neighborhood < city < state < national < global
  - Sidebar header displays selected region as a badge for clarity

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