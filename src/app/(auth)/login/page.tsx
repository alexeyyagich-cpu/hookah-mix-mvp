import type { Metadata } from 'next'
import LoginPageClient from './LoginPageClient'

export const metadata: Metadata = {
  title: 'Login — Hookah Torus',
  description: 'Sign in to your Hookah Torus account to manage your lounge, inventory, and team.',
}

export default function LoginPage() {
  return <LoginPageClient />
}
