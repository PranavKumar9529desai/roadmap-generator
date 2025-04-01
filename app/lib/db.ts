import Dexie, { type Table } from 'dexie';

export interface PlacedEvent {
  id: string; // Corresponds to the event ID from draggableEventsList
  start?: string | Date | null; // Store the start date when placed
  end?: string | Date | null; // Store the end date if applicable
  title: string; // Store the title for easier reference
}

export class MySubClassedDexie extends Dexie {
  placedEvents!: Table<PlacedEvent>;

  constructor() {
    super('roadmapDB');
    this.version(1).stores({
      placedEvents: 'id, start, title', // Primary key 'id', index 'start' and 'title'
    });
  }
}

export const db = new MySubClassedDexie();
