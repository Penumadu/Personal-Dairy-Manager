import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import { Item, ItemFormData, ItemType } from '@/types';

const ITEMS_COLLECTION = 'items';

function getDb() {
  if (!db) throw new Error('Firebase not initialized');
  return db;
}

export async function createItem(userId: string, data: ItemFormData): Promise<string> {
  const firestore = getDb();
  const itemsRef = collection(firestore, `users/${userId}/${ITEMS_COLLECTION}`);

  // Properly convert Date → Timestamp for reminderDate
  const reminderDate = data.reminderDate instanceof Date
    ? Timestamp.fromDate(data.reminderDate as unknown as Date)
    : data.reminderDate ?? null;

  const docRef = await addDoc(itemsRef, {
    ...data,
    reminderDate,
    userId,
    favorite: false,
    archived: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    reminderSent: false,
  });
  return docRef.id;
}

export async function updateItem(userId: string, itemId: string, data: Partial<Item>): Promise<void> {
  const firestore = getDb();
  const itemRef = doc(firestore, `users/${userId}/${ITEMS_COLLECTION}`, itemId);

  // Properly convert Date → Timestamp if reminderDate is a plain Date
  const payload = { ...data };
  if (payload.reminderDate instanceof Date) {
    payload.reminderDate = Timestamp.fromDate(payload.reminderDate as unknown as Date);
  }

  await updateDoc(itemRef, {
    ...payload,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteItem(userId: string, itemId: string): Promise<void> {
  const firestore = getDb();
  const itemRef = doc(firestore, `users/${userId}/${ITEMS_COLLECTION}`, itemId);
  await deleteDoc(itemRef);
}

export async function getItem(userId: string, itemId: string): Promise<Item | null> {
  const firestore = getDb();
  const itemRef = doc(firestore, `users/${userId}/${ITEMS_COLLECTION}`, itemId);
  const docSnap = await getDoc(itemRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Item;
}

export async function getItems(userId: string, options?: {
  type?: ItemType;
  archived?: boolean;
  favorite?: boolean;
  search?: string;
  tags?: string[];
}): Promise<Item[]> {
  const constraints: QueryConstraint[] = [];

  if (options?.type) {
    constraints.push(where('type', '==', options.type));
  }
  if (options?.archived !== undefined) {
    constraints.push(where('archived', '==', options.archived));
  }
  if (options?.favorite) {
    constraints.push(where('favorite', '==', true));
  }

  const firestore = getDb();
  const itemsRef = collection(firestore, `users/${userId}/${ITEMS_COLLECTION}`);
  const q = query(itemsRef, ...constraints);
  const snapshot = await getDocs(q);

  let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));

  // Sort by createdAt descending on client side (avoids composite index requirement)
  items.sort((a, b) => {
    const timeA = a.createdAt?.toDate?.()?.getTime() ?? 0;
    const timeB = b.createdAt?.toDate?.()?.getTime() ?? 0;
    return timeB - timeA;
  });

  if (options?.search) {
    const search = options.search.toLowerCase();
    items = items.filter(item =>
      item.title.toLowerCase().includes(search) ||
      item.content.toLowerCase().includes(search) ||
      item.tags.some(tag => tag.toLowerCase().includes(search))
    );
  }

  if (options?.tags?.length) {
    items = items.filter(item =>
      options.tags!.some(tag => item.tags.includes(tag))
    );
  }

  return items;
}

export async function toggleFavorite(userId: string, itemId: string, favorite: boolean): Promise<void> {
  await updateItem(userId, itemId, { favorite });
}

export async function toggleArchive(userId: string, itemId: string, archived: boolean): Promise<void> {
  await updateItem(userId, itemId, { archived });
}

export async function markReminderSent(userId: string, itemId: string): Promise<void> {
  await updateItem(userId, itemId, { reminderSent: true });
}
