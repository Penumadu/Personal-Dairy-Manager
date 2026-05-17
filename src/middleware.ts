import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// No-op middleware - auth handled client-side via useEffect in DashboardLayout
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
