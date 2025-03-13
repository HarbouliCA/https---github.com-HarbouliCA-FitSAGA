import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define routes that require specific roles
const adminOnlyRoutes = [
  '/dashboard/users',
  '/dashboard/clients',
  '/dashboard/instructors',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes and API routes
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api/') ||
    pathname === '/login' ||
    pathname === '/favicon.ico' ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Get the user's session token
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // For debugging - log the token
  console.log('Token in middleware:', token);

  // If no token exists, redirect to login
  if (!token) {
    console.log('No token found, redirecting to login');
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  // Check if role exists in token
  const userRole = token.role as string;
  console.log(`User role: ${userRole}, Path: ${pathname}`);

  // Check access for admin-only routes
  if (adminOnlyRoutes.some(route => pathname.startsWith(route))) {
    if (userRole !== 'admin') {
      console.log(`Access denied to ${pathname} for role ${userRole}`);
      // Redirect to dashboard if not admin
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // For all other routes, allow access for authenticated users
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
