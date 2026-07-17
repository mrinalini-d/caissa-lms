export const ADMIN_EMAILS = ['augustin@circlechess.com', 'mrinalini@circlechess.com']

export function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}
