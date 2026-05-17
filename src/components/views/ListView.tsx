'use client';

import { Item } from '@/types';
import { ItemCard } from '@/components/items/ItemCard';
import { LayoutList } from 'lucide-react';

interface ListViewProps {
  items: Item[];
  onEdit?: (item: Item) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, favorite: boolean) => void;
  onToggleArchive: (id: string, archived: boolean) => void;
}

export function ListView({ items, onEdit, onDelete, onToggleFavorite, onToggleArchive }: ListViewProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in-up">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <LayoutList className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">No items to show here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 cards-grid">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          onToggleArchive={onToggleArchive}
        />
      ))}
    </div>
  );
}
