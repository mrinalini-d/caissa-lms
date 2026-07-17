import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isAdminEmail } from '@/lib/admin'
import UsersClient from './UsersClient'

export default async function AdminUsersPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('caissa_session')
  if (!session?.value) redirect('/login')
  if (!isAdminEmail(session.value)) redirect('/dashboard')

  return <UsersClient user={{ email: session.value }} />
}
