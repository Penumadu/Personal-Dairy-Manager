'use client';

import { Item } from '@/types';
import { ItemCard } from '@/components/items/ItemCard';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Clock } from 'lucide-react';

interface TimelineViewProps {
  items: Item[];
  onEdit?: (item: Item) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, favorite: boolean) => void;
  onToggleArchive: (id: string, archived: boolean) => void;
}

/** Safely convert Firestore Timestamp or JS Date to JS Date */
function toDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date();
}

export function TimelineView({ items, onEdit, onDelete, onToggleFavorite, onToggleArchive }: TimelineViewProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in-up">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">No items in the timeline yet.</p>
      </div>
    );
  }

  // Group items by date using safe date conversion
  const groupedItems = items.reduce<Record<string, Item[]>>((acc, item) => {
    const date = format(toDate(item.createdAt), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedItems).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8 animate-in-up">
      {sortedDates.map((date) => (
        <div key={date} className="space-y-4">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-semibold whitespace-nowrap text-muted-foreground uppercase tracking-wider">
              {format(new Date(date + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
            </h3>
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground shrink-0">
              {groupedItems[date].length} item{groupedItems[date].length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 cards-grid">
            {groupedItems[date].map((item) => (
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
        </div>
      ))}
    </div>
  );
}
