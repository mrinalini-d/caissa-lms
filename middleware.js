import { NextResponse } from 'next/server'
import { isAdminEmail } from './lib/admin'

export function middleware(request) {
  const session = request.cookies.get('caissa_session')

  if (!session?.value) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (request.nextUrl.pathname.startsWith('/admin') && !isAdminEmail(session.value)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/training/:path*'],
}
