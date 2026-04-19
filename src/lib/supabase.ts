import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return undefined
        const cookie = document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${name}=`))
        return cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined
      },
      set(name: string, value: string, options: any) {
        if (typeof document === 'undefined') return
        let cookieString = `${name}=${encodeURIComponent(value)}`
        if (options.path) cookieString += `; path=${options.path}`
        if (options.maxAge) cookieString += `; max-age=${options.maxAge}`
        if (options.domain) cookieString += `; domain=${options.domain}`
        if (options.secure) cookieString += `; secure`
        document.cookie = cookieString
      },
      remove(name: string, options: any) {
        if (typeof document === 'undefined') return
        document.cookie = `${name}=; path=${options.path || '/'}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      },
    },
  }
)
