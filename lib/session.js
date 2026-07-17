import { cookies } from 'next/headers'
import { isAdminEmail } from './admin'

export async function getUserEmail() {
  const cookieStore = await cookies()
  const session = cookieStore.get('caissa_session')
  return session?.value || null
}

// Returns the admin's email, or null if the current session isn't an admin.
export async function getAdminEmail() {
  const email = await getUserEmail()
  return isAdminEmail(email) ? email : null
}
