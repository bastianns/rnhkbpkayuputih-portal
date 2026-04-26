import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Verifikasi user secara aman dari sisi server
  const { data: { user } } = await supabase.auth.getUser();

  // Proteksi Route: Jika belum login dan mencoba akses /admin, redirect ke /login
  if (!user && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // OPSI TAMBAHAN: Bisa juga cek role di sini jika diperlukan
  // if (user && request.nextUrl.pathname.startsWith('/admin') && user.app_metadata.role !== 'admin') {
  //   return NextResponse.redirect(new URL('/dashboard', request.url));
  // }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
