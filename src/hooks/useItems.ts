import { useState, useEffect, useCallback, useRef } from 'react';
import { Item, ItemType } from '@/types';
import { getItems, createItem, updateItem, deleteItem, toggleFavorite, toggleArchive } from '@/lib/firestore';
import { toast } from 'sonner';

interface UseItemsOptions {
  type?: ItemType;
  archived?: boolean;
  favorite?: boolean;
  search?: string;
  tags?: string[];
}

export function useItems(userId: string | null, options?: UseItemsOptions) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // Destructure to primitives so dependency arrays are stable
  const type = options?.type;
  const archived = options?.archived;
  const favorite = options?.favorite;
  const search = options?.search;
  const tagsKey = options?.tags?.join(',');

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchItems = useCallback(async () => {
    if (!userId) {
      if (mountedRef.current) { setItems([]); setLoading(false); }
      return;
    }
    if (mountedRef.current) setLoading(true);
    try {
      const data = await getItems(userId, { type, archived, favorite, search, tags: tagsKey ? tagsKey.split(',') : undefined });
      if (mountedRef.current) setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
      if (mountedRef.current) toast.error('Failed to load items');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, type, archived, favorite, search, tagsKey]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (data: Omit<Item, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'favorite' | 'archived' | 'reminderSent'>) => {
    if (!userId) return;
    try {
      await createItem(userId, data);
      // Re-fetch so we get proper Firestore Timestamps back
      await fetchItems();
      toast.success('Item saved!');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to save item');
    }
  };

  const editItem = async (itemId: string, data: Partial<Omit<Item, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    if (!userId) return;
    try {
      await updateItem(userId, itemId, data);
      // Re-fetch to get fresh data
      await fetchItems();
      toast.success('Item updated!');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  const removeItem = async (itemId: string) => {
    if (!userId) return;
    try {
      await deleteItem(userId, itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Item deleted');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const toggleItemFavorite = async (itemId: string, fav: boolean) => {
    if (!userId) return;
    try {
      await toggleFavorite(userId, itemId, fav);
      setItems(prev => prev.map(item => item.id === itemId ? { ...item, favorite: fav } : item));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite');
    }
  };

  const toggleItemArchive = async (itemId: string, arc: boolean) => {
    if (!userId) return;
    try {
      await toggleArchive(userId, itemId, arc);
      setItems(prev => prev.filter(item => item.id !== itemId));
      toast.success(arc ? 'Item archived' : 'Item restored');
    } catch (error) {
      console.error('Error toggling archive:', error);
      toast.error('Failed to update archive status');
    }
  };

  return {
    items,
    loading,
    addItem,
    editItem,
    removeItem,
    toggleItemFavorite,
    toggleItemArchive,
    refresh: fetchItems,
  };
}
