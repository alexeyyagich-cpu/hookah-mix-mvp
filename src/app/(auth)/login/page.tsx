import type { Metadata } from 'next'
import LoginPageClient from './LoginPageClient'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Login — Hookah Torus',
  description: 'Sign in to your Hookah Torus account to manage your lounge, inventory, and team.',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return <ErrorBoundary sectionName="Login"><LoginPageClient /></ErrorBoundary>
}
