import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ModuleClient from './ModuleClient'

export default async function ModulePage({ params }) {
  const { moduleId } = await params
  const cookieStore = await cookies()
  const session = cookieStore.get('caissa_session')

  if (!session?.value) redirect('/login')

  return <ModuleClient moduleId={moduleId} user={{ email: session.value }} />
}
