import { createBrowserClient } from '@supabase/ssr'

// Create a singleton browser client for SSR compatibility
let supabaseBrowser: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!supabaseBrowser) {
    supabaseBrowser = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseBrowser
}

// Export singleton instance
export const supabase = createClient()
