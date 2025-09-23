import { Story, InsertStory, Crisis, ModerationAction, SelectStory } from '../shared/schema';

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
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private stories: Map<string, Story> = new Map();
  private crises: Map<string, Crisis> = new Map();
  private nextStoryId = 1;

  constructor() {
    // Initialize with some sample crisis data
    this.initializeSampleCrises();
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
}

// Global storage instance
export const storage = new MemStorage();