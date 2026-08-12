import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/admin'
import StorageClient from './StorageClient'

export default async function AdminStoragePage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('caissa_session')
  if (!session?.value) redirect('/login')
  if (!isAdminEmail(session.value)) redirect('/dashboard')

  return <StorageClient user={{ email: session.value }} />
}
