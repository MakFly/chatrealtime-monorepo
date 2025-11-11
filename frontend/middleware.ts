import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/settings']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Check if it's a public auth route (login, register)
  const isPublicAuthRoute = ['/login', '/register'].includes(pathname)
  
  // Get authentication cookies
  const accessToken = request.cookies.get('access_token')?.value
  
  // If it's a protected route and user is not authenticated
  if (isProtectedRoute && !accessToken) {
    // Redirect to login page with return URL
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If user is authenticated and tries to access login/register
  if (isPublicAuthRoute && accessToken) {
    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Add pathname to headers so layouts can access it
  const response = NextResponse.next()
  response.headers.set('x-pathname', pathname)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}
