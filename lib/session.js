import { cookies } from 'next/headers'

export async function getUserEmail() {
  const cookieStore = await cookies()
  const session = cookieStore.get('caissa_session')
  return session?.value || null
}
