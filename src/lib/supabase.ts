import { createBrowserClient } from '@supabase/ssr'

// Singleton untuk Browser Client
// Memberikan handler kosong untuk SSR agar tidak memicu error getAll/setAll
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        return undefined
      },
      set(name: string, value: string, options: any) {
      },
      remove(name: string, options: any) {
      },
    },
  }
)
