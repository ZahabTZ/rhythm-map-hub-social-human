import {
  Story,
  InsertStory,
  Crisis,
  ModerationAction,
  SelectStory,
  User,
  SocialProfile,
  Community,
  Discussion,
  Event,
  Payment,
  ChatMessage,
  DirectMessage,
  InsertCommunity,
  InsertDiscussion,
  InsertEvent,
  InsertChatMessage,
  InsertDirectMessage,
} from "../shared/schema";

export interface IStorage {
  // Story management
  createStory(
    story: InsertStory & { submitterIP?: string; submitterUserAgent?: string },
  ): Promise<Story>;
  getStoryById(id: string): Promise<Story | null>;
  getStoriesByCrisis(
    crisisId: string,
    includeModerated?: boolean,
  ): Promise<Story[]>;
  getApprovedStoriesByCrisis(crisisId: string): Promise<Story[]>;
  getPendingStories(): Promise<Story[]>;
  updateStoryModerationStatus(action: ModerationAction): Promise<Story>;
  deleteStory(id: string): Promise<boolean>;
  likeStory(storyId: string): Promise<Story>;

  // Crisis management
  getCrisisById(id: string): Promise<Crisis | null>;
  getAllActiveCrises(): Promise<Crisis[]>;
  updateCrisis(id: string, crisis: Partial<Crisis>): Promise<Crisis>;

  // Location verification
  isLocationWithinCrisis(
    userLat: number,
    userLng: number,
    crisisId: string,
  ): Promise<boolean>;

  // User operations
  createOrUpdateUser(googleUser: any): Promise<User>;
  getUserById(userId: string): Promise<User | null>;
  getUserByGoogleId(googleId: string): Promise<User | null>;
  updateUserVerifiedHostStatus(
    userId: string,
    isVerified: boolean,
    expiresAt?: string,
  ): Promise<User>;
  addUserSocialProfile(userId: string, profile: SocialProfile): Promise<User>;
  removeUserSocialProfile(userId: string, platform: string): Promise<User>;

  // Community operations
  createCommunity(
    community: InsertCommunity & { createdBy: string },
  ): Promise<Community>;
  hasUserCreatedCommunity(userId: string): Promise<boolean>;
  getAllCommunities(): Promise<Community[]>;
  getCommunityById(communityId: string): Promise<Community | null>;
  getCommunityByCrisisId(crisisId: string): Promise<Community | null>;
  getCommunitiesByCreator(userId: string): Promise<Community[]>;
  updateCommunity(
    communityId: string,
    updates: Partial<Community>,
  ): Promise<Community>;

  // Discussion operations
  createDiscussion(discussion: InsertDiscussion): Promise<Discussion>;
  getDiscussionsByCommunity(
    communityId: string,
    isLocal?: boolean,
  ): Promise<Discussion[]>;
  getLocalDiscussionsByUserLocation(
    communityId: string,
    userLat: number,
    userLng: number,
    radiusKm?: number,
  ): Promise<Discussion[]>;
  likeDiscussion(discussionId: string): Promise<Discussion>;

  // Event operations
  createEvent(event: InsertEvent & { createdBy: string }): Promise<Event>;
  getAllEvents(): Promise<Event[]>;
  getEventsByCreator(userId: string): Promise<Event[]>;
  getEventsByLocation(
    lat: number,
    lng: number,
    radiusKm?: number,
  ): Promise<Event[]>;
  updateEvent(eventId: string, updates: Partial<Event>): Promise<Event>;
  joinEvent(eventId: string, userId: string): Promise<Event>;
  leaveEvent(eventId: string, userId: string): Promise<Event>;

  // Payment operations
  createPayment(payment: Omit<Payment, "id">): Promise<Payment>;
  getPaymentsByUser(userId: string): Promise<Payment[]>;
  updatePaymentStatus(
    stripePaymentIntentId: string,
    status: "succeeded" | "failed",
  ): Promise<boolean>;
  getPaymentByStripeId(stripePaymentIntentId: string): Promise<Payment | null>;

  // Chat message operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesByCommunity(
    communityId: string,
    region?: string,
    thread?: string,
  ): Promise<ChatMessage[]>;
  getMostActiveMembers(
    communityId: string,
    limit?: number,
  ): Promise<
    Array<{
      userId: string;
      userName: string;
      messageCount: number;
      user?: User;
    }>
  >;
  deleteChatMessage(messageId: string): Promise<boolean>;

  // Direct message operations
  createDirectMessage(message: InsertDirectMessage): Promise<DirectMessage>;
  getDirectMessagesByConversation(
    conversationId: string,
  ): Promise<DirectMessage[]>;
  getDirectMessagesBetweenUsers(
    senderId: string,
    recipientId: string,
  ): Promise<DirectMessage[]>;
  markDirectMessageAsRead(messageId: string): Promise<DirectMessage>;
  getUserConversations(userId: string): Promise<DirectMessage[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private stories: Map<string, Story> = new Map();
  private crises: Map<string, Crisis> = new Map();
  private users: Map<string, User> = new Map();
  private communities: Map<string, Community> = new Map();
  private discussions: Map<string, Discussion> = new Map();
  private events: Map<string, Event> = new Map();
  private payments: Map<string, Payment> = new Map();
  private chatMessages: Map<string, ChatMessage> = new Map();
  private directMessages: Map<string, DirectMessage> = new Map();
  private nextStoryId = 1;
  private nextUserId = 1;
  private nextCommunityId = 1;
  private nextDiscussionId = 1;
  private nextEventId = 1;
  private nextPaymentId = 1;
  private nextChatMessageId = 1;
  private nextDirectMessageId = 1;

  constructor() {
    // Initialize with some sample crisis data
    this.initializeSampleCrises();
    this.initializeSampleCommunities();
  }

  private initializeSampleCrises() {
    const sampleCrises: Crisis[] = [
      {
        id: "1",
        name: "Eastern Europe Refugee Crisis",
        location: { lat: 49.8397, lng: 24.0297, name: "Eastern Europe" },
        severity: "Critical",
        isActive: true,
        allowStorySubmissions: true,
      },
      {
        id: "gaza-2024",
        name: "Gaza Humanitarian Crisis",
        location: { lat: 31.5017, lng: 34.4668, name: "Gaza, Palestine" },
        severity: "Critical",
        isActive: true,
        allowStorySubmissions: true,
      },
      {
        id: "ukraine-conflict",
        name: "Ukraine Conflict",
        location: { lat: 50.4501, lng: 30.5234, name: "Kyiv, Ukraine" },
        severity: "Critical",
        isActive: true,
        allowStorySubmissions: true,
      },
      {
        id: "syria-crisis",
        name: "Syria Humanitarian Crisis",
        location: { lat: 36.2021, lng: 38.9968, name: "Aleppo, Syria" },
        severity: "High",
        isActive: true,
        allowStorySubmissions: true,
      },
      {
        id: "sudan-crisis",
        name: "Sudan Crisis",
        location: { lat: 15.5007, lng: 32.5599, name: "Khartoum, Sudan" },
        severity: "Critical",
        isActive: true,
        allowStorySubmissions: true,
      },
    ];

    sampleCrises.forEach((crisis) => {
      this.crises.set(crisis.id, crisis);
    });

    // Create crisis-specific communities
    this.createCrisisCommunities();
  }

  private createCrisisCommunities() {
    const crisisCommunitiesData = [
      {
        id: "crisis_community_gaza-2024",
        crisisId: "gaza-2024",
        name: "Gaza Crisis Support Community",
        description:
          "Community supporting those affected by the Gaza humanitarian crisis",
        category: "Crisis Response",
      },
      {
        id: "crisis_community_ukraine-conflict",
        crisisId: "ukraine-conflict",
        name: "Ukraine Crisis Support Community",
        description: "Supporting those affected by the Ukraine conflict",
        category: "Crisis Response",
      },
      {
        id: "crisis_community_syria-crisis",
        crisisId: "syria-crisis",
        name: "Syria Crisis Support Community",
        description: "Aid and support for Syrian crisis victims",
        category: "Humanitarian",
      },
      {
        id: "crisis_community_sudan-crisis",
        crisisId: "sudan-crisis",
        name: "Sudan Crisis Support Community",
        description: "Supporting those affected by the Sudan crisis",
        category: "Crisis Response",
      },
      {
        id: "crisis_community_1",
        crisisId: "1",
        name: "Eastern Europe Refugee Support",
        description: "Support community for Eastern Europe refugee crisis",
        category: "Humanitarian",
      },
    ];

    crisisCommunitiesData.forEach((data) => {
      const community: Community = {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category as any,
        maxGeographicScope: "global" as const,
        isActive: true,
        memberCount: 0,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "system",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.communities.set(data.id, community);
    });
  }

  private initializeSampleCommunities() {
    const sampleCommunities: Community[] = [
      {
        id: "community_sf",
        name: "Housing & Homelessness Solutions - San Francisco",
        description:
          "Community-driven initiatives to address housing affordability and homelessness through advocacy, resources, and direct support",
        category: "Humanitarian",
        maxGeographicScope: "city",
        coordinates: { lat: 37.7749, lng: -122.4194 },
        isActive: true,
        memberCount: 4521,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_sf_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_sf_tech",
        name: "SF Tech for Good - San Francisco",
        description: "Tech professionals using skills for social impact - volunteer coding, mentorship, and digital literacy programs",
        category: "Technology",
        maxGeographicScope: "city",
        coordinates: { lat: 37.7749, lng: -122.4194 },
        isActive: true,
        memberCount: 2891,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_sf_tech_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_sf_arts",
        name: "San Francisco Arts Community",
        description: "Supporting local artists, galleries, and cultural events across the city",
        category: "Cultural",
        maxGeographicScope: "city",
        coordinates: { lat: 37.7749, lng: -122.4194 },
        isActive: true,
        memberCount: 3267,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_sf_arts_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_oakland",
        name: "Oakland Community Coalition",
        description: "Building stronger neighborhoods across Oakland through local organizing and mutual aid",
        category: "Community",
        maxGeographicScope: "city",
        coordinates: { lat: 37.8044, lng: -122.2712 },
        isActive: true,
        memberCount: 1834,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_oakland_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_san_jose",
        name: "San Jose Innovation Hub",
        description: "Connecting San Jose's diverse tech and startup community for collaboration and growth",
        category: "Technology",
        maxGeographicScope: "city",
        coordinates: { lat: 37.3382, lng: -121.8863 },
        isActive: true,
        memberCount: 2156,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_sj_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_arusha",
        name: "Wildlife Conservation Network - Arusha",
        description:
          "Protecting Tanzania's wildlife through community-led conservation efforts and anti-poaching initiatives",
        category: "Environmental",
        maxGeographicScope: "city",
        coordinates: { lat: -3.3667, lng: 36.6833 },
        isActive: true,
        memberCount: 2847,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_tanzania_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_miami",
        name: "Hurricane Preparedness Initiative - Miami",
        description:
          "Community response network for hurricane season preparation, evacuation coordination, and disaster recovery",
        category: "Safety",
        maxGeographicScope: "city",
        coordinates: { lat: 25.7617, lng: -80.1918 },
        isActive: true,
        memberCount: 5621,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_miami_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_tokyo",
        name: "Earthquake Response Team - Tokyo",
        description:
          "Coordinating earthquake preparedness drills, emergency supplies, and rapid response protocols",
        category: "Safety",
        maxGeographicScope: "city",
        coordinates: { lat: 35.6895, lng: 139.6917 },
        isActive: true,
        memberCount: 8934,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_tokyo_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_amsterdam",
        name: "Climate Adaptation Forum - Amsterdam",
        description:
          "Building resilient infrastructure and sustainable solutions for rising sea levels and flooding",
        category: "Environmental",
        maxGeographicScope: "city",
        coordinates: { lat: 52.3676, lng: 4.9041 },
        isActive: true,
        memberCount: 3456,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_amsterdam_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_sydney",
        name: "Bushfire Preparedness Coalition - Sydney",
        description:
          "Community-driven bushfire prevention, early warning systems, and emergency evacuation planning",
        category: "Safety",
        maxGeographicScope: "city",
        coordinates: { lat: -33.8688, lng: 151.2093 },
        isActive: true,
        memberCount: 4732,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_sydney_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_mumbai",
        name: "Monsoon Resilience Network - Mumbai",
        description:
          "Preparing communities for monsoon season with drainage solutions, flood alerts, and emergency response",
        category: "Safety",
        maxGeographicScope: "city",
        coordinates: { lat: 19.0760, lng: 72.8777 },
        isActive: true,
        memberCount: 6891,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_mumbai_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_sao_paulo",
        name: "Urban Sustainability Project - São Paulo",
        description:
          "Green infrastructure, waste reduction, and sustainable urban development initiatives",
        category: "Environmental",
        maxGeographicScope: "city",
        coordinates: { lat: -23.5505, lng: -46.6333 },
        isActive: true,
        memberCount: 5234,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_saopaulo_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_dubai",
        name: "Water Conservation Alliance - Dubai",
        description:
          "Innovative water-saving technologies and desert resilience strategies for arid climates",
        category: "Environmental",
        maxGeographicScope: "city",
        coordinates: { lat: 25.2048, lng: 55.2708 },
        isActive: true,
        memberCount: 4123,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_dubai_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_vancouver",
        name: "Indigenous Community Hub - Vancouver",
        description:
          "Supporting Indigenous-led initiatives, cultural preservation, and reconciliation efforts",
        category: "Cultural",
        maxGeographicScope: "city",
        coordinates: { lat: 49.2827, lng: -123.1207 },
        isActive: true,
        memberCount: 3567,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_vancouver_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_reykjavik",
        name: "Renewable Energy Collective - Reykjavik",
        description:
          "Advancing geothermal and renewable energy solutions for sustainable communities",
        category: "Environmental",
        maxGeographicScope: "city",
        coordinates: { lat: 64.1466, lng: -21.8174 },
        isActive: true,
        memberCount: 2891,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_reykjavik_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // Neighborhood level examples - SF Bay Area
      {
        id: "community_mission_district",
        name: "Mission District Neighbors",
        description: "Hyperlocal community for Mission District residents - street fairs, local issues, and neighborhood watch",
        category: "Community",
        maxGeographicScope: "neighborhood",
        coordinates: { lat: 37.7599, lng: -122.4148 },
        isActive: true,
        memberCount: 342,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_sf_2",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_haight_ashbury",
        name: "Haight-Ashbury Community Alliance",
        description: "Supporting our historic Haight neighborhood through local businesses, events, and mutual aid",
        category: "Community",
        maxGeographicScope: "neighborhood",
        coordinates: { lat: 37.7694, lng: -122.4481 },
        isActive: true,
        memberCount: 278,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_sf_3",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_richmond_district",
        name: "Richmond District Residents",
        description: "Connect with neighbors in the Richmond - from Ocean Beach to Golden Gate Park",
        category: "Community",
        maxGeographicScope: "neighborhood",
        coordinates: { lat: 37.7806, lng: -122.4703 },
        isActive: true,
        memberCount: 189,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_sf_4",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_soma",
        name: "SoMa Community Action Network",
        description: "South of Market residents organizing for affordable housing and neighborhood improvement",
        category: "Community",
        maxGeographicScope: "neighborhood",
        coordinates: { lat: 37.7790, lng: -122.4094 },
        isActive: true,
        memberCount: 467,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_sf_5",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // State level examples
      {
        id: "community_california",
        name: "California Climate Action Network",
        description: "Statewide coordination for climate resilience, wildfire prevention, and sustainable policy advocacy",
        category: "Environmental",
        maxGeographicScope: "state",
        coordinates: { lat: 36.7783, lng: -119.4179 }, // California center
        isActive: true,
        memberCount: 15642,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_ca_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_texas",
        name: "Texas Emergency Response Coalition",
        description: "State-level coordination for disaster preparedness, extreme weather response, and power grid resilience",
        category: "Safety",
        maxGeographicScope: "state",
        coordinates: { lat: 31.9686, lng: -99.9018 }, // Texas center
        isActive: true,
        memberCount: 12389,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_tx_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // National level examples
      {
        id: "community_us_healthcare",
        name: "National Healthcare Access Alliance",
        description: "Nationwide advocacy for affordable healthcare, connecting communities across America",
        category: "Humanitarian",
        maxGeographicScope: "national",
        coordinates: { lat: 39.8283, lng: -98.5795 }, // USA center
        isActive: true,
        memberCount: 43782,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_us_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_us_education",
        name: "Education Equity Network USA",
        description: "Fighting for equal educational opportunities across all states and communities",
        category: "Education",
        maxGeographicScope: "national",
        coordinates: { lat: 39.8283, lng: -98.5795 }, // USA center
        isActive: true,
        memberCount: 38921,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_us_2",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // Global level examples
      {
        id: "community_climate_global",
        name: "Global Climate Action Coalition",
        description: "Worldwide network coordinating climate action, renewable energy transitions, and international policy",
        category: "Environmental",
        maxGeographicScope: "global",
        coordinates: { lat: 0, lng: 0 }, // Global - no specific location
        isActive: true,
        memberCount: 127453,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_global_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "community_refugees_global",
        name: "International Refugee Support Network",
        description: "Cross-border coordination supporting displaced people worldwide with resources, advocacy, and resettlement",
        category: "Humanitarian",
        maxGeographicScope: "global",
        coordinates: { lat: 0, lng: 0 }, // Global - no specific location
        isActive: true,
        memberCount: 89234,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: "user_global_2",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    sampleCommunities.forEach((community) => {
      this.communities.set(community.id, community);
    });

    this.nextCommunityId = 27; // Start at 27 since we have 26 sample communities

    // Initialize sample chat messages for these communities
    this.initializeSampleChatMessages();
  }

  private initializeSampleChatMessages() {
    const sampleMessages = [
      // San Francisco - Housing & Homelessness Solutions
      {
        id: "msg_sf_1",
        communityId: "community_sf",
        region: "global" as const,
        thread: "intro" as const,
        content:
          "Hi everyone! I'm Alex, a housing advocate working with local nonprofits. Let's collaborate to make SF more affordable and supportive for everyone.",
        authorId: "user_sf_1",
        authorName: "Alex Chen",
        messageType: "text" as const,
      },
      {
        id: "msg_sf_2",
        communityId: "community_sf",
        region: "global" as const,
        thread: "content" as const,
        content:
          "Our community housing initiative just secured 50 transitional housing units in the Tenderloin! We're also expanding our job placement program. Volunteers welcome!",
        authorId: "user_sf_1",
        authorName: "Alex Chen",
        messageType: "text" as const,
      },

      // Nairobi - Wildlife Conservation
      {
        id: "msg_arusha_1",
        communityId: "community_arusha",
        region: "global" as const,
        thread: "intro" as const,
        content:
          "Welcome! I'm Sarah, a wildlife ranger at Arusha National Park. Excited to connect with fellow conservationists!",
        authorId: "user_tanzania_1",
        authorName: "Sarah Mwangi",
        messageType: "text" as const,
      },
      {
        id: "msg_arusha_2",
        communityId: "community_arusha",
        region: "global" as const,
        thread: "content" as const,
        content:
          "Our anti-poaching patrols spotted a herd of 15 elephants near the Athi River today. Great to see population recovery!",
        authorId: "user_tanzania_2",
        authorName: "James Omondi",
        messageType: "text" as const,
      },

      // Miami - Hurricane Preparedness
      {
        id: "msg_miami_1",
        communityId: "community_miami",
        region: "global" as const,
        thread: "intro" as const,
        content:
          "Hi everyone, I'm Maria, emergency coordinator for Miami-Dade. Here to help keep our community safe during hurricane season!",
        authorId: "user_miami_1",
        authorName: "Maria Rodriguez",
        messageType: "text" as const,
      },
      {
        id: "msg_miami_2",
        communityId: "community_miami",
        region: "global" as const,
        thread: "content" as const,
        content:
          "Hurricane season starts June 1st. Please stock up on water (1 gallon per person per day for 3 days), batteries, and non-perishable food.",
        authorId: "user_miami_1",
        authorName: "Maria Rodriguez",
        messageType: "text" as const,
      },

      // Tokyo - Earthquake Response
      {
        id: "msg_tokyo_1",
        communityId: "community_tokyo",
        region: "global" as const,
        thread: "intro" as const,
        content:
          "こんにちは! I'm Kenji, disaster preparedness coordinator. Let's work together to keep Tokyo safe.",
        authorId: "user_tokyo_1",
        authorName: "Kenji Tanaka",
        messageType: "text" as const,
      },
      {
        id: "msg_tokyo_2",
        communityId: "community_tokyo",
        region: "global" as const,
        thread: "content" as const,
        content:
          "Reminder: Our monthly earthquake drill is this Saturday at 10am. Please participate from your neighborhoods!",
        authorId: "user_tokyo_1",
        authorName: "Kenji Tanaka",
        messageType: "text" as const,
      },

      // Amsterdam - Climate Adaptation
      {
        id: "msg_amsterdam_1",
        communityId: "community_amsterdam",
        region: "global" as const,
        thread: "intro" as const,
        content:
          "Hallo! I'm Lars, hydraulic engineer working on flood defenses. Excited to share innovative solutions with you all.",
        authorId: "user_amsterdam_1",
        authorName: "Lars van der Berg",
        messageType: "text" as const,
      },
      {
        id: "msg_amsterdam_2",
        communityId: "community_amsterdam",
        region: "global" as const,
        thread: "content" as const,
        content:
          "The new floating park project is making great progress! It will help absorb excess water during high tides.",
        authorId: "user_amsterdam_1",
        authorName: "Lars van der Berg",
        messageType: "text" as const,
      },

      // Sydney - Bushfire Preparedness
      {
        id: "msg_sydney_1",
        communityId: "community_sydney",
        region: "global" as const,
        thread: "intro" as const,
        content:
          "G'day everyone! I'm Emma, Rural Fire Service volunteer. Here to help our community prepare for bushfire season.",
        authorId: "user_sydney_1",
        authorName: "Emma Thompson",
        messageType: "text" as const,
      },
      {
        id: "msg_sydney_2",
        communityId: "community_sydney",
        region: "global" as const,
        thread: "content" as const,
        content:
          "Fire danger rating is HIGH this weekend. Please clear gutters, create defensible space around homes, and have your bushfire plan ready.",
        authorId: "user_sydney_1",
        authorName: "Emma Thompson",
        messageType: "text" as const,
      },

      // Mumbai - Monsoon Resilience
      {
        id: "msg_mumbai_1",
        communityId: "community_mumbai",
        region: "global" as const,
        thread: "intro" as const,
        content:
          "Namaste! I'm Priya, working with BMC on monsoon drainage systems. Let's work together to keep Mumbai safe during the rains.",
        authorId: "user_mumbai_1",
        authorName: "Priya Sharma",
        messageType: "text" as const,
      },
      {
        id: "msg_mumbai_2",
        communityId: "community_mumbai",
        region: "global" as const,
        thread: "content" as const,
        content:
          "Monsoon update: Heavy rains expected this week. Please avoid waterlogged areas and check our flood alert map for updates.",
        authorId: "user_mumbai_1",
        authorName: "Priya Sharma",
        messageType: "text" as const,
      },

      // São Paulo - Urban Sustainability
      {
        id: "msg_saopaulo_1",
        communityId: "community_sao_paulo",
        region: "global" as const,
        thread: "intro" as const,
        content:
          "Olá! I'm Paulo, environmental engineer. Passionate about making São Paulo greener and more sustainable for future generations.",
        authorId: "user_saopaulo_1",
        authorName: "Paulo Silva",
        messageType: "text" as const,
      },
      {
        id: "msg_saopaulo_2",
        communityId: "community_sao_paulo",
        region: "global" as const,
        thread: "content" as const,
        content:
          "Great news! Our community garden project has reduced local waste by 30%. Join us this weekend to help expand the green roof initiative!",
        authorId: "user_saopaulo_1",
        authorName: "Paulo Silva",
        messageType: "text" as const,
      },

      // Dubai - Water Conservation
      {
        id: "msg_dubai_1",
        communityId: "community_dubai",
        region: "global" as const,
        thread: "intro" as const,
        content:
          "Marhaba! I'm Fatima, water resources specialist. Let's innovate together to conserve our most precious resource.",
        authorId: "user_dubai_1",
        authorName: "Fatima Al-Maktoum",
        messageType: "text" as const,
      },
      {
        id: "msg_dubai_2",
        communityId: "community_dubai",
        region: "global" as const,
        thread: "content" as const,
        content:
          "Our new greywater recycling system reduced household water use by 40%! Check out the pilot program results in the resources section.",
        authorId: "user_dubai_1",
        authorName: "Fatima Al-Maktoum",
        messageType: "text" as const,
      },

      // Vancouver - Indigenous Community Hub
      {
        id: "msg_vancouver_1",
        communityId: "community_vancouver",
        region: "global" as const,
        thread: "intro" as const,
        content:
          "Hello, I'm Cedar, from the Squamish Nation. Honored to facilitate dialogue and support Indigenous-led initiatives in our community.",
        authorId: "user_vancouver_1",
        authorName: "Cedar Williams",
        messageType: "text" as const,
      },
      {
        id: "msg_vancouver_2",
        communityId: "community_vancouver",
        region: "global" as const,
        thread: "content" as const,
        content:
          "Join us for the Traditional Knowledge Sharing Circle this Thursday. Elders will discuss sustainable land stewardship practices.",
        authorId: "user_vancouver_1",
        authorName: "Cedar Williams",
        messageType: "text" as const,
      },

      // Reykjavik - Renewable Energy
      {
        id: "msg_reykjavik_1",
        communityId: "community_reykjavik",
        region: "global" as const,
        thread: "intro" as const,
        content:
          "Halló! I'm Björk, geothermal energy researcher. Excited to share Iceland's renewable energy innovations with the world!",
        authorId: "user_reykjavik_1",
        authorName: "Björk Jónsdóttir",
        messageType: "text" as const,
      },
      {
        id: "msg_reykjavik_2",
        communityId: "community_reykjavik",
        region: "global" as const,
        thread: "content" as const,
        content:
          "Iceland now runs on 100% renewable energy! Our latest geothermal plant is producing clean energy for 50,000 homes. The future is here!",
        authorId: "user_reykjavik_1",
        authorName: "Björk Jónsdóttir",
        messageType: "text" as const,
      },
    ];

    sampleMessages.forEach((msg) => {
      const chatMessage: ChatMessage = {
        ...msg,
        reactions: [],
        isEdited: false,
        createdAt: new Date().toISOString(),
      };
      this.chatMessages.set(msg.id, chatMessage);
    });
  }

  private generateStoryId(): string {
    return (this.nextStoryId++).toString();
  }

  async createStory(
    storyData: InsertStory & {
      submitterIP?: string;
      submitterUserAgent?: string;
    },
  ): Promise<Story> {
    const id = this.generateStoryId();
    const story: Story = {
      ...storyData,
      id,
      likes: 0,
      moderationStatus: "pending",
      submittedAt: new Date().toISOString(),
    };

    this.stories.set(id, story);
    return story;
  }

  async getStoryById(id: string): Promise<Story | null> {
    return this.stories.get(id) || null;
  }

  async getStoriesByCrisis(
    crisisId: string,
    includeModerated = true,
  ): Promise<Story[]> {
    const stories = Array.from(this.stories.values()).filter(
      (story) => story.location.crisisId === crisisId,
    );

    if (!includeModerated) {
      return stories.filter((story) => story.moderationStatus === "approved");
    }

    return stories;
  }

  async getApprovedStoriesByCrisis(crisisId: string): Promise<Story[]> {
    return Array.from(this.stories.values()).filter(
      (story) =>
        story.location.crisisId === crisisId &&
        story.moderationStatus === "approved",
    );
  }

  async getPendingStories(): Promise<Story[]> {
    return Array.from(this.stories.values()).filter(
      (story) => story.moderationStatus === "pending",
    );
  }

  async updateStoryModerationStatus(action: ModerationAction): Promise<Story> {
    const story = this.stories.get(action.storyId);
    if (!story) {
      throw new Error("Story not found");
    }

    story.moderationStatus =
      action.action === "approve"
        ? "approved"
        : action.action === "reject"
          ? "rejected"
          : "flagged";
    story.moderationNotes = action.notes;
    story.moderatedBy = action.moderatorId;
    story.moderatedAt = new Date().toISOString();

    this.stories.set(action.storyId, story);
    return story;
  }

  async deleteStory(id: string): Promise<boolean> {
    return this.stories.delete(id);
  }

  async likeStory(storyId: string): Promise<Story> {
    const story = this.stories.get(storyId);
    if (!story) {
      throw new Error("Story not found");
    }

    story.likes += 1;
    this.stories.set(storyId, story);
    return story;
  }

  async getCrisisById(id: string): Promise<Crisis | null> {
    return this.crises.get(id) || null;
  }

  async getAllActiveCrises(): Promise<Crisis[]> {
    return Array.from(this.crises.values()).filter((crisis) => crisis.isActive);
  }

  async updateCrisis(
    id: string,
    crisisUpdate: Partial<Crisis>,
  ): Promise<Crisis> {
    const crisis = this.crises.get(id);
    if (!crisis) {
      throw new Error("Crisis not found");
    }

    const updatedCrisis = { ...crisis, ...crisisUpdate };
    this.crises.set(id, updatedCrisis);
    return updatedCrisis;
  }

  async isLocationWithinCrisis(
    userLat: number,
    userLng: number,
    crisisId: string,
  ): Promise<boolean> {
    const crisis = await this.getCrisisById(crisisId);
    if (!crisis) return false;

    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(
      userLat,
      userLng,
      crisis.location.lat,
      crisis.location.lng,
    );

    // Allow submissions within 50km of crisis center
    return distance <= 50;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // User operations
  async createOrUpdateUser(googleUser: any): Promise<User> {
    // Check if user already exists
    let existingUser = Array.from(this.users.values()).find(
      (u) => u.googleId === googleUser.id,
    );

    if (existingUser) {
      // Update existing user
      existingUser.name = googleUser.name;
      existingUser.email = googleUser.email;
      existingUser.profilePicture = googleUser.picture;
      existingUser.lastActiveAt = new Date().toISOString();
      this.users.set(existingUser.id, existingUser);
      return existingUser;
    }

    // Create new user
    const userId = `user_${this.nextUserId++}`;
    const newUser: User = {
      id: userId,
      email: googleUser.email,
      name: googleUser.name,
      profilePicture: googleUser.picture,
      googleId: googleUser.id,
      isVerifiedHost: false,
      socialProfiles: [],
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    this.users.set(userId, newUser);
    return newUser;
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  async getUserByGoogleId(googleId: string): Promise<User | null> {
    return (
      Array.from(this.users.values()).find((u) => u.googleId === googleId) ||
      null
    );
  }

  async updateUserVerifiedHostStatus(
    userId: string,
    isVerified: boolean,
    expiresAt?: string,
  ): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.isVerifiedHost = isVerified;
    user.verifiedHostExpiresAt = expiresAt;
    if (isVerified) {
      user.verifiedAt = new Date().toISOString();
    }

    this.users.set(userId, user);
    return user;
  }

  async addUserSocialProfile(
    userId: string,
    profile: SocialProfile,
  ): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.socialProfiles) {
      user.socialProfiles = [];
    }

    // Remove existing profile for this platform
    user.socialProfiles = user.socialProfiles.filter(
      (p) => p.platform !== profile.platform,
    );

    // Add new profile
    user.socialProfiles.push(profile);

    this.users.set(userId, user);
    return user;
  }

  async removeUserSocialProfile(
    userId: string,
    platform: string,
  ): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.socialProfiles) {
      user.socialProfiles = user.socialProfiles.filter(
        (p) => p.platform !== platform,
      );
    }

    this.users.set(userId, user);
    return user;
  }

  // Community operations
  async createCommunity(
    communityData: InsertCommunity & { createdBy: string },
  ): Promise<Community> {
    // Check if user already has a community (excluding system-created crisis communities)
    const existingCommunity = Array.from(this.communities.values()).find(
      (c) =>
        c.createdBy === communityData.createdBy && c.createdBy !== "system",
    );

    if (existingCommunity) {
      throw new Error(
        "User already has a community. Each user can only create one community.",
      );
    }

    const id = `community_${this.nextCommunityId++}`;
    const community: Community = {
      ...communityData,
      id,
      memberCount: 0,
      globalDiscussions: [],
      localDiscussions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.communities.set(id, community);
    return community;
  }

  async hasUserCreatedCommunity(userId: string): Promise<boolean> {
    const userCommunity = Array.from(this.communities.values()).find(
      (c) => c.createdBy === userId && c.createdBy !== "system",
    );
    return !!userCommunity;
  }

  async getAllCommunities(): Promise<Community[]> {
    return Array.from(this.communities.values()).filter((c) => c.isActive);
  }

  async getCommunityById(communityId: string): Promise<Community | null> {
    return this.communities.get(communityId) || null;
  }

  async getCommunityByCrisisId(crisisId: string): Promise<Community | null> {
    const communityId = `crisis_community_${crisisId}`;
    return this.communities.get(communityId) || null;
  }

  async getCommunitiesByCreator(userId: string): Promise<Community[]> {
    return Array.from(this.communities.values()).filter(
      (c) => c.createdBy === userId && c.isActive,
    );
  }

  async updateCommunity(
    communityId: string,
    updates: Partial<Community>,
  ): Promise<Community> {
    const community = this.communities.get(communityId);
    if (!community) {
      throw new Error("Community not found");
    }

    const updatedCommunity = {
      ...community,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.communities.set(communityId, updatedCommunity);
    return updatedCommunity;
  }

  // Discussion operations
  async createDiscussion(
    discussionData: InsertDiscussion,
  ): Promise<Discussion> {
    const id = `discussion_${this.nextDiscussionId++}`;
    const discussion: Discussion = {
      ...discussionData,
      id,
      replies: [],
      likes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.discussions.set(id, discussion);

    // Update community discussion lists
    const community = await this.getCommunityById(discussionData.communityId);
    if (community) {
      if (discussionData.isLocal) {
        community.localDiscussions.push(id);
      } else {
        community.globalDiscussions.push(id);
      }
      await this.updateCommunity(community.id, community);
    }

    return discussion;
  }

  async getDiscussionsByCommunity(
    communityId: string,
    isLocal?: boolean,
  ): Promise<Discussion[]> {
    const discussions = Array.from(this.discussions.values()).filter(
      (d) => d.communityId === communityId,
    );

    if (isLocal !== undefined) {
      return discussions.filter((d) => d.isLocal === isLocal);
    }

    return discussions;
  }

  async getLocalDiscussionsByUserLocation(
    communityId: string,
    userLat: number,
    userLng: number,
    radiusKm: number = 50,
  ): Promise<Discussion[]> {
    const localDiscussions = await this.getDiscussionsByCommunity(
      communityId,
      true,
    );

    return localDiscussions.filter((discussion) => {
      if (!discussion.authorLocation) return false;

      const distance = this.calculateDistance(
        userLat,
        userLng,
        discussion.authorLocation.lat,
        discussion.authorLocation.lng,
      );

      return distance <= radiusKm;
    });
  }

  async likeDiscussion(discussionId: string): Promise<Discussion> {
    const discussion = this.discussions.get(discussionId);
    if (!discussion) {
      throw new Error("Discussion not found");
    }

    discussion.likes += 1;
    discussion.updatedAt = new Date().toISOString();
    this.discussions.set(discussionId, discussion);
    return discussion;
  }

  // Event operations
  async createEvent(
    eventData: InsertEvent & { createdBy: string },
  ): Promise<Event> {
    const id = `event_${this.nextEventId++}`;
    const event: Event = {
      ...eventData,
      id,
      currentAttendees: 0,
      attendeeIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.events.set(id, event);
    return event;
  }

  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).filter((e) => e.isActive);
  }

  async getEventsByCreator(userId: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (e) => e.createdBy === userId && e.isActive,
    );
  }

  async getEventsByLocation(
    lat: number,
    lng: number,
    radiusKm: number = 50,
  ): Promise<Event[]> {
    return Array.from(this.events.values()).filter((event) => {
      if (!event.isActive) return false;

      const distance = this.calculateDistance(
        lat,
        lng,
        event.location.lat,
        event.location.lng,
      );
      return distance <= radiusKm;
    });
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const updatedEvent = {
      ...event,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.events.set(eventId, updatedEvent);
    return updatedEvent;
  }

  async joinEvent(eventId: string, userId: string): Promise<Event> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (!event.attendeeIds.includes(userId)) {
      event.attendeeIds.push(userId);
      event.currentAttendees = event.attendeeIds.length;
      event.updatedAt = new Date().toISOString();
      this.events.set(eventId, event);
    }

    return event;
  }

  async leaveEvent(eventId: string, userId: string): Promise<Event> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const index = event.attendeeIds.indexOf(userId);
    if (index > -1) {
      event.attendeeIds.splice(index, 1);
      event.currentAttendees = event.attendeeIds.length;
      event.updatedAt = new Date().toISOString();
      this.events.set(eventId, event);
    }

    return event;
  }

  // Payment operations
  async createPayment(
    paymentData: Omit<Payment, "id" | "createdAt">,
  ): Promise<Payment> {
    const id = `payment_${this.nextPaymentId++}`;
    const payment: Payment = {
      ...paymentData,
      id,
      createdAt: new Date().toISOString(),
    };

    this.payments.set(id, payment);
    return payment;
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (p) => p.userId === userId,
    );
  }

  async updatePaymentStatus(
    stripePaymentIntentId: string,
    status: "succeeded" | "failed",
  ): Promise<boolean> {
    // Find payment by stripe payment intent ID
    const payment = Array.from(this.payments.values()).find(
      (p) => p.stripePaymentIntentId === stripePaymentIntentId,
    );
    if (!payment) {
      throw new Error("Payment not found");
    }

    // Check if status is already the target status (idempotency)
    if (payment.status === status) {
      return false; // No update needed
    }

    payment.status = status;
    this.payments.set(payment.id, payment);
    return true; // Status was updated
  }

  async getPaymentByStripeId(
    stripePaymentIntentId: string,
  ): Promise<Payment | null> {
    const payment = Array.from(this.payments.values()).find(
      (p) => p.stripePaymentIntentId === stripePaymentIntentId,
    );
    return payment || null;
  }

  // Chat message operations
  async createChatMessage(
    messageData: InsertChatMessage,
  ): Promise<ChatMessage> {
    const id = `chat_${this.nextChatMessageId++}`;
    const message: ChatMessage = {
      ...messageData,
      id,
      reactions: [],
      isEdited: false,
      createdAt: new Date().toISOString(),
    };

    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessagesByCommunity(
    communityId: string,
    region?: string,
    thread?: string,
  ): Promise<ChatMessage[]> {
    const messages = Array.from(this.chatMessages.values())
      .filter((msg) => msg.communityId === communityId)
      .filter((msg) => !region || msg.region === region)
      .filter((msg) => !thread || msg.thread === thread)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    return messages;
  }

  async getMostActiveMembers(
    communityId: string,
    limit: number = 10,
  ): Promise<
    Array<{
      userId: string;
      userName: string;
      messageCount: number;
      user?: User;
    }>
  > {
    const messages = Array.from(this.chatMessages.values()).filter(
      (msg) => msg.communityId === communityId,
    );

    // Count messages per user
    const userMessageCount = new Map<
      string,
      { userId: string; userName: string; count: number }
    >();

    messages.forEach((msg) => {
      const existing = userMessageCount.get(msg.authorId);
      if (existing) {
        existing.count++;
      } else {
        userMessageCount.set(msg.authorId, {
          userId: msg.authorId,
          userName: msg.authorName,
          count: 1,
        });
      }
    });

    // Sort by message count and return top members with user data
    return Array.from(userMessageCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((userStat) => {
        const user = this.users.get(userStat.userId);
        return {
          userId: userStat.userId,
          userName: userStat.userName,
          messageCount: userStat.count,
          user: user || undefined,
        };
      });
  }

  async deleteChatMessage(messageId: string): Promise<boolean> {
    return this.chatMessages.delete(messageId);
  }

  // Direct message operations
  async createDirectMessage(
    messageData: InsertDirectMessage,
  ): Promise<DirectMessage> {
    const id = `dm_${this.nextDirectMessageId++}`;
    const message: DirectMessage = {
      ...messageData,
      id,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    this.directMessages.set(id, message);
    return message;
  }

  async getDirectMessagesByConversation(
    conversationId: string,
  ): Promise<DirectMessage[]> {
    return Array.from(this.directMessages.values())
      .filter((msg) => msg.conversationId === conversationId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }

  async getDirectMessagesBetweenUsers(
    senderId: string,
    recipientId: string,
  ): Promise<DirectMessage[]> {
    return Array.from(this.directMessages.values())
      .filter(
        (msg) =>
          (msg.senderId === senderId && msg.recipientId === recipientId) ||
          (msg.senderId === recipientId && msg.recipientId === senderId),
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }

  async markDirectMessageAsRead(messageId: string): Promise<DirectMessage> {
    const message = this.directMessages.get(messageId);
    if (!message) {
      throw new Error("Direct message not found");
    }

    message.isRead = true;
    message.readAt = new Date().toISOString();
    this.directMessages.set(messageId, message);

    return message;
  }

  async getUserConversations(userId: string): Promise<DirectMessage[]> {
    // Get the latest message from each conversation
    const conversationMap = new Map<string, DirectMessage>();

    Array.from(this.directMessages.values())
      .filter((msg) => msg.senderId === userId || msg.recipientId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .forEach((msg) => {
        if (!conversationMap.has(msg.conversationId)) {
          conversationMap.set(msg.conversationId, msg);
        }
      });

    return Array.from(conversationMap.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
}

// Global storage instance
export const storage = new MemStorage();
