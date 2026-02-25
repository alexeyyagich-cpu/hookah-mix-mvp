import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bowls',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
