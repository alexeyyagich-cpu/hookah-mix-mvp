/**
 * Centralized configuration checks.
 *
 * Demo mode is ONLY activated when the explicit env var is set:
 *   NEXT_PUBLIC_DEMO_MODE=true
 *
 * This prevents production users from accidentally seeing fake data
 * if Supabase keys are misconfigured.
 */

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/** true when both Supabase URL and anon key are provided */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

/** true only when NEXT_PUBLIC_DEMO_MODE is explicitly set to "true" */
export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
