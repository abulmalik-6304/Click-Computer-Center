import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role as string | undefined;

    if (pathname.startsWith('/admin/settings') && role !== 'owner') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
    if (pathname.startsWith('/admin/staff') && !['owner', 'manager'].includes(role ?? '')) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
    return NextResponse.next();
  },
  { callbacks: { authorized: ({ token }) => !!token } }
);

export const config = {
  matcher: ['/admin/:path*'],
};
