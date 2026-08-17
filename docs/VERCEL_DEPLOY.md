# Vercel 单项目部署指南（韭菜学院 / JiucaiBox monorepo）

本仓库是 monorepo（`apps/web` 用户端 H5、`apps/admin` 管理后台、`apps/api` NestJS 后端、`packages/shared` 共享类型）。当前配置支持把**前端 + 后端都部署在同一个 Vercel 项目**里，一个域名搞定所有访问。

## 0. 一句话结论

- **单 Vercel 项目**：`jiucaibox.vercel.app`
  - `/` → 用户端 H5（`apps/web`）
  - `/admin`、`/admin/login`、`/admin/dashboard`... → 管理后台 SPA（`apps/admin`）
  - `/api/*` → 后端 API（用户端接口，`apps/api`）
  - `/api/admin/*` → 后端 API（管理后台接口）
- **数据库**：必须用 **MySQL**（Vercel Serverless 文件系统临时，不能用 SQLite）。免费档可选 PlanetScale / TiDB Cloud / 阿里云 RDS / Neon 等。
- **数据初始化**：部署后在本地用生产 `DATABASE_URL` 跑一次 `npm run db:setup:prod`。

## 1. 域名路径总览

| 用户访问 | 内容 | 实现 |
|---|---|---|
| `https://jiucaibox.vercel.app/` | H5 首页（→ `/home`） | `apps/web` SPA，rewrite `/` → `apps/web/dist/index.html` |
| `https://jiucaibox.vercel.app/home`、`/courses`、`/stories` ... | H5 各页面 | 同上 SPA |
| `https://jiucaibox.vercel.app/admin` | 管理后台登录页 | `apps/admin` SPA，rewrite `/admin{,/...}` → `apps/admin/dist/index.html` |
| `https://jiucaibox.vercel.app/admin/dashboard` | 管理后台仪表盘 | 同上 SPA（前端路由） |
| `https://jiucaibox.vercel.app/api/auth/phone` | 后端 API（用户端） | `apps/api` serverless 函数，rewrite `/api/*` → `vercel.ts` |
| `https://jiucaibox.vercel.app/api/admin/login` | 后端 API（管理后台） | 同上函数，rewrite `/api/admin/*` → `vercel.ts` |

> 路径冲突处理：管理后台 SPA 用 `/admin`，管理后台 API 改用 `/api/admin`。前端 axios 调用统一写全路径（`/api/admin/...`），与 SPA 路由 `/admin/...` 不再撞车。

## 2. Vercel 项目配置

Add New Project → 选 `BiglionX/JiucaiBox`：

| 设置项 | 值 |
|---|---|
| Project Name | `jiucaibox` |
| Framework Preset | **Other**（仓库根的 `vercel.json` 已用 `builds` 显式声明三个产物，覆盖了所有预设） |
| Root Directory | 留空（仓库根） |
| Build & Output Settings | 全部留空 / 自动（由 `vercel.json` 中的 `builds` + `installCommand` 接管） |

`vercel.json` 关键内容：

- `installCommand`：`npm install && npm run prisma:generate --workspace apps/api`（安装后生成 Prisma Client）
- 三个 builds：
  - `apps/web/package.json` → `@vercel/static-build` → `apps/web/dist`
  - `apps/admin/package.json` → `@vercel/static-build` → `apps/admin/dist`
  - `apps/api/src/vercel.ts` → `@vercel/node`（单函数处理所有 `/api/*`）
- rewrites 把三类请求分发到对应产物。

## 3. 环境变量（Vercel → Settings → Environment Variables）

| Key | Value | 必填 | 说明 |
|---|---|---|---|
| `DATABASE_URL` | `mysql://USER:PASSWORD@HOST:3306/DBNAME` | ✅ | 生产 MySQL 连接串。**不要**填 SQLite |
| `JWT_SECRET` | 32 位以上随机字符串 | ✅ | 用于签发 token；务必替换 `apps/api/.env.example` 里的 dev 默认值 |
| `JWT_EXPIRES_IN` | `30d` | ⭕ | 默认 30 天 |
| `WEB_ORIGIN` | `*` 或具体域名（逗号分隔） | ⭕ | CORS 白名单；同源部署可直接填 `*` |
| `DEEPSEEK_API_KEY` | `sk-...` | ⭕ | 启用 AI 测评；不填则使用内置规则引擎 |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | ⭕ | 默认值 |
| `DEEPSEEK_MODEL` | `deepseek-chat` | ⭕ | 默认值 |
| `ADMIN_INIT_USERNAME` | `admin` | ⭕ | seed 时初始化管理后台账号 |
| `ADMIN_INIT_PASSWORD` | 自定义强密码 | ✅ | seed 时初始化管理后台密码 |
| `VITE_API_BASE` | **不填** | ⭕ | 同源部署不需要；仅当你想让前端指向跨域 API 时才设 |

> ⚠️ Vite 的环境变量以 `VITE_` 开头才会被嵌入前端包，因此 `VITE_API_BASE` 留给"前端跨域调用"场景。默认同源时不要设。

## 4. 数据库初始化（部署完成后）

Vercel Serverless 没法在构建期跑 `prisma migrate deploy`（无外部数据库连接保证），所以需要在本地用生产 `DATABASE_URL` 跑：

```bash
# 1. 在本地终端导出生产数据库连接
export DATABASE_URL='mysql://USER:PASSWORD@HOST:3306/DBNAME'

# 2. 跑迁移 + 种子数据（幂等，可重复）
npm run db:setup:prod --workspace apps/api

# 等价于：
#   - npm run prisma:migrate --workspace apps/api   (开发用 migrate dev)
#   - 实际生产用：npx prisma migrate deploy
#   - 然后：npx prisma db seed
```

`db:setup:prod` 已配置在 `apps/api/package.json`，执行 `prisma migrate deploy && prisma db seed`。

种子数据包括：

- 管理后台账号（取 `ADMIN_INIT_USERNAME` / `ADMIN_INIT_PASSWORD`，默认 `admin` / `jiucai123456`，**部署后立刻改密码**）
- 演示用户、示例课程、视频、真相弹窗、测试题
- 韭菜电台预警（高发新型骗局）
- 韭菜的泪花 UGC 案例
- 风险词库（含扩展词）

## 5. 本地开发

本仓库同时支持本地继续开发，与生产部署同源（Vite proxy 把 `/api/*` 和 `/admin/*` 转到本地后端）：

```bash
# 终端 1：MySQL（若不想装本地 MySQL，把 schema.prisma provider 临时改回 "sqlite" + DATABASE_URL="file:./dev.db"）
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

## 6. 常见问题

**Q: 主域名打开跳到管理后台登录页 `/login?redirect=/dashboard`？**
A: 历史问题（已修复）。旧部署里 Vercel 把 Root Directory 设到了 `apps/admin`。本仓库当前 `vercel.json` 已统一管理三个产物，按本文档部署即可。

**Q: H5 接口全部 404？**
A: 99% 是 `DATABASE_URL` 没设对，或者生产 MySQL 没初始化（没跑 `db:setup:prod`）。到 Vercel 项目 → Functions → 选中对应函数查看日志。

**Q: 管理后台 `/admin/login` 一直转圈、网络错误？**
A: 登录请求是 `POST /api/admin/login` → 后端函数。检查：
1. `DATABASE_URL` 是否正确（后端启动日志会打印 Prisma 连接错误）。
2. `ADMIN_INIT_PASSWORD` 是否在 seed 时生效（默认 `jiucai123456`，生产务必改）。
3. 浏览器 DevTools 看 `/api/admin/login` 响应码与内容。

**Q: 构建报 `prisma generate` 失败？**
A: Vercel 构建日志里搜 `prisma generate`。常见原因：`schema.prisma` 里有语法错误，或者 `DATABASE_URL` 在构建期也被 prisma 读取。`installCommand` 已显式串了 prisma generate，构建期不需要真连数据库。

**Q: 第一次部署后 Prisma Client 找不到？**
A: `vercel.json` 的 `installCommand` 已串了 `prisma generate`。如果还是报，多半是 `apps/api/src/generated/` 没生成。检查构建日志。

**Q: 生产能用 SQLite 吗？**
A: **不能**。Vercel Serverless 函数每次冷启动容器都是新的临时文件系统，SQLite 写入会丢，且 `/tmp` 容量受限。必须 MySQL（或兼容方案如 TiDB / Turso libSQL）。

---

## 附：本仓库当前已包含的部署相关配置

- `vercel.json`（仓库根）— 单项目三 build + rewrites 分发
- `apps/api/src/vercel.ts` — NestJS serverless-http 入口
- `apps/api/prisma/schema.prisma` — `provider = "mysql"`
- `apps/api/src/admin/admin.controller.ts` — 路径前缀改为 `/api/admin`
- `apps/api/src/common/jwt-auth.guard.ts` — Admin 路由放行匹配 `/api/admin`
- `apps/admin/src/api/index.ts` — 所有调用改用 `/api/admin/...`
- `apps/api/package.json` — 新增 `serverless-http` 依赖与 `db:setup:prod` 脚本
- `.gitignore` — 忽略 `apps/api/src/generated/`（Prisma 生成产物，构建期生成）