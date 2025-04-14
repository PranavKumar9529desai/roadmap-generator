import Dexie, { type Table } from 'dexie';

export interface PlacedEvent {
  id: string; // Corresponds to the event ID from draggableEventsList
  start?: string | Date | null; // Store the start date when placed
  end?: string | Date | null; // Store the end date if applicable
  title: string; // Store the title for easier reference
}

export interface UserProfile {
  id: string; // Use 'user' as a singleton ID for single user apps
  name: string;
  education?: string;
  pastExperience?: string;
  learningGoals?: string;
  avatarFallback: string;
  currentGoal?: string;
  dailyTimeCommitment?: string; // How much time user can spend daily
  priorKnowledge?: string; // User's prior knowledge level
  updatedAt: Date; // Track when the profile was last updated
}

export interface UserActivity {
  id?: number; // Auto-incremented ID
  date: string; // ISO string date (YYYY-MM-DD)
  count: number; // Number of activities on this date
  type: string; // Type of activity (e.g., 'chat', 'profile-update', etc.)
}

// Check if IndexedDB is available in the current environment
const isIndexedDBAvailable = () => {
  try {
    return typeof window !== 'undefined' && 
           typeof window.indexedDB !== 'undefined' &&
           window.indexedDB !== null;
  } catch (e) {
    return false;
  }
};

export class MySubClassedDexie extends Dexie {
  placedEvents!: Table<PlacedEvent>;
  userProfiles!: Table<UserProfile>;
  userActivities!: Table<UserActivity>;

  constructor() {
    super('roadmapDB');
    this.version(1).stores({
      placedEvents: 'id, start, title', // Primary key 'id', index 'start' and 'title'
    });
    
    // Add version upgrade to add userProfiles table
    this.version(2).stores({
      placedEvents: 'id, start, title', // Keep existing table
      userProfiles: 'id, name, updatedAt' // New table for user profiles
    });
    
    // Add version upgrade to add userActivities table
    this.version(3).stores({
      placedEvents: 'id, start, title', // Keep existing table
      userProfiles: 'id, name, updatedAt', // Keep existing table
      userActivities: '++id, date, type' // New table for tracking user activities
    });
    
    // Add version upgrade for new profile fields
    this.version(4).stores({
      placedEvents: 'id, start, title', // Keep existing table
      userProfiles: 'id, name, updatedAt', // Keep existing table schema
      userActivities: '++id, date, type' // Keep existing table
    });
  }
}

// Create the database instance only if IndexedDB is available
export const db = isIndexedDBAvailable() ? new MySubClassedDexie() : null;

// In-memory fallback storage when IndexedDB is not available
const memoryStore = {
  userProfile: null as UserProfile | null,
  activities: [] as UserActivity[],
  placedEvents: [] as PlacedEvent[]
};

// Helper function to get user profile
export async function getUserProfile(): Promise<UserProfile | undefined> {
  if (db) {
    return await db.userProfiles.get('user');
  } else {
    console.warn('IndexedDB not available, using in-memory storage for user profile');
    return memoryStore.userProfile || undefined;
  }
}

// Helper function to save user profile
export async function saveUserProfile(profile: Omit<UserProfile, 'id' | 'updatedAt'>): Promise<string> {
  const userProfile: UserProfile = {
    id: 'user', // Always use 'user' as ID for single-user apps
    ...profile,
    updatedAt: new Date()
  };
  
  if (db) {
    await db.userProfiles.put(userProfile);
  } else {
    console.warn('IndexedDB not available, using in-memory storage for user profile');
    memoryStore.userProfile = userProfile;
  }
  
  // Record this as an activity
  await recordActivity('profile-update');
  
  return userProfile.id;
}

// Helper function to record user activity
export async function recordActivity(type = 'chat'): Promise<void> {
  const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
  
  if (db) {
    // Try to find an existing activity for today
    const existingActivity = await db.userActivities
      .where('date')
      .equals(today)
      .first();
    
    if (existingActivity && existingActivity.id !== undefined) {
      // Update existing activity count
      await db.userActivities.update(existingActivity.id, {
        count: existingActivity.count + 1
      });
    } else {
      // Create new activity for today
      await db.userActivities.add({
        date: today,
        count: 1,
        type
      });
    }
  } else {
    console.warn('IndexedDB not available, using in-memory storage for activity');
    // Look for existing activity in memory store
    const existingActivityIndex = memoryStore.activities.findIndex(
      activity => activity.date === today
    );
    
    if (existingActivityIndex >= 0) {
      // Update existing activity
      memoryStore.activities[existingActivityIndex].count += 1;
    } else {
      // Add new activity
      memoryStore.activities.push({
        date: today,
        count: 1,
        type
      });
    }
  }
}

// Helper function to get all user activities
export async function getUserActivities(): Promise<UserActivity[]> {
  if (db) {
    return await db.userActivities.toArray();
  } else {
    console.warn('IndexedDB not available, using in-memory storage for activities');
    return [...memoryStore.activities];
  }
}

// Helper functions for PlacedEvents

// Get placed events from database or in-memory storage
export async function getPlacedEvents(): Promise<PlacedEvent[]> {
  if (db) {
    return await db.placedEvents.toArray();
  } else {
    console.warn('IndexedDB not available, using in-memory storage for placed events');
    return [...memoryStore.placedEvents];
  }
}

// Get a placed event by ID
export async function getPlacedEventById(id: string): Promise<PlacedEvent | undefined> {
  if (db) {
    return await db.placedEvents.get(id);
  } else {
    console.warn('IndexedDB not available, using in-memory storage for placed event');
    return memoryStore.placedEvents.find(event => event.id === id);
  }
}

// Save a placed event
export async function savePlacedEvent(event: PlacedEvent): Promise<string> {
  if (db) {
    await db.placedEvents.put(event);
  } else {
    console.warn('IndexedDB not available, using in-memory storage for placed event');
    // Remove existing event with same ID if it exists
    const existingIndex = memoryStore.placedEvents.findIndex(e => e.id === event.id);
    if (existingIndex >= 0) {
      memoryStore.placedEvents.splice(existingIndex, 1);
    }
    // Add the new/updated event
    memoryStore.placedEvents.push(event);
  }
  
  // Record this as an activity
  await recordActivity('roadmap-update');
  
  return event.id;
}

// Delete a placed event
export async function deletePlacedEvent(id: string): Promise<void> {
  if (db) {
    await db.placedEvents.delete(id);
  } else {
    console.warn('IndexedDB not available, using in-memory storage for placed event deletion');
    const existingIndex = memoryStore.placedEvents.findIndex(e => e.id === id);
    if (existingIndex >= 0) {
      memoryStore.placedEvents.splice(existingIndex, 1);
    }
  }
  
  // Record this as an activity
  await recordActivity('roadmap-delete');
}

// Clear all placed events
export async function clearPlacedEvents(): Promise<void> {
  if (db) {
    await db.placedEvents.clear();
  } else {
    console.warn('IndexedDB not available, using in-memory storage for clearing placed events');
    memoryStore.placedEvents = [];
  }
}
