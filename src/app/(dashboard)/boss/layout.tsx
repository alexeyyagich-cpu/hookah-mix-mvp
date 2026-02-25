import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Boss Mode',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
