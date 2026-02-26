import type { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = {
  title: 'Register — Hookah Torus',
  description: 'Create your Hookah Torus account. Free plan available — manage your lounge operations in minutes.',
  robots: { index: false, follow: false },
}

export default function RegisterPage() {
  return <RegisterForm />
}
