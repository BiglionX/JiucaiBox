# Vercel 部署指南（韭菜学院 / JiucaiBox monorepo）

本仓库是 monorepo（`apps/web` 用户端 H5、`apps/admin` 管理后台、`apps/api` NestJS 后端、`packages/shared` 共享类型常量）。Vercel 对 monorepo 支持良好，但前端和后端必须拆成多个 Vercel 项目（或把后端放到其它平台），否则会出现"主域名显示管理后台登录页"这类配置错位。

## 0. 一句话结论

- **主域名** (`jiucaibox.vercel.app`) → 部署 `apps/web`（H5）
- **管理后台** (建议绑定子域名，如 `admin-jiucaibox.vercel.app`) → 部署 `apps/admin`
- **后端 API** → **不建议直接放 Vercel**（NestJS + SQLite 在 Serverless 上不可用：文件系统临时、无长驻进程），推荐 Render / Railway / Fly.io / 阿里云 / 腾讯云；或改造为 Vercel Functions + 外部数据库（MySQL/Turso/PlanetScale）。

## 1. 项目 A：用户端 H5（主域名）

在 Vercel 控制台 → Add New Project → 选 `BiglionX/JiucaiBox`：

| 设置项 | 值 |
|---|---|
| Project Name | `jiucaibox-web`（或你喜欢的名字） |
| Framework Preset | **Vite**（自动识别） |
| Root Directory | **`apps/web`** ← 关键，必须改 |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install`（默认即可，monorepo 会自动在仓库根装 workspaces） |

环境变量（Settings → Environment Variables）：

| Key | Value | 说明 |
|---|---|---|
| `VITE_API_BASE` | 例如 `https://api.jiucaibox.example.com/api` | 后端完整 base（含 `/api` 前缀）。不设则走同源 `/api`，需在下方 rewrites 配代理 |

`apps/web/vercel.json` 已包含 SPA 回退（`/((?!api/).*)` → `/index.html`）。如果 `VITE_API_BASE` 留空、想让 `/api` 同源代理到后端，**手动在 Vercel 控制台追加一条 rewrite**（项目 Settings → Rewrites）：

```
Source: /api/:path(.*)
Destination: https://你的后端域名/api/:path
```

否则建议直接设 `VITE_API_BASE` 走跨域。

## 2. 项目 B：管理后台

Add New Project → 同一个 GitHub 仓库：

| 设置项 | 值 |
|---|---|
| Project Name | `jiucaibox-admin` |
| Framework Preset | **Vite** |
| Root Directory | **`apps/admin`** ← 关键 |
| Build Command | `npm run build` |
| Output Directory | `dist` |

环境变量：

| Key | Value | 说明 |
|---|---|---|
| `VITE_API_BASE` | 例如 `https://api.jiucaibox.example.com` | 后端 base（admin 路径以 `/admin/...` 开头，不带 `/api` 前缀） |

部署完拿到域名后，把 Settings → Domains 绑到子域名（如 `admin.jiucaibox.com`）。

## 3. 项目 C：后端 API（**不放 Vercel**）

为什么：
- `apps/api` 使用 **NestJS + Prisma + SQLite**。SQLite 文件在 Vercel Serverless 上无法持久（每次冷启动容器是新的）。
- Vercel Functions 的 10s/60s 超时与冷启动不适合长跑的 NestJS 进程。

推荐方案（任选其一）：

### 方案 1：Render / Railway / Fly.io（最省事，原生支持 Node）

1. New Web Service → 选 `BiglionX/JiucaiBox`
2. Root Directory: `apps/api`
3. Build Command: `npm install && npm run build`
4. Start Command: `npm run start:prod`
5. 环境变量：
   - `DATABASE_URL`：切到 MySQL 字符串（见 `apps/api/prisma/schema.prisma` 顶部注释），例如 `mysql://user:pass@host:3306/jiucaibox`
   - `JWT_SECRET`：32 位随机串
   - `PORT`：由平台注入
6. 数据库：单独开一个 MySQL（PlanetScale / TiDB Cloud / 阿里云 RDS 都行，免费的也够用）
7. 部署完拿到 API 域名，回到步骤 1/2 把 `VITE_API_BASE` 填进去。

### 方案 2：Vercel Functions + 外部 DB（轻量，但要改造）

- 把 `apps/api` 改造为 Vercel Functions（每个 Controller 套一层 `export default handler`，或用 `@vendia/serverless-express` 桥接）
- 数据库切到 MySQL / Turso / Neon / PlanetScale（不能 SQLite）
- 在 `apps/api` 下加 `vercel.json` 声明 routes

改造量较大，不推荐 MVP 阶段做。

## 4. 数据库与初始化

部署到生产前：

1. `schema.prisma` 把 `provider` 改成 `mysql`（默认是 sqlite 本地零依赖）。
2. 在 API 项目里执行：
   ```bash
   npx prisma migrate deploy   # 跑迁移
   npx prisma db seed          # 写入种子数据（prisma/seeds/）
   ```
   或者用仓库里的 `scripts/` 里现成的引导脚本（若有 `db:migrate`、`db:seed` 工作区脚本）。
3. 确认 `packages/shared` 的常量中地区/风控词库无敏感信息可公开。

## 5. CORS 与跨域

如果 web/admin 与 API 不在同一域名（推荐：分开部署），需要在 `apps/api` 的 NestJS 里允许跨域（`main.ts` 启用 `app.enableCors()`，或精确放行前端两个域名）。

## 6. 常见问题

**Q: 主域名打开跳到管理后台登录页 `/login?redirect=/dashboard`？**
A: Vercel 项目 A 的 Root Directory 设成了 `apps/admin`。改成 `apps/web` 重建即可。证据：`apps/web/src/router/index.ts` 第 7 行 `/` → `/home`，没有 `/login` 跳转；`apps/admin/src/router/index.ts` 第 60/68/93 行才是这个行为。

**Q: H5 页面打开后接口全部 404？**
A: `VITE_API_BASE` 没设或设错。设成后端完整 base（含路径前缀）。web 的请求前缀是 `/api/`，admin 是 `/admin/`。

**Q: `npm install` 报找不到 `@jiucaibox/shared`？**
A: 这是 monorepo workspace 依赖。Vercel 默认会从仓库根跑 workspaces 安装，不要把 Install Command 改成 `--prefix apps/web`，保持默认。

**Q: 部署成功后管理后台 `/login` 一直提示网络错误？**
A: API 没起来、或者 `VITE_API_BASE` 域名拼错，或者 API 那边 CORS 没放行前端域名。

---

## 附：本仓库当前已包含的部署相关配置

- `apps/web/vercel.json` — SPA 回退（排除 `/api`，便于将来加代理）
- `apps/admin/vercel.json` — SPA 回退（排除 `/api/` 和 `/admin/`）
- `apps/web/src/utils/request.ts`、`apps/admin/src/utils/request.ts` — 已支持 `VITE_API_BASE` 环境变量覆盖 baseURL
- `.gitignore` — 忽略 `apps/api/src/generated/`（Prisma 生成产物，避免污染仓库）