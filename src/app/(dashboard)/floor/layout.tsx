import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Floor Plan',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
