import { Timestamp } from 'firebase/firestore';

export type ItemType = 'url' | 'note' | 'youtube' | 'reminder';

export interface ItemMetadata {
  favicon?: string;
  thumbnail?: string;
  domain?: string;
  duration?: string;
}

export interface Item {
  id: string;
  userId: string;
  type: ItemType;
  title: string;
  content: string;
  tags: string[];
  favorite: boolean;
  archived: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  reminderDate?: Timestamp;
  reminderSent?: boolean;
  reminderPhone?: string;
  reminderEmail?: string;
  metadata?: ItemMetadata;
}

export type ItemFormData = Omit<Item, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'favorite' | 'archived' | 'reminderSent'>;

/** Used when editing an existing item — all fields optional except id */
export type EditItemData = Partial<Omit<Item, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export type ViewMode = 'list' | 'timeline' | 'calendar';

export type ThemeMode = 'light' | 'dark' | 'system';
