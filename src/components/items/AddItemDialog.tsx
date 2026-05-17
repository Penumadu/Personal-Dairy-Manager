'use client';

import { useState, useEffect } from 'react';
import { ItemType, ItemFormData, Item } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, X, Link2, FileText, Video, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ItemFormData) => Promise<void>;
  /** When provided, the dialog pre-populates for editing */
  editingItem?: Item | null;
}

const typeOptions: { value: ItemType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'note',     label: 'Note',     icon: FileText },
  { value: 'url',      label: 'URL',      icon: Link2 },
  { value: 'youtube',  label: 'YouTube',  icon: Video },
  { value: 'reminder', label: 'Reminder', icon: Bell },
];

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function AddItemDialog({ open, onOpenChange, onSubmit, editingItem }: AddItemDialogProps) {
  const isEditing = !!editingItem;

  const [type, setType] = useState<ItemType>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [reminderDate, setReminderDate] = useState<Date | undefined>();
  const [reminderPhone, setReminderPhone] = useState('');
  const [reminderEmail, setReminderEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-populate when editing
  useEffect(() => {
    if (editingItem) {
      setType(editingItem.type);
      setTitle(editingItem.title);
      setContent(editingItem.content);
      setTags(editingItem.tags ?? []);
      setReminderDate(
        editingItem.reminderDate
          ? (typeof editingItem.reminderDate.toDate === 'function'
              ? editingItem.reminderDate.toDate()
              : new Date())
          : undefined
      );
      setReminderPhone(editingItem.reminderPhone ?? '');
      setReminderEmail(editingItem.reminderEmail ?? '');
    } else {
      resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingItem, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const metadata: ItemFormData['metadata'] = {};

      if (type === 'url' && content) {
        try {
          const url = new URL(content);
          metadata.domain = url.hostname;
        } catch { /* ignore invalid URL */ }
      }

      if (type === 'youtube' && content) {
        const videoId = extractYouTubeId(content);
        if (videoId) {
          metadata.thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        }
      }

      const data: Partial<ItemFormData> = {
        type,
        title,
        content,
        tags,
      };

      if (reminderDate) data.reminderDate = Timestamp.fromDate(reminderDate);
      if (reminderPhone) data.reminderPhone = reminderPhone;
      if (reminderEmail) data.reminderEmail = reminderEmail;
      if (Object.keys(metadata).length) data.metadata = metadata;

      await onSubmit(data as ItemFormData);
      if (!isEditing) resetForm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setType('note');
    setTitle('');
    setContent('');
    setTags([]);
    setTagInput('');
    setReminderDate(undefined);
    setReminderPhone('');
    setReminderEmail('');
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display italic text-3xl font-medium tracking-tight">
            {isEditing ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of your saved item.' : 'Save a note, URL, video, or reminder to your dairy.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector — pill buttons */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2 flex-wrap">
              {typeOptions.map((opt) => {
                const TypeIcon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                      type === opt.value
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                    )}
                  >
                    <TypeIcon className="h-3.5 w-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Give it a name…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Content — varies by type */}
          <div className="space-y-2">
            <Label htmlFor="content">
              {type === 'note' ? 'Content' : type === 'url' ? 'URL' : type === 'youtube' ? 'YouTube URL' : 'Reminder Details'}
            </Label>
            {type === 'note' ? (
              <Textarea
                id="content"
                placeholder="Write your note…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                required
              />
            ) : (
              <Input
                id="content"
                type={type === 'url' || type === 'youtube' ? 'url' : 'text'}
                placeholder={
                  type === 'url' ? 'https://…' :
                  type === 'youtube' ? 'https://youtube.com/watch?v=…' :
                  'What to remember…'
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addTag(); }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Reminder Settings */}
          {type === 'reminder' && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Reminder Settings</Label>

                <div className="space-y-2">
                  <Label htmlFor="reminder-date">Date</Label>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          variant="outline"
                          className={cn('w-full justify-start text-left font-normal', !reminderDate && 'text-muted-foreground')}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {reminderDate ? format(reminderDate, 'PPP') : 'Pick a date'}
                        </Button>
                      }
                    />
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={reminderDate}
                        onSelect={setReminderDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminder-email">Email (optional)</Label>
                  <Input
                    id="reminder-email"
                    type="email"
                    placeholder="you@example.com"
                    value={reminderEmail}
                    onChange={(e) => setReminderEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminder-phone">Phone (optional)</Label>
                  <Input
                    id="reminder-phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={reminderPhone}
                    onChange={(e) => setReminderPhone(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (isEditing ? 'Updating…' : 'Saving…') : (isEditing ? 'Update Item' : 'Save Item')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
