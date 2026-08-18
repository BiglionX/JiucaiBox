# Vercel 单项目部署指南（韭菜学院 / JiucaiBox monorepo）

本仓库是 monorepo（`apps/web` 用户端 H5、`apps/admin` 管理后台、`apps/api` NestJS 后端、`packages/shared` 共享类型）。当前配置支持把**前端 + 后端都部署在同一个 Vercel 项目**里，一个域名搞定所有访问。

## 0. 一句话结论

- **单 Vercel 项目**：`jiucaibox.vercel.app`
  - `/` → 用户端 H5（`apps/web`）
  - `/admin`、`/admin/login`、`/admin/dashboard`... → 管理后台 SPA（`apps/admin`）
  - `/api/*` → 后端 API（用户端接口，`apps/api`）
  - `/api/admin/*` → 后端 API（管理后台接口）
- **数据库**：**TiDB Cloud Serverless**（MySQL 协议、真永久免费档 5 GB）。schema 保持 `provider = "mysql"`，已落地的改动全部继续有效。
- **数据初始化**：在 TiDB SQL Editor 创建业务库后，本地用生产 `DATABASE_URL` 跑一次 `npm run db:setup:prod`。

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
| Framework Preset | **Other**（仓库根的 `vercel.json` 已用 `builds` 显式声明三个产物，覆盖了所有预设；不要选 Vite，monorepo 根目录会被误识别） |
| Root Directory | **留空**（仓库根 = monorepo 根）。**不要** 设成 `apps/web`，否则 web 之外的 admin/api 全部失效。 |
| Build & Output Settings | 全部留空 / 自动（由 `vercel.json` 中的 `builds` + `installCommand` 接管） |

`vercel.json` 关键内容：

- `installCommand`：`npm install && npm run build -w @jiucaibox/shared && npm run build -w @jiucaibox/api && npx prisma@6.19.3 generate --schema=apps/api/prisma/schema.prisma`
  - 装依赖 + 构建共享包 + 构建 API（产出 `apps/api/dist/vercel.js`，因为 `@vercel/node` 入口需要 .js）+ 生成 Prisma Client
- 三个 builds：
  - `apps/web/package.json` → `@vercel/static-build`（`buildCommand: npm run build -w @jiucaibox/web`，`distDir: apps/web/dist`）
  - `apps/admin/package.json` → `@vercel/static-build`（`buildCommand: npm run build -w @jiucaibox/admin`，`distDir: apps/admin/dist`）
  - `apps/api/dist/vercel.js` → `@vercel/node`（单函数处理所有 `/api/*`；`includeFiles` 把 `apps/api/dist/**`、`node_modules/.prisma/client/**`、`packages/shared/dist/**` 打进 lambda 包，保证 Prisma 原生引擎 + NestJS 装饰器元数据齐全）
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

## 4. 数据库：TiDB Cloud Serverless（推荐 / 免费）

### 4.1 为什么选 TiDB

| 方案 | 免费档 | MySQL 协议 | 备注 |
|---|---|---|---|
| **TiDB Cloud Serverless** ⭐ | 5 GB 存储 + 5 亿读/月 + 5000 万写/月，**永久** | ✅ | schema 不动（`provider="mysql"`） |
| PlanetScale Hobby | 2024 起停止新用户免费档 | ✅ | 老账号才可能有 |
| Railway | $5 试用额度 | ✅ | 用完即停 |
| Turso (libSQL) | 9 GB | ❌ | 需把 schema 改回 sqlite |
| Supabase / Neon | 0.5 GB | ❌ Postgres | 需改 schema 为 postgresql |
| 阿里云 / 腾讯云 MySQL | 短期试用 | ✅ | 试用结束收费 |

### 4.2 创建 TiDB Serverless 集群

1. 打开 https://tidbcloud.com → Sign up（GitHub 一键登录）
2. **Create Cluster** → 选 **Serverless**（不是 Dedicated，Dedicated 收费）
3. 区域建议 **Tokyo** 或 **Singapore**（Vercel 默认部署在美西 iad1，距离最近）
4. 集群创建后进控制台 → **Connect** → 选 **Prisma** → 复制它给你的 `DATABASE_URL`

URL 形如：
```
mysql://2LiXAyJwaq1teF5.root:<PASSWORD>@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/<DB>?ssl=...
```

> ⚠️ **不要自己拼 URL**，直接从 Connect 面板复制。TiDB 要求 TLS，URL 里的 `?ssl=...` 参数是它生成的，Prisma 直连即可。

### 4.3 创建业务库（必做，否则迁移会失败）

URL 末尾默认是 `/sys`（TiDB 系统元数据库），**不能跑 Prisma 迁移**。需要先建一个业务库：

1. TiDB 集群面板 → 左侧 **SQL Editor** → 连接
2. 执行：`CREATE DATABASE jiucaibox;`
3. 把 `DATABASE_URL` 末尾的 `/sys` 改成 `/jiucaibox`

### 4.4 本地初始化 + 部署

```bash
# 1. 把生产 URL 写进本地 .env（gitignored，不会进仓库）
#    文件：apps/api/.env
#    内容：DATABASE_URL="mysql://2LiXAyJwaq1teF5.root:真实密码@gateway01.../jiucaibox"

# 2. 跑迁移 + 种子（幂等）
npm run db:setup:prod --workspace apps/api

# 3. 部署到 Vercel 后，把同一段 DATABASE_URL 填到：
#    Vercel 项目 → Settings → Environment Variables → DATABASE_URL
```

`db:setup:prod` = `prisma migrate deploy && prisma db seed`，幂等可重跑。

种子数据包括：管理后台账号（取 `ADMIN_INIT_USERNAME` / `ADMIN_INIT_PASSWORD`）、演示用户、示例课程、视频、真相弹窗、测试题、韭菜电台、韭菜的泪花、风险词库。

### 4.5 常见 TiDB 坑

- **连接超时**：Vercel 函数冷启动首次连 TiDB 较慢（1-3 秒），把函数 memory 调到 1024 MB 可缓解；连接池在 NestJS 默认单例，热请求不会重连。
- **`/sys` 不能用**：迁移前一定要建业务库。
- **SSL**：URL 里的 `?ssl=...` 别删；删了连不上。
- **外键**：TiDB 对外键的检查比 MySQL 宽松，但你的 schema 已经验证兼容。

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

## 7. 为什么是「单 Vercel Project + 手动 builds 数组」而不是「Framework Preset 自动检测」

新手常见想法：

> "把 Root Directory 设成 `apps/web`、Framework Preset=Vite，让它自动检测 —— 不就不用写 vercel.json 了吗？"

这条路**在本仓库走不通**，原因：

1. **Vercel 单 Project 只能有一个 Root Directory**。设为 `apps/web` 后，admin 与 api 全部对 Vercel 不可见，没法一起部署。
2. **Framework Preset 自动检测**只对 Root Directory 所在的那个子项目生效；它要求 src 是单框架项目根（`apps/web` 自含 vite.config + package.json 满足，但 admin/api 也想加入就要么各开 Project、要么 root 留空 + 手动 builds）。
3. **「Root Directory=apps/web + 单 Project 同时承载 admin」是互斥的两个目标**。

权衡后本仓库选：

- **Root Directory 留空**（= monorepo 根），Framework Preset 选 Other，**全部构建通过 `vercel.json` 的 `builds` 数组手写**。
- 单 Project 一次管 web + admin + api；域名唯一；rewrites 分流。
- 代价是牺牲了"自动检测"的红利，但换来"一个 Vercel Project、一个域名"。

如果想要"Framework Preset 自动检测"的红利，备选方案是把 admin 单独开第二个 Vercel Project（Root Directory=`apps/admin`），把 api 走 Railway/Render 等长进程平台。本仓库目前不采用此路线。

---

## 附：本仓库当前已包含的部署相关配置

- `vercel.json`（仓库根）— 单项目三 build + rewrites 分发
- `apps/api/src/vercel.ts` — NestJS serverless-http 入口（顶部 `import 'reflect-metadata'`）
- `apps/api/prisma/schema.prisma` — `provider = "mysql"`
- `apps/api/src/admin/admin.controller.ts` — 路径前缀改为 `/api/admin`
- `apps/api/src/common/jwt-auth.guard.ts` — Admin 路由放行匹配 `/api/admin`
- `apps/admin/src/api/index.ts` — 所有调用改用 `/api/admin/...`
- `apps/api/package.json` — 新增 `serverless-http` 依赖与 `db:setup:prod` 脚本；`build` 改为 `tsc -p tsconfig.build.json`（去掉 `--noEmit`，让 `@vercel/node` 找到编译产物 `apps/api/dist/vercel.js`）
- `apps/api/prisma/schema.prisma` — generator 加 `binaryTargets = ["native", "debian-openssl-3.0.x"]`（Vercel Lambda 是 Amazon Linux 2 + openssl 3）
- `apps/api/src/vercel.ts` & `apps/api/src/main.ts` — 顶部 `import 'reflect-metadata'`（显式 side-effect，避免 esbuild tree-shake 装饰器元数据导致 NestJS 构造器注入失败）
- `.gitignore` — 忽略 `apps/api/src/generated/` 与 `apps/api/dist/`（Prisma 生成产物 + tsc 编译产物，构建期生成）