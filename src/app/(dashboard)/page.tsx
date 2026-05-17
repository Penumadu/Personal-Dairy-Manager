'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { useItems } from '@/hooks/useItems';
import { Item, ItemFormData, ItemType, ViewMode } from '@/types';
import { AddItemDialog } from '@/components/items/AddItemDialog';
import { ListView } from '@/components/views/ListView';
import { TimelineView } from '@/components/views/TimelineView';
import { CalendarView } from '@/components/views/CalendarView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, LayoutList, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const VIEW_TABS: { value: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'list',     label: 'List',     icon: LayoutList },
  { value: 'timeline', label: 'Timeline', icon: Clock },
  { value: 'calendar', label: 'Calendar', icon: Calendar },
];

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const { user } = useAuthContext();

  const [filterType, setFilterType] = useState<ItemType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Derive view mode from URL param — single source of truth
  const viewParam = searchParams.get('view');
  const viewMode: ViewMode =
    viewParam === 'timeline' ? 'timeline' :
    viewParam === 'calendar' ? 'calendar' : 'list';

  // For Favorites, pass the favorite filter. For Archived, pass archived=true.
  const isFavorites = viewParam === 'favorites';
  const isArchived  = viewParam === 'archived';

  const { items, loading, addItem, editItem, removeItem, toggleItemFavorite, toggleItemArchive } = useItems(
    user?.uid || null,
    {
      type:     filterType === 'all' ? undefined : filterType,
      archived: isArchived ? true : isFavorites ? false : undefined,
      favorite: isFavorites ? true : undefined,
      search:   searchQuery || undefined,
    }
  );

  // Client-side favorites filter (belt-and-suspenders since Firestore query already filters)
  const filteredItems = useMemo(() => {
    if (isFavorites) return items.filter(item => item.favorite);
    return items;
  }, [items, isFavorites]);

  const pageTitle =
    viewParam === 'favorites' ? 'Favorites' :
    viewParam === 'archived'  ? 'Archived' :
    viewParam === 'timeline'  ? 'Timeline' :
    viewParam === 'calendar'  ? 'Calendar' : 'All Items';

  // Edit handler — open dialog with pre-populated item
  const handleEdit = useCallback((item: Item) => {
    setEditingItem(item);
    setShowAddDialog(true);
  }, []);

  // Submit handler — either create new or update existing
  const handleSubmit = useCallback(async (data: ItemFormData) => {
    if (editingItem) {
      await editItem(editingItem.id, data);
      setEditingItem(null);
    } else {
      await addItem(data);
    }
  }, [editingItem, editItem, addItem]);

  // When dialog closes, clear editing state
  const handleDialogOpenChange = useCallback((open: boolean) => {
    setShowAddDialog(open);
    if (!open) setEditingItem(null);
  }, []);

  // Show/hide filters section (not useful in Favorites/Archived/Calendar)
  const showFilters = !isFavorites && !isArchived && viewMode !== 'calendar';

  return (
    <div className="space-y-8 page-enter max-w-5xl mx-auto pt-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="font-display italic font-medium text-4xl tracking-tight">{pageTitle}</h1>
          {!loading && (
            <p className="text-muted-foreground mt-2 text-sm font-medium tracking-wide uppercase">
              {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2 shrink-0 rounded-full px-6">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Search + Filter (only for All/Timeline) */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={(v) => setFilterType(v as ItemType | 'all')}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="note">Notes</SelectItem>
              <SelectItem value="url">URLs</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="reminder">Reminders</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* View Mode Tabs (only when viewing All/non-special views) */}
      {!isFavorites && !isArchived && (
        <div className="flex gap-4 border-b border-border/50 pb-px">
          {VIEW_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = viewMode === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  // Update URL param to match view
                  const url = tab.value === 'list' ? '/' : `/?view=${tab.value}`;
                  window.history.pushState(null, '', url);
                  // Force re-render by dispatching popstate
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className={cn(
                  'flex items-center gap-2 px-1 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'ink-underline text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <TabIcon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {/* Content Views */}
      {!loading && (
        <>
          {(viewMode === 'list' || isFavorites || isArchived) && (
            <ListView
              items={filteredItems}
              onEdit={handleEdit}
              onDelete={removeItem}
              onToggleFavorite={toggleItemFavorite}
              onToggleArchive={toggleItemArchive}
            />
          )}

          {viewMode === 'timeline' && (
            <TimelineView
              items={filteredItems}
              onEdit={handleEdit}
              onDelete={removeItem}
              onToggleFavorite={toggleItemFavorite}
              onToggleArchive={toggleItemArchive}
            />
          )}

          {viewMode === 'calendar' && (
            <CalendarView
              items={filteredItems}
              onEdit={handleEdit}
              onDelete={removeItem}
              onToggleFavorite={toggleItemFavorite}
              onToggleArchive={toggleItemArchive}
            />
          )}
        </>
      )}

      {/* Add / Edit Dialog */}
      <AddItemDialog
        open={showAddDialog}
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleSubmit}
        editingItem={editingItem}
      />
    </div>
  );
}
