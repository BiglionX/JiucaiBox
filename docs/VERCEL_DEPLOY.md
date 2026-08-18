# Vercel 部署指南（韭菜学院 / JiucaiBox monorepo）

本仓库是 monorepo（`apps/web` 用户端 H5、`apps/admin` 管理后台、`apps/api` NestJS 后端、`packages/shared` 共享类型）。

> ⚠️ **架构结论（重要）**：Vercel 已弃用 `vercel.json` 的 `builds` 数组（legacy builds，2025-09-01 起 legacy build image 弃用）。实测 Vercel CLI 58 会**完全忽略** `builds[].config` 里的 `buildCommand` / `outputDirectory` / `distDir`，以及顶层 `installCommand`——只识别 `src` + `use` + rewrites。因此**「单 Project + 手动 builds 数组同时承载 web/admin/api」在 CLI 58 上不可行**。
>
> 本仓库采用 **三个独立 Vercel Project** 的方案：每个 Project 的 Root Directory 指向对应 app 目录，让 Vercel **Framework Preset 自动检测**（web/admin 都是标准 Vite 项目，能正确识别），api 单独部署。

## 0. 一句话结论

- **三个 Vercel Project**，各自独立域名：
  - `web` Project → 用户端 H5（Root Directory = `apps/web`，Vite 自动检测）
  - `admin` Project → 管理后台 SPA（Root Directory = `apps/admin`，Vite 自动检测）
  - `api` Project → 后端 API（Root Directory = 仓库根，`builds` + `@vercel/node`）
- **数据库**：**TiDB Cloud Serverless**（MySQL 协议、永久免费档 5 GB）。schema 保持 `provider = "mysql"`。
- **数据初始化**：在 TiDB SQL Editor 创建业务库后，本地用生产 `DATABASE_URL` 跑一次 `npm run db:setup:prod`。

## 1. 域名路径总览

| 访问 | 内容 | 归属 |
|---|---|---|
| `https://jiucaibox-web.vercel.app/` | H5 首页及各页面 | web Project（SPA） |
| `https://jiucaibox-admin.vercel.app/` | 管理后台登录页 / 仪表盘 | admin Project（SPA） |
| `https://jiucaibox-api.vercel.app/api/auth/phone` | 后端 API（用户端） | api Project（serverless） |
| `https://jiucaibox-api.vercel.app/api/admin/login` | 后端 API（管理后台） | api Project（serverless） |

> 前端通过 `VITE_API_BASE` 环境变量指向 api 域名（跨域）；后端 `WEB_ORIGIN` 放开 web/admin 两个前端域名即可。

## 2. 三个 Vercel Project 的配置

### 2.1 web Project（用户端 H5）

Add New Project → 选 `BiglionX/JiucaiBox`：

| 设置项 | 值 |
|---|---|
| Project Name | `jiucaibox-web` |
| Root Directory | **`apps/web`** |
| Framework Preset | **Vite**（自动检测，无需手填） |
| Build Command | 自动 = `npm run build`（`apps/web` 下即 `vite build`） |
| Output Directory | 自动 = `dist`（即 `apps/web/dist`） |

`apps/web/vercel.json`（本仓库已提供）只做 SPA 路由回退：

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

环境变量：

| Key | 值 | 说明 |
|---|---|---|
| `VITE_API_BASE` | `https://jiucaibox-api.vercel.app/api` | 前端请求 `/api/*` 时拼到该域名后（含 `/api` 前缀） |

### 2.2 admin Project（管理后台）

| 设置项 | 值 |
|---|---|
| Project Name | `jiucaibox-admin` |
| Root Directory | **`apps/admin`** |
| Framework Preset | **Vite**（自动检测） |
| Build Command | 自动 = `npm run build`（`apps/admin` 下即 `vue-tsc --noEmit && vite build`） |
| Output Directory | 自动 = `dist` |

`apps/admin/vercel.json`（本仓库已提供）同样只做 SPA 回退。

环境变量：

| Key | 值 | 说明 |
|---|---|---|
| `VITE_API_BASE` | `https://jiucaibox-api.vercel.app` | admin 代码里调用 `/api/admin/...`，拼到该域名后（不含 `/api` 前缀） |

### 2.3 api Project（后端 API）

| 设置项 | 值 |
|---|---|
| Project Name | `jiucaibox-api` |
| Root Directory | **留空（仓库根）** |
| Framework Preset | **Other** |
| Build Command | 留空 / 自动 |
| Output Directory | 留空 |

仓库根 `vercel.json`（本仓库已提供）用 `builds` 数组把 NestJS 编译产物挂成 serverless 函数：

```json
{
  "builds": [
    { "src": "apps/api/dist/vercel.js", "use": "@vercel/node" }
  ],
  "rewrites": [
    { "source": "/api/admin/:path*", "destination": "/apps/api/dist/vercel.js" },
    { "source": "/api/:path*", "destination": "/apps/api/dist/vercel.js" }
  ]
}
```

**关键：谁产出 `apps/api/dist/vercel.js`？** Vercel 的默认 `npm install` 一定会触发仓库根 `package.json` 的 `postinstall` 钩子（实测日志可见），它完成全部 API 构建：

```json
"postinstall": "npm run build -w @jiucaibox/shared && npm run prisma:generate -w apps/api && npm run build -w @jiucaibox/api"
```

即：构建共享包 → 生成 Prisma Client → tsc 编译 NestJS（产出 `apps/api/dist/vercel.js`）。

环境变量：

| Key | Value | 必填 | 说明 |
|---|---|---|---|
| `DATABASE_URL` | `mysql://USER:PASSWORD@HOST:4000/jiucaibox?ssl=...` | ✅ | 生产 MySQL（TiDB）连接串，**不要**填 SQLite |
| `JWT_SECRET` | 32 位以上随机字符串 | ✅ | 签发 token；务必替换 dev 默认值 |
| `JWT_EXPIRES_IN` | `30d` | ⭕ | 默认 30 天 |
| `WEB_ORIGIN` | `https://jiucaibox-web.vercel.app,https://jiucaibox-admin.vercel.app`（逗号分隔，或 `*`） | ⭕ | CORS 白名单 |
| `DEEPSEEK_API_KEY` | `sk-...` | ⭕ | 启用 AI 测评；不填则用内置规则引擎 |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | ⭕ | 默认值 |
| `DEEPSEEK_MODEL` | `deepseek-chat` | ⭕ | 默认值 |
| `ADMIN_INIT_USERNAME` | `admin` | ⭕ | seed 初始化后台账号 |
| `ADMIN_INIT_PASSWORD` | 自定义强密码 | ✅ | seed 初始化后台密码 |

## 3. 数据库：TiDB Cloud Serverless（推荐 / 免费）

### 3.1 为什么选 TiDB

| 方案 | 免费档 | MySQL 协议 | 备注 |
|---|---|---|---|
| **TiDB Cloud Serverless** ⭐ | 5 GB 存储 + 5 亿读/月 + 5000 万写/月，**永久** | ✅ | schema 不动（`provider="mysql"`） |
| PlanetScale Hobby | 2024 起停止新用户免费档 | ✅ | 老账号才可能有 |
| Railway | $5 试用额度 | ✅ | 用完即停 |
| Turso (libSQL) | 9 GB | ❌ | 需把 schema 改回 sqlite |
| Supabase / Neon | 0.5 GB | ❌ Postgres | 需改 schema 为 postgresql |

### 3.2 创建 TiDB Serverless 集群

1. 打开 https://tidbcloud.com → Sign up（GitHub 一键登录）
2. **Create Cluster** → 选 **Serverless**（不是 Dedicated，Dedicated 收费）
3. 区域建议 **Tokyo** 或 **Singapore**（Vercel 默认部署在美西 iad1，距离最近）
4. 集群创建后进控制台 → **Connect** → 选 **Prisma** → 复制它给你的 `DATABASE_URL`

URL 形如：

```
mysql://2LiXAyJwaq1teF5.root:<PASSWORD>@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/<DB>?ssl=...
```

> ⚠️ **不要自己拼 URL**，直接从 Connect 面板复制。TiDB 要求 TLS，URL 里的 `?ssl=...` 参数是它生成的，Prisma 直连即可。

### 3.3 创建业务库（必做，否则迁移会失败）

URL 末尾默认是 `/sys`（TiDB 系统元数据库），**不能跑 Prisma 迁移**。需要先建一个业务库：

1. TiDB 集群面板 → 左侧 **SQL Editor** → 连接
2. 执行：`CREATE DATABASE jiucaibox;`
3. 把 `DATABASE_URL` 末尾的 `/sys` 改成 `/jiucaibox`

### 3.4 本地初始化 + 部署

```bash
# 1. 把生产 URL 写进本地 .env（gitignored，不会进仓库）
#    文件：apps/api/.env
#    内容：DATABASE_URL="mysql://2LiXAyJwaq1teF5.root:真实密码@gateway01.../jiucaibox"

# 2. 跑迁移 + 种子（幂等）
npm run db:setup:prod --workspace apps/api

# 3. 部署到 Vercel 后，把同一段 DATABASE_URL 填到：
#    api Project → Settings → Environment Variables → DATABASE_URL
```

`db:setup:prod` = `prisma migrate deploy && prisma db seed`，幂等可重跑。

种子数据包括：管理后台账号（取 `ADMIN_INIT_USERNAME` / `ADMIN_INIT_PASSWORD`）、演示用户、示例课程、视频、真相弹窗、测试题、韭菜电台、韭菜的泪花、风险词库。

### 3.5 常见 TiDB 坑

- **连接超时**：Vercel 函数冷启动首次连 TiDB 较慢（1-3 秒），把函数 memory 调到 1024 MB 可缓解；连接池在 NestJS 默认单例，热请求不会重连。
- **`/sys` 不能用**：迁移前一定要建业务库。
- **SSL**：URL 里的 `?ssl=...` 别删；删了连不上。
- **外键**：TiDB 对外键的检查比 MySQL 宽松，但 schema 已验证兼容。

## 4. 本地开发

```bash
# 终端 1：数据库（本机 MySQL 或临时把 schema.prisma provider 改回 "sqlite"）
docker compose up -d mysql

# 终端 2：安装依赖 + 迁移 + 种子（一次性）
npm install
npm run db:setup:prod --workspace apps/api

# 终端 3：启动后端（HMR）
npm run dev:api

# 终端 4：启动 H5
npm run dev:web

# 终端 5：启动管理后台
npm run dev:admin
```

打开 `http://localhost:5173`（H5）和 `http://localhost:5174`（管理后台）。后端在 3000，前端 dev server 把 `/api` 和 `/admin/api` 代理到 3000（见 `apps/web/vite.config.ts` 和 `apps/admin/vite.config.ts`）。

## 5. 常见问题

**Q: 为什么不用单 Vercel Project + 手动 builds 数组？**
A: Vercel 已弃用 legacy builds（`vercel.json` 的 `builds` 数组）。CLI 58 实测会忽略 `builds[].config` 的 `buildCommand` / `outputDirectory` / `distDir` 与顶层 `installCommand`，只识别 `src`+`use`+rewrites。单 Project 无法同时承载 web/admin 两个 SPA（各自有独立 `dist`），因此拆成三个 Project，每个用 Framework Preset 自动检测。

**Q: api Project 为什么 Root Directory 留空？**
A: 因为 NestJS 编译产物 `apps/api/dist/vercel.js` 依赖 `packages/shared` 与 `apps/api` 两个目录；留空（仓库根）时 `postinstall` 钩子（根 package.json）能一次性构建 shared + Prisma + API。若 Root Directory 设成 `apps/api`，`postinstall` 不会被触发。

**Q: 为什么 root 的 `installCommand` 不生效了？**
A: legacy builds 弃用后，CLI 58 只跑默认 `npm install`。所以共享包构建、Prisma generate、API 编译全部挪进根 `package.json` 的 `postinstall`——默认 `npm install` 一定会执行它（构建日志已确认）。

**Q: H5 接口全部 404？**
A: 99% 是 `DATABASE_URL` 没设对，或生产 MySQL 没初始化（没跑 `db:setup:prod`）。到 api Project → Functions → 选中对应函数查看日志。

**Q: 管理后台 `/admin/login` 一直转圈、网络错误？**
A: 登录请求是 `POST /api/admin/login` → api 域名。检查：
1. `VITE_API_BASE` 是否正确（admin 设为 api 域名根，web 设为 api 域名 + `/api`）。
2. `DATABASE_URL` 是否正确。
3. 浏览器 DevTools 看实际请求 URL 与响应码。

**Q: 构建报 `prisma generate` 失败？**
A: Vercel 构建日志里搜 `prisma generate`。常见原因：`schema.prisma` 语法错误，或 Prisma CLI 版本与 `overrides` 不一致。构建期不需要真连数据库。

**Q: 生产能用 SQLite 吗？**
A: **不能**。Vercel Serverless 函数每次冷启动容器都是新的临时文件系统，SQLite 写入会丢。必须 MySQL（或 TiDB / Turso libSQL 等兼容方案）。

---

## 附：本仓库当前已包含的部署相关配置

- `vercel.json`（仓库根）— 仅 api Project 使用：`builds`（`@vercel/node` 挂 `apps/api/dist/vercel.js`）+ `/api/*` rewrites
- `apps/web/vercel.json` — 仅 web Project：SPA rewrites → `index.html`
- `apps/admin/vercel.json` — 仅 admin Project：SPA rewrites → `index.html`
- `package.json`（根）— `postinstall` 钩子：构建 `@jiucaibox/shared` → `prisma generate` → 编译 `@jiucaibox/api`（产出 `apps/api/dist/vercel.js`）
- `apps/api/src/vercel.ts` — NestJS serverless-http 入口（顶部 `import 'reflect-metadata'`）
- `apps/api/prisma/schema.prisma` — `provider = "mysql"` + `binaryTargets = ["native", "debian-openssl-3.0.x"]`
- `apps/api/package.json` — `build` 改为 `tsc -p tsconfig.build.json`（去掉 `--noEmit`，产出 `dist/vercel.js`）
- `apps/api/src/vercel.ts` & `apps/api/src/main.ts` — 顶部 `import 'reflect-metadata'`（避免 esbuild tree-shake 装饰器元数据导致 NestJS 构造器注入失败）
- `.gitignore` — 忽略 `apps/api/src/generated/` 与 `apps/api/dist/`（构建期生成）
