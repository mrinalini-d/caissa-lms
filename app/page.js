import { redirect } from 'next/navigation'

export default function Home({ searchParams }) {
  const queryEntries = Object.entries(searchParams || {})
    .filter(([, value]) => typeof value === 'string')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)

  if (searchParams?.code) {
    redirect(`/auth/callback?${queryEntries.join('&')}`)
  }

  redirect('/login')
}
