import type { ReactNode } from 'react'
import './globals.css'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="flex h-screen">
          <div className="w-64 border-r p-4">侧边栏</div>
          <div className="flex-1 p-4">{children}</div>
        </div>
      </body>
    </html>
  )
}
