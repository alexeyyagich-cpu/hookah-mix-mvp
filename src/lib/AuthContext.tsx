'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session, SupabaseClient } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Demo mode for testing without Supabase
const DEMO_MODE = !isSupabaseConfigured

// Demo user data for testing
const DEMO_USER: User = {
  id: 'demo-user-id',
  email: 'demo@hookah-mix.com',
  app_metadata: {},
  user_metadata: { business_name: 'Demo Lounge', owner_name: 'Demo User' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User

const DEMO_PROFILE: Profile = {
  id: 'demo-user-id',
  business_name: 'Demo Lounge',
  owner_name: 'Demo User',
  phone: '+1 234 567 890',
  address: 'Demo Street 123',
  logo_url: null,
  subscription_tier: 'pro', // Pro for full demo experience
  subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  role: 'owner', // Demo user is owner by default
  owner_profile_id: null,
  venue_slug: null,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  // Onboarding completed for demo
  onboarding_completed: true,
  onboarding_skipped: false,
  onboarding_step: 'complete',
  created_at: new Date().toISOString(),
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  isConfigured: boolean
  isDemoMode: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, metadata?: { business_name?: string; owner_name?: string }) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  signInDemo: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const supabase = useMemo(() => isSupabaseConfigured ? createClient() : null, [])

  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data as Profile
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id)
        setProfile(profileData)
      }

      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase не настроен') }
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (
    email: string,
    password: string,
    metadata?: { business_name?: string; owner_name?: string }
  ) => {
    if (!supabase) {
      return { error: new Error('Supabase не настроен') }
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    return { error }
  }

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  // Demo mode login
  const signInDemo = () => {
    setUser(DEMO_USER)
    setProfile(DEMO_PROFILE)
    setSession({ user: DEMO_USER } as Session)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isConfigured: isSupabaseConfigured,
        isDemoMode: DEMO_MODE,
        signIn,
        signUp,
        signOut,
        signInDemo,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
