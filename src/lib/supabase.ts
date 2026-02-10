import { createBrowserClient } from '@supabase/ssr'

// Gunakan Browser Client agar otomatis mengelola Cookie untuk Middleware
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)