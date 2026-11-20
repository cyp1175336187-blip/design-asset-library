'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { BrandMark } from '@/components/BrandMark'
import { fieldClass, primaryButtonClass } from '@/components/styles'
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
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-ink px-12 py-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-[10px] bg-white p-0.5">
            <BrandMark className="h-9 w-9" />
          </span>
          <span className="text-lg font-semibold tracking-tight">设计资产库</span>
        </div>
        <div>
          <p className="text-sm text-white/55">内部资料</p>
          <p className="mt-3 max-w-sm text-3xl leading-snug font-semibold tracking-tight">把字体、海报、界面和工具文件放在一处。</p>
        </div>
        <p className="text-xs text-white/45">仅团队成员可访问</p>
      </section>
      <section className="flex items-center justify-center px-4 py-16">
        <form onSubmit={onSubmit} className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <BrandMark />
            <span className="text-base font-semibold">设计资产库</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight">登录</h1>
          <p className="mt-2 text-sm leading-6 text-muted">使用邮箱和密码登录。账号由管理员在 Supabase 中创建。</p>
          <label className="mt-8 block text-sm">
            账号
            <input name="account" type="email" required autoComplete="username" placeholder="name@example.com" className={fieldClass} />
          </label>
          <label className="mt-4 block text-sm">
            密码
            <input name="password" type="password" required autoComplete="current-password" className={fieldClass} />
          </label>
          {error ? (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
          <button type="submit" disabled={pending} className={`${primaryButtonClass} mt-6 w-full`}>
            {pending ? '正在登录…' : '登录'}
          </button>
        </form>
      </section>
    </main>
  )
}

function loginError(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login')) return '账号或密码不正确。'
  if (lower.includes('email not confirmed')) return '邮箱尚未确认。请在 Supabase 中关闭 Confirm email，或先完成验证。'
  return message
}
