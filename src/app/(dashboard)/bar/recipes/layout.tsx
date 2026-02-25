import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bar Recipes',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
