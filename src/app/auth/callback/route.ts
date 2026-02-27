import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // 1. Menangkap parameter 'next' agar user kembali ke halaman awal (misal: /check-in/[id])
  // Jika tidak ada, default diarahkan ke dashboard
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    // 2. Persiapan Cookie Store (Wajib await untuk Next.js 15/16)
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // 3. Tukar kode rahasia dari Magic Link menjadi sesi resmi
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 4. LOGGING OTOMATIS: Ambil data user yang baru saja login
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Catat aktivitas login jemaat ke tabel audit_log untuk akuntabilitas
        await supabase.from('audit_log').insert({
          actor_id: user.id,
          action: 'MEMBER_LOGIN',
          entity: 'auth_system',
          entity_id: user.id,
          new_data: { 
            email: user.email, 
            method: 'magic_link',
            redirected_to: next,
            login_at: new Date().toISOString()
          }
        });
      }

      // 5. Redirect ke halaman tujuan tanpa looping
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Jika gagal (code expired/invalid), kembalikan ke login dengan indikator error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}