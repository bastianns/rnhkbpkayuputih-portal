import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware untuk validasi sesi dan proteksi rute berdasarkan role (RBAC).
 * Memastikan Admin ke /admin dan Jemaat ke /dashboard.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Validasi user langsung ke server Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith('/admin');
  const isUserRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/check-in');
  const isLoginPage = pathname === '/login';

  const userRole = user?.app_metadata?.role;

  // 1. Proteksi Rute Admin: Hanya untuk role 'admin'
  if (isAdminRoute) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    if (userRole !== 'admin') {
      // Jika jemaat mencoba masuk ke admin, arahkan ke dashboard mereka
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 2. Proteksi Rute Jemaat: Harus login
  if (isUserRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Logika Redirect Login: Jika sudah punya sesi, arahkan sesuai role
  if (isLoginPage && user) {
    const destination = userRole === 'admin' ? '/admin' : '/dashboard';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/check-in/:path*',
    '/login',
  ],
};
