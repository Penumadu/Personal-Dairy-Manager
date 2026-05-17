'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { BookOpen, List, Calendar, Clock, Star, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { UserNav } from './UserNav';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', view: null,       label: 'All',      icon: List },
  { href: '/?view=timeline',  view: 'timeline',  label: 'Timeline', icon: Clock },
  { href: '/?view=calendar',  view: 'calendar',  label: 'Calendar', icon: Calendar },
  { href: '/?view=favorites', view: 'favorites', label: 'Favorites', icon: Star },
  { href: '/?view=archived',  view: 'archived',  label: 'Archived', icon: Archive },
];

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4 max-w-6xl">
        <Link href="/" className="flex items-center gap-2 mr-6 shrink-0 group">
          <BookOpen className="h-6 w-6 text-primary transition-transform group-hover:-rotate-12" />
          <span className="font-display italic font-semibold text-2xl hidden sm:inline tracking-tight">Dairy Manager</span>
        </Link>

        <nav className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Active if on '/' with matching view param (or null view for "All")
            const isActive =
              pathname === '/' &&
              currentView === item.view;

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 whitespace-nowrap rounded-none hover:bg-transparent hover:text-foreground",
                    isActive ? "ink-underline text-foreground" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 ml-4 shrink-0">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
