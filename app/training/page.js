import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import TrainingClient from './TrainingClient'

export default async function Training() {
  const cookieStore = await cookies()
  const session = cookieStore.get('caissa_session')

  if (!session?.value) redirect('/login')

  return <TrainingClient user={{ email: session.value }} />
}
