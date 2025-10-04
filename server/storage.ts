import { 
  Story, 
  InsertStory, 
  Crisis, 
  ModerationAction, 
  SelectStory,
  User,
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
  InsertDirectMessage
} from '../shared/schema';

export interface IStorage {
  // Story management
  createStory(story: InsertStory & { submitterIP?: string; submitterUserAgent?: string }): Promise<Story>;
  getStoryById(id: string): Promise<Story | null>;
  getStoriesByCrisis(crisisId: string, includeModerated?: boolean): Promise<Story[]>;
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
  isLocationWithinCrisis(userLat: number, userLng: number, crisisId: string): Promise<boolean>;

  // User operations
  createOrUpdateUser(googleUser: any): Promise<User>;
  getUserById(userId: string): Promise<User | null>;
  getUserByGoogleId(googleId: string): Promise<User | null>;
  updateUserVerifiedHostStatus(userId: string, isVerified: boolean, expiresAt?: string): Promise<User>;
  
  // Community operations
  createCommunity(community: InsertCommunity & { createdBy: string }): Promise<Community>;
  getAllCommunities(): Promise<Community[]>;
  getCommunityById(communityId: string): Promise<Community | null>;
  getCommunityByCrisisId(crisisId: string): Promise<Community | null>;
  getCommunitiesByCreator(userId: string): Promise<Community[]>;
  updateCommunity(communityId: string, updates: Partial<Community>): Promise<Community>;
  
  // Discussion operations
  createDiscussion(discussion: InsertDiscussion): Promise<Discussion>;
  getDiscussionsByCommunity(communityId: string, isLocal?: boolean): Promise<Discussion[]>;
  getLocalDiscussionsByUserLocation(communityId: string, userLat: number, userLng: number, radiusKm?: number): Promise<Discussion[]>;
  likeDiscussion(discussionId: string): Promise<Discussion>;
  
  // Event operations
  createEvent(event: InsertEvent & { createdBy: string }): Promise<Event>;
  getAllEvents(): Promise<Event[]>;
  getEventsByCreator(userId: string): Promise<Event[]>;
  getEventsByLocation(lat: number, lng: number, radiusKm?: number): Promise<Event[]>;
  updateEvent(eventId: string, updates: Partial<Event>): Promise<Event>;
  joinEvent(eventId: string, userId: string): Promise<Event>;
  leaveEvent(eventId: string, userId: string): Promise<Event>;
  
  // Payment operations
  createPayment(payment: Omit<Payment, 'id'>): Promise<Payment>;
  getPaymentsByUser(userId: string): Promise<Payment[]>;
  updatePaymentStatus(stripePaymentIntentId: string, status: 'succeeded' | 'failed'): Promise<boolean>;
  getPaymentByStripeId(stripePaymentIntentId: string): Promise<Payment | null>;
  
  // Chat message operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesByCommunity(communityId: string, region?: string): Promise<ChatMessage[]>;
  getMostActiveMembers(communityId: string, limit?: number): Promise<Array<{userId: string, userName: string, messageCount: number}>>;
  deleteChatMessage(messageId: string): Promise<boolean>;
  
  // Direct message operations
  createDirectMessage(message: InsertDirectMessage): Promise<DirectMessage>;
  getDirectMessagesByConversation(conversationId: string): Promise<DirectMessage[]>;
  getDirectMessagesBetweenUsers(senderId: string, recipientId: string): Promise<DirectMessage[]>;
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
        id: '1',
        name: 'Eastern Europe Refugee Crisis',
        location: { lat: 49.8397, lng: 24.0297, name: 'Eastern Europe' },
        severity: 'Critical',
        isActive: true,
        allowStorySubmissions: true,
      },
      {
        id: 'gaza-2024',
        name: 'Gaza Humanitarian Crisis',
        location: { lat: 31.5017, lng: 34.4668, name: 'Gaza, Palestine' },
        severity: 'Critical',
        isActive: true,
        allowStorySubmissions: true,
      },
      {
        id: 'ukraine-conflict',
        name: 'Ukraine Conflict',
        location: { lat: 50.4501, lng: 30.5234, name: 'Kyiv, Ukraine' },
        severity: 'Critical',
        isActive: true,
        allowStorySubmissions: true,
      },
      {
        id: 'syria-crisis',
        name: 'Syria Humanitarian Crisis',
        location: { lat: 36.2021, lng: 38.9968, name: 'Aleppo, Syria' },
        severity: 'High',
        isActive: true,
        allowStorySubmissions: true,
      },
      {
        id: 'sudan-crisis',
        name: 'Sudan Crisis',
        location: { lat: 15.5007, lng: 32.5599, name: 'Khartoum, Sudan' },
        severity: 'Critical',
        isActive: true,
        allowStorySubmissions: true,
      },
    ];

    sampleCrises.forEach(crisis => {
      this.crises.set(crisis.id, crisis);
    });
    
    // Create crisis-specific communities
    this.createCrisisCommunities();
  }
  
  private createCrisisCommunities() {
    const crisisCommunitiesData = [
      {
        id: 'crisis_community_gaza-2024',
        crisisId: 'gaza-2024',
        name: 'Gaza Crisis Support Community',
        description: 'Community supporting those affected by the Gaza humanitarian crisis',
        category: 'Crisis Response',
      },
      {
        id: 'crisis_community_ukraine-conflict',
        crisisId: 'ukraine-conflict',
        name: 'Ukraine Crisis Support Community',
        description: 'Supporting those affected by the Ukraine conflict',
        category: 'Crisis Response',
      },
      {
        id: 'crisis_community_syria-crisis',
        crisisId: 'syria-crisis',
        name: 'Syria Crisis Support Community',
        description: 'Aid and support for Syrian crisis victims',
        category: 'Humanitarian',
      },
      {
        id: 'crisis_community_sudan-crisis',
        crisisId: 'sudan-crisis',
        name: 'Sudan Crisis Support Community',
        description: 'Supporting those affected by the Sudan crisis',
        category: 'Crisis Response',
      },
      {
        id: 'crisis_community_1',
        crisisId: '1',
        name: 'Eastern Europe Refugee Support',
        description: 'Support community for Eastern Europe refugee crisis',
        category: 'Humanitarian',
      },
    ];
    
    crisisCommunitiesData.forEach(data => {
      const community: Community = {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category as any,
        isActive: true,
        memberCount: 0,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.communities.set(data.id, community);
    });
  }

  private initializeSampleCommunities() {
    const sampleCommunities: Community[] = [
      {
        id: 'community_1',
        name: 'Climate Action SF',
        description: 'A community dedicated to environmental action and climate change awareness in San Francisco',
        category: 'Environmental',
        isActive: true,
        memberCount: 1247,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: 'user_1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'community_2',
        name: 'Tech Workers Unite',
        description: 'Supporting tech workers and promoting ethical technology practices worldwide',
        category: 'Technology',
        isActive: true,
        memberCount: 3521,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: 'user_2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'community_3',
        name: 'Neighborhood Watch - Mission District',
        description: 'Local safety and community building in Mission District',
        category: 'Safety',
        isActive: true,
        memberCount: 892,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: 'user_3',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'community_4',
        name: 'Crisis Relief Network',
        description: 'Global network for coordinating humanitarian aid and crisis response',
        category: 'Humanitarian',
        isActive: true,
        memberCount: 15674,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: 'user_4',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'community_5',
        name: 'Local Food Co-op',
        description: 'Community-supported agriculture and local food networks',
        category: 'Food',
        isActive: true,
        memberCount: 432,
        globalDiscussions: [],
        localDiscussions: [],
        createdBy: 'user_5',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    sampleCommunities.forEach(community => {
      this.communities.set(community.id, community);
    });
    
    this.nextCommunityId = 6; // Start at 6 since we have 5 sample communities
  }

  private generateStoryId(): string {
    return (this.nextStoryId++).toString();
  }

  async createStory(storyData: InsertStory & { submitterIP?: string; submitterUserAgent?: string }): Promise<Story> {
    const id = this.generateStoryId();
    const story: Story = {
      ...storyData,
      id,
      likes: 0,
      moderationStatus: 'pending',
      submittedAt: new Date().toISOString(),
    };

    this.stories.set(id, story);
    return story;
  }

  async getStoryById(id: string): Promise<Story | null> {
    return this.stories.get(id) || null;
  }

  async getStoriesByCrisis(crisisId: string, includeModerated = true): Promise<Story[]> {
    const stories = Array.from(this.stories.values()).filter(
      story => story.location.crisisId === crisisId
    );

    if (!includeModerated) {
      return stories.filter(story => story.moderationStatus === 'approved');
    }

    return stories;
  }

  async getApprovedStoriesByCrisis(crisisId: string): Promise<Story[]> {
    return Array.from(this.stories.values()).filter(
      story => story.location.crisisId === crisisId && story.moderationStatus === 'approved'
    );
  }

  async getPendingStories(): Promise<Story[]> {
    return Array.from(this.stories.values()).filter(
      story => story.moderationStatus === 'pending'
    );
  }

  async updateStoryModerationStatus(action: ModerationAction): Promise<Story> {
    const story = this.stories.get(action.storyId);
    if (!story) {
      throw new Error('Story not found');
    }

    story.moderationStatus = action.action === 'approve' ? 'approved' : 
                            action.action === 'reject' ? 'rejected' : 'flagged';
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
      throw new Error('Story not found');
    }

    story.likes += 1;
    this.stories.set(storyId, story);
    return story;
  }

  async getCrisisById(id: string): Promise<Crisis | null> {
    return this.crises.get(id) || null;
  }

  async getAllActiveCrises(): Promise<Crisis[]> {
    return Array.from(this.crises.values()).filter(crisis => crisis.isActive);
  }

  async updateCrisis(id: string, crisisUpdate: Partial<Crisis>): Promise<Crisis> {
    const crisis = this.crises.get(id);
    if (!crisis) {
      throw new Error('Crisis not found');
    }

    const updatedCrisis = { ...crisis, ...crisisUpdate };
    this.crises.set(id, updatedCrisis);
    return updatedCrisis;
  }

  async isLocationWithinCrisis(userLat: number, userLng: number, crisisId: string): Promise<boolean> {
    const crisis = await this.getCrisisById(crisisId);
    if (!crisis) return false;

    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(userLat, userLng, crisis.location.lat, crisis.location.lng);
    
    // Allow submissions within 50km of crisis center
    return distance <= 50;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // User operations
  async createOrUpdateUser(googleUser: any): Promise<User> {
    // Check if user already exists
    let existingUser = Array.from(this.users.values()).find(u => u.googleId === googleUser.id);
    
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
    return Array.from(this.users.values()).find(u => u.googleId === googleId) || null;
  }

  async updateUserVerifiedHostStatus(userId: string, isVerified: boolean, expiresAt?: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.isVerifiedHost = isVerified;
    user.verifiedHostExpiresAt = expiresAt;
    if (isVerified) {
      user.verifiedAt = new Date().toISOString();
    }

    this.users.set(userId, user);
    return user;
  }

  // Community operations
  async createCommunity(communityData: InsertCommunity & { createdBy: string }): Promise<Community> {
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

  async getAllCommunities(): Promise<Community[]> {
    return Array.from(this.communities.values()).filter(c => c.isActive);
  }

  async getCommunityById(communityId: string): Promise<Community | null> {
    return this.communities.get(communityId) || null;
  }
  
  async getCommunityByCrisisId(crisisId: string): Promise<Community | null> {
    const communityId = `crisis_community_${crisisId}`;
    return this.communities.get(communityId) || null;
  }

  async getCommunitiesByCreator(userId: string): Promise<Community[]> {
    return Array.from(this.communities.values()).filter(c => c.createdBy === userId && c.isActive);
  }

  async updateCommunity(communityId: string, updates: Partial<Community>): Promise<Community> {
    const community = this.communities.get(communityId);
    if (!community) {
      throw new Error('Community not found');
    }

    const updatedCommunity = { 
      ...community, 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.communities.set(communityId, updatedCommunity);
    return updatedCommunity;
  }

  // Discussion operations
  async createDiscussion(discussionData: InsertDiscussion): Promise<Discussion> {
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

  async getDiscussionsByCommunity(communityId: string, isLocal?: boolean): Promise<Discussion[]> {
    const discussions = Array.from(this.discussions.values()).filter(d => d.communityId === communityId);
    
    if (isLocal !== undefined) {
      return discussions.filter(d => d.isLocal === isLocal);
    }
    
    return discussions;
  }

  async getLocalDiscussionsByUserLocation(communityId: string, userLat: number, userLng: number, radiusKm: number = 50): Promise<Discussion[]> {
    const localDiscussions = await this.getDiscussionsByCommunity(communityId, true);
    
    return localDiscussions.filter(discussion => {
      if (!discussion.authorLocation) return false;
      
      const distance = this.calculateDistance(
        userLat, 
        userLng, 
        discussion.authorLocation.lat, 
        discussion.authorLocation.lng
      );
      
      return distance <= radiusKm;
    });
  }

  async likeDiscussion(discussionId: string): Promise<Discussion> {
    const discussion = this.discussions.get(discussionId);
    if (!discussion) {
      throw new Error('Discussion not found');
    }

    discussion.likes += 1;
    discussion.updatedAt = new Date().toISOString();
    this.discussions.set(discussionId, discussion);
    return discussion;
  }

  // Event operations
  async createEvent(eventData: InsertEvent & { createdBy: string }): Promise<Event> {
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
    return Array.from(this.events.values()).filter(e => e.isActive);
  }

  async getEventsByCreator(userId: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter(e => e.createdBy === userId && e.isActive);
  }

  async getEventsByLocation(lat: number, lng: number, radiusKm: number = 50): Promise<Event[]> {
    return Array.from(this.events.values()).filter(event => {
      if (!event.isActive) return false;
      
      const distance = this.calculateDistance(lat, lng, event.location.lat, event.location.lng);
      return distance <= radiusKm;
    });
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const updatedEvent = { 
      ...event, 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    this.events.set(eventId, updatedEvent);
    return updatedEvent;
  }

  async joinEvent(eventId: string, userId: string): Promise<Event> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error('Event not found');
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
      throw new Error('Event not found');
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
  async createPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
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
    return Array.from(this.payments.values()).filter(p => p.userId === userId);
  }

  async updatePaymentStatus(stripePaymentIntentId: string, status: 'succeeded' | 'failed'): Promise<boolean> {
    // Find payment by stripe payment intent ID
    const payment = Array.from(this.payments.values()).find(p => p.stripePaymentIntentId === stripePaymentIntentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Check if status is already the target status (idempotency)
    if (payment.status === status) {
      return false; // No update needed
    }

    payment.status = status;
    this.payments.set(payment.id, payment);
    return true; // Status was updated
  }

  async getPaymentByStripeId(stripePaymentIntentId: string): Promise<Payment | null> {
    const payment = Array.from(this.payments.values()).find(p => p.stripePaymentIntentId === stripePaymentIntentId);
    return payment || null;
  }

  // Chat message operations
  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
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

  async getChatMessagesByCommunity(communityId: string, region?: string): Promise<ChatMessage[]> {
    const messages = Array.from(this.chatMessages.values())
      .filter(msg => msg.communityId === communityId)
      .filter(msg => !region || msg.region === region)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    return messages;
  }
  
  async getMostActiveMembers(communityId: string, limit: number = 10): Promise<Array<{userId: string, userName: string, messageCount: number}>> {
    const messages = Array.from(this.chatMessages.values())
      .filter(msg => msg.communityId === communityId);
    
    // Count messages per user
    const userMessageCount = new Map<string, {userId: string, userName: string, count: number}>();
    
    messages.forEach(msg => {
      const existing = userMessageCount.get(msg.authorId);
      if (existing) {
        existing.count++;
      } else {
        userMessageCount.set(msg.authorId, {
          userId: msg.authorId,
          userName: msg.authorName,
          count: 1
        });
      }
    });
    
    // Sort by message count and return top members
    return Array.from(userMessageCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(user => ({
        userId: user.userId,
        userName: user.userName,
        messageCount: user.count
      }));
  }

  async deleteChatMessage(messageId: string): Promise<boolean> {
    return this.chatMessages.delete(messageId);
  }

  // Direct message operations
  async createDirectMessage(messageData: InsertDirectMessage): Promise<DirectMessage> {
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

  async getDirectMessagesByConversation(conversationId: string): Promise<DirectMessage[]> {
    return Array.from(this.directMessages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async getDirectMessagesBetweenUsers(senderId: string, recipientId: string): Promise<DirectMessage[]> {
    return Array.from(this.directMessages.values())
      .filter(msg => 
        (msg.senderId === senderId && msg.recipientId === recipientId) ||
        (msg.senderId === recipientId && msg.recipientId === senderId)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async markDirectMessageAsRead(messageId: string): Promise<DirectMessage> {
    const message = this.directMessages.get(messageId);
    if (!message) {
      throw new Error('Direct message not found');
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
      .filter(msg => msg.senderId === userId || msg.recipientId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .forEach(msg => {
        if (!conversationMap.has(msg.conversationId)) {
          conversationMap.set(msg.conversationId, msg);
        }
      });

    return Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

// Global storage instance
export const storage = new MemStorage();