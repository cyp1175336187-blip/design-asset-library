# 设计资产库

Next.js App Router 站点。登录、资产元数据和上传文件都放在 Supabase：Auth（邮箱 + 密码）、Postgres、私有 Storage bucket `assets`。

## 本地运行

1. 在 [Supabase](https://supabase.com/dashboard) 新建项目。
2. 打开 **Project Settings → API**，复制 Project URL 和 `anon` `public` key。
3. 复制环境变量文件并填入上面的值：

   ```bash
   cp .env.example .env.local
   ```

   `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是应用实际读取的变量。不要提交 `.env.local`。服务端密钥 `SUPABASE_SERVICE_ROLE_KEY` 不是必需的，应用只用登录用户自己的会话。

4. 打开 **SQL Editor**，执行 [`supabase/migrations/20261106180000_init.sql`](supabase/migrations/20261106180000_init.sql) 的全部内容。脚本会创建：

   - `public.profiles`：可选资料。`role` 和 `permissions` 只是预留，当前不做同事权限判断。
   - `public.assets`：资产元数据。分类 id 使用代码里的 `lib/taxonomy.ts`，没有单独的分类表。
   - 私有 Storage bucket `assets`，以及只允许登录用户读写自己目录的策略。

5. 打开 **Authentication → Providers → Email**，保持 Email 开启。内部账号建议关闭 **Confirm email**，否则未验证邮箱无法登录。
6. 打开 **Authentication → Users → Add user**，创建同事的邮箱和密码。先执行 SQL，再创建用户，这样 `profiles` 行会由触发器补上。
7. 安装依赖并启动：

   ```bash
   npm install
   npm run dev
   ```

8. 打开 `/login`，用上一步的邮箱和密码登录。未登录访问首页、资产详情、上传和下载会回到登录页。

## 上传

登录后打开「上传」，选择**一个**文件夹。支持 `otf`、`ttf`、`svg`、`psd`、`fig`、`figma`，以及文件夹里的 `png`、`jpg`、`webp` 预览图。文件写入 Storage 的 `{用户 id}/{资产 id}/...`，元数据写入 `assets`。标签先按文件名拆分，详情页可以改标签、备注和说明。

下载主文件时会签发短期链接，并把 `download_count` 加一。

## 没有密钥时构建

不配置上述环境变量也可以执行 `npm run build` 和 `npx tsc --noEmit`。未配置时页面会提示先完成设置，不会写入假的生产密钥。
