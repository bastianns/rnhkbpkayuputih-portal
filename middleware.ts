import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware ini berjalan di Edge Runtime sebelum setiap request.
 * Tugasnya adalah memvalidasi sesi pengguna dan melindungi route /admin/*.
 *
 * Kenapa middleware lebih aman daripada hanya mengandalkan layout.tsx?
 * Karena middleware berjalan di server sebelum halaman dirender,
 * sehingga tidak ada konten admin yang bocor ke pengguna yang tidak terautentikasi.
 */
export async function middleware(request: NextRequest) {
  // Buat response baru yang akan kita modifikasi jika perlu
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Buat Supabase client yang bisa membaca dan menulis cookie
  // langsung dari/ke objek request & response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookie di request (untuk komponen server di bawahnya)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Set cookie di response (untuk browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // PENTING: Gunakan getUser() bukan getSession() karena getUser()
  // memvalidasi token langsung ke server Supabase (lebih aman).
  // getSession() hanya membaca dari cookie tanpa validasi ulang.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginPage = request.nextUrl.pathname === '/login';

  // Jika mengakses /admin/* tanpa sesi yang valid → redirect ke /login
  if (isAdminRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    // Simpan halaman yang ingin diakses agar bisa redirect kembali setelah login
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Jika sudah login dan mencoba akses /login → redirect ke /admin
  if (isLoginPage && user) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return response;
}

// Tentukan route mana saja yang diproses oleh middleware ini
export const config = {
  matcher: [
    '/admin/:path*', // Semua halaman admin
    '/login',        // Halaman login (untuk redirect jika sudah login)
  ],
};
