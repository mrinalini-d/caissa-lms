import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function Dashboard() {
  const cookieStore = await cookies()
  const session = cookieStore.get('caissa_session')

  if (!session?.value) redirect('/login')

  return <DashboardClient user={{ email: session.value }} />
}
