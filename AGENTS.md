# AGENTS.md — Personal Dairy Manager

## Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Firebase Firestore
- **Auth**: Firebase Auth (Google + Email/Password)
- **Reminders**: Twilio (SMS) + Resend (Email) via `/api/reminders`
- **Theme**: next-themes (Dark/Light/System)
- **Dates**: date-fns
- **Icons**: Lucide React

## Commands
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture
```
src/
├── app/
│   ├── (auth)/login, signup     # Auth pages (public)
│   ├── (dashboard)/             # Main app (protected)
│   │   ├── layout.tsx           # Dashboard wrapper with auth check
│   │   └── page.tsx             # Main dashboard with views
│   └── api/reminders/route.ts   # Reminder API (SMS + Email)
├── components/
│   ├── ui/                      # shadcn/ui primitives
│   ├── layout/                  # Header, ThemeToggle, UserNav
│   ├── items/                   # AddItemDialog, ItemCard
│   └── views/                   # ListView, TimelineView, CalendarView
├── hooks/                       # useAuth, useItems
├── lib/                         # firebase.ts, firestore.ts, utils.ts
├── types/                       # TypeScript types
└── context/                     # AuthContext
```

## Data Model
```
users/{userId}/items/{itemId}
- type: 'url' | 'note' | 'youtube' | 'reminder'
- title, content, tags[], favorite, archived
- createdAt, updatedAt (Firestore Timestamp)
- reminderDate, reminderSent, reminderPhone, reminderEmail
- metadata: { favicon, thumbnail, domain, duration }
```

## Key Conventions
- All items are user-scoped: `users/{userId}/items`
- Auth is handled via Firebase Auth + AuthContext
- Protected routes check auth in dashboard layout
- Firestore security rules enforce user isolation (`firestore.rules`)
- Environment variables in `.env.local` (Firebase, Twilio, Resend)

## Testing
- No test framework configured yet
- Add Jest/Vitest when needed

## Gotchas
- Tailwind v4 uses `@tailwindcss/postcss` (not v3 config)
- shadcn/ui components are in `src/components/ui/`
- Firebase config is client-side (`NEXT_PUBLIC_*`)
- YouTube thumbnails auto-extracted from URL on save
