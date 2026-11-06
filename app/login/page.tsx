'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'

export default function LoginPage() {
  const router = useRouter()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    router.push('/')
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border p-6">
        <h1 className="text-xl font-semibold">登录</h1>
        <p className="text-sm text-neutral-600">示例表单，提交后进入资产库，不会校验账号。</p>
        <label className="block text-sm">
          账号
          <input name="account" required autoComplete="username" className="mt-1 w-full border px-3 py-2" />
        </label>
        <label className="block text-sm">
          密码
          <input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full border px-3 py-2" />
        </label>
        <button type="submit" className="border px-3 py-2 text-sm">
          进入资产库
        </button>
        <p>
          <Link href="/" className="text-sm underline">
            返回
          </Link>
        </p>
      </form>
    </main>
  )
}
