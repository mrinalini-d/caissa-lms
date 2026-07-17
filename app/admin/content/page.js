import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/admin'
import ContentClient from './ContentClient'

export default async function AdminContentPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('caissa_session')
  if (!session?.value) redirect('/login')
  if (!isAdminEmail(session.value)) redirect('/dashboard')

  return <ContentClient user={{ email: session.value }} />
}
