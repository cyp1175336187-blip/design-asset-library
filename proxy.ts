import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { safeNextPath } from '@/lib/browse'
import { getSupabaseEnv } from '@/lib/supabase/env'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLogin = pathname === '/login'
  const isPublicConfig = pathname === '/api/supabase-config'
  const isApi = pathname.startsWith('/api/')

  if (!getSupabaseEnv()) {
    if (isLogin || isPublicConfig) return NextResponse.next()
    if (isApi) return NextResponse.json({ error: '尚未配置 Supabase' }, { status: 503 })
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  const { response, user } = await sessionFrom(request)

  if (!user && !isLogin && !isPublicConfig) {
    if (isApi) return jsonWithSession(response, { error: '未登录' }, 401)
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    return redirectWithSession(response, url)
  }

  if (user && isLogin) {
    const url = request.nextUrl.clone()
    const next = safeNextPath(request.nextUrl.searchParams.get('next'))
    const destination = new URL(next, request.url)
    url.pathname = destination.pathname
    url.search = destination.search
    return redirectWithSession(response, url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}

async function sessionFrom(request: NextRequest) {
  const env = getSupabaseEnv()
  let response = NextResponse.next({ request })
  if (!env) return { response, user: null }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
      },
    },
  })

  const { data, error } = await supabase.auth.getUser()
  return { response, user: error ? null : data.user }
}

function redirectWithSession(session: NextResponse, url: URL) {
  const redirect = NextResponse.redirect(url)
  session.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie)
  })
  session.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'cache-control' || key.toLowerCase() === 'expires' || key.toLowerCase() === 'pragma') {
      redirect.headers.set(key, value)
    }
  })
  return redirect
}

function jsonWithSession(session: NextResponse, body: { error: string }, status: number) {
  const json = NextResponse.json(body, { status })
  session.cookies.getAll().forEach((cookie) => {
    json.cookies.set(cookie)
  })
  return json
}
