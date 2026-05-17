'use client';

import { useState } from 'react';
import { Item } from '@/types';
import { ItemCard } from '@/components/items/ItemCard';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
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

const TYPE_COLORS: Record<string, string> = {
  url:      'bg-blue-500',
  note:     'bg-emerald-500',
  youtube:  'bg-red-500',
  reminder: 'bg-amber-500',
};

export function CalendarView({ items, onEdit, onDelete, onToggleFavorite, onToggleArchive }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Day of week for first day (0 = Sunday)
  const startDay = getDay(monthStart);

  // Get items for selected date (safe toDate)
  const selectedDateItems = selectedDate
    ? items.filter(item => isSameDay(toDate(item.createdAt), selectedDate))
    : [];

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4 animate-in-up">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-px mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before month starts */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days of the month */}
            {days.map((day) => {
              const dayItems = items.filter(item => isSameDay(toDate(item.createdAt), day));
              const hasItems = dayItems.length > 0;
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => hasItems && setSelectedDate(day)}
                  className={cn(
                    'aspect-square p-1 flex flex-col items-start justify-start rounded-lg transition-all text-left',
                    !isCurrentMonth && 'opacity-30',
                    isToday && 'bg-primary/10 ring-1 ring-primary/30',
                    hasItems && 'hover:bg-muted cursor-pointer',
                    !hasItems && 'cursor-default',
                  )}
                >
                  <span className={cn(
                    'text-xs font-medium leading-none',
                    isToday && 'text-primary font-bold',
                  )}>
                    {format(day, 'd')}
                  </span>
                  {hasItems && (
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {dayItems.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          className={cn('w-1.5 h-1.5 rounded-full', TYPE_COLORS[item.type] ?? 'bg-primary')}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Items Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDateItems.map((item) => (
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
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
