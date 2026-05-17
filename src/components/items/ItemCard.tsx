'use client';

import { useState } from 'react';
import { Item } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import {
  Link2,
  FileText,
  Video,
  Bell,
  Star,
  Archive,
  Trash2,
  MoreVertical,
  ExternalLink,
  ArchiveRestore,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItemCardProps {
  item: Item;
  onEdit?: (item: Item) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, favorite: boolean) => void;
  onToggleArchive: (id: string, archived: boolean) => void;
}

const typeConfig = {
  url:      { icon: Link2,     color: 'text-blue-500',   pill: 'type-pill-url',      label: 'URL' },
  note:     { icon: FileText,  color: 'text-emerald-500', pill: 'type-pill-note',     label: 'Note' },
  youtube:  { icon: Video,     color: 'text-red-500',     pill: 'type-pill-youtube',  label: 'YouTube' },
  reminder: { icon: Bell,      color: 'text-amber-500',   pill: 'type-pill-reminder', label: 'Reminder' },
};

/** Safely convert Firestore Timestamp or JS Date to JS Date */
function toDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date();
}

export function ItemCard({ item, onEdit, onDelete, onToggleFavorite, onToggleArchive }: ItemCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cfg = typeConfig[item.type];
  const Icon = cfg.icon;

  const handleContentClick = () => {
    if (item.type === 'url' && item.content) {
      window.open(item.content, '_blank');
    } else if (item.type === 'youtube' && item.content) {
      const videoId = extractYouTubeId(item.content);
      if (videoId) window.open(`https://youtube.com/watch?v=${videoId}`, '_blank');
    }
  };

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(item.id);
    setDeleting(false);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Card className={cn(
        'group relative flex flex-col card-hover border bg-card overflow-hidden shadow-sm',
        item.favorite && 'ring-1 ring-primary border-primary/50',
      )}>
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <span className={cn('mt-0.5 shrink-0 p-1.5 rounded-md', cfg.pill)}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-display font-bold leading-tight truncate text-xl tracking-tight">{item.title}</h3>
                <p className="text-xs font-semibold text-muted-foreground mt-1 opacity-80">
                  {format(toDate(item.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Quick-favorite button */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity',
                  item.favorite && 'opacity-100 text-amber-500'
                )}
                onClick={() => onToggleFavorite(item.id, !item.favorite)}
                title={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={cn('h-3.5 w-3.5', item.favorite && 'fill-amber-500')} />
              </Button>

              {/* Actions menu */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onToggleArchive(item.id, !item.archived)}>
                    {item.archived
                      ? <><ArchiveRestore className="mr-2 h-4 w-4" /> Restore</>
                      : <><Archive className="mr-2 h-4 w-4" /> Archive</>
                    }
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 px-5 pb-5 flex-1 flex flex-col gap-3">
          {/* YouTube thumbnail */}
          {item.type === 'youtube' && item.metadata?.thumbnail && (
            <button
              onClick={handleContentClick}
              className="relative aspect-video rounded-md overflow-hidden bg-muted block w-full"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.metadata.thumbnail} alt={item.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors">
                <Video className="h-10 w-10 text-white drop-shadow" />
              </div>
            </button>
          )}

          {/* URL link */}
          {item.type === 'url' && (
            <button
              onClick={handleContentClick}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline w-full text-left mt-1"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{item.content}</span>
            </button>
          )}

          {/* Note content */}
          {item.type === 'note' && (
            <p className="text-sm line-clamp-3 text-muted-foreground leading-relaxed">{item.content}</p>
          )}

          {/* Reminder */}
          {item.type === 'reminder' && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
              {item.reminderDate && (
                <Badge variant="outline" className="text-xs type-pill-reminder border-0">
                  <Bell className="h-3 w-3 mr-1" />
                  {format(toDate(item.reminderDate), 'MMM d, yyyy')}
                </Badge>
              )}
            </div>
          )}

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto pt-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete item?</DialogTitle>
            <DialogDescription>
              &quot;{item.title}&quot; will be permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
