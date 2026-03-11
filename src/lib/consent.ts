import { createClient } from '@/lib/supabase/client'

export const CURRENT_LEGAL_VERSION = '2026-03-01'

export type ConsentType = 'terms' | 'privacy' | 'widerruf_waiver' | 'cookie'

export async function logConsent(
  consentType: ConsentType,
  granted: boolean = true,
  version: string = CURRENT_LEGAL_VERSION
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from as any)('consent_log').insert({
    profile_id: user.id,
    consent_type: consentType,
    version,
    granted,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  })
}

export async function hasCurrentConsent(consentType: ConsentType): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from as any)('consent_log')
    .select('id')
    .eq('profile_id', user.id)
    .eq('consent_type', consentType)
    .eq('version', CURRENT_LEGAL_VERSION)
    .eq('granted', true)
    .limit(1)

  return (data?.length ?? 0) > 0
}

export async function checkAllConsents(): Promise<{ terms: boolean; privacy: boolean }> {
  const [terms, privacy] = await Promise.all([
    hasCurrentConsent('terms'),
    hasCurrentConsent('privacy'),
  ])
  return { terms, privacy }
}
