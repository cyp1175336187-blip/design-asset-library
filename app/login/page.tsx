'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { safeNextPath } from '@/lib/browse'
import { getBrowserClient } from '@/lib/supabase/browser'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const form = new FormData(event.currentTarget)
    const email = String(form.get('account') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const supabase = await getBrowserClient()
    if (!supabase) {
      setError('尚未配置 Supabase。请按 README 设置环境变量后重新启动。')
      setPending(false)
      return
    }

    const { error: signError } = await supabase.auth.signInWithPassword({ email, password })
    if (signError) {
      setError(loginError(signError.message))
      setPending(false)
      return
    }

    const next = safeNextPath(new URLSearchParams(window.location.search).get('next'))
    router.replace(next)
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border p-6">
        <h1 className="text-xl font-semibold">登录</h1>
        <p className="text-sm text-neutral-600">使用邮箱和密码登录。账号由管理员在 Supabase 中创建。</p>
        <label className="block text-sm">
          账号
          <input name="account" type="email" required autoComplete="username" placeholder="name@example.com" className="mt-1 w-full border px-3 py-2" />
        </label>
        <label className="block text-sm">
          密码
          <input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full border px-3 py-2" />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button type="submit" disabled={pending} className="border px-3 py-2 text-sm disabled:opacity-60">
          {pending ? '正在登录…' : '登录'}
        </button>
      </form>
    </main>
  )
}

function loginError(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login')) return '账号或密码不正确。'
  if (lower.includes('email not confirmed')) return '邮箱尚未确认。请在 Supabase 中关闭 Confirm email，或先完成验证。'
  return message
}
