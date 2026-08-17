# 韭菜学院 / JiucaiBox

> **一所没有围墙的"防割大学"，一个普通人身边的避坑基础设施。**
> 用免费、真实、可参与的方式，帮助大众识别并抵御以"直播培训、财商教育、招商加盟"等为名的割韭菜行为。

本项目依据仓库内 5 份文档（`韭菜学院项目说明书.md`、`韭菜学院技术文档.md`、`韭菜学院前端设计说明书.md`、`韭菜学院用户中心需求文档.md`、`韭菜学院管理后台说明书.md`）组织开发。

## 产品定位

纯虚拟、免费优先的 H5 轻应用平台，以"防割"为核心，整合 **认知教育、风险测评、体验式学习、真实案例、新闻预警** 五大能力，形成闭环：

```
韭菜电台/反割测评 → 发现风险 → 学习真相课/体验营 → 韭菜的泪花分享经历 → 案例反哺测评与课程（飞轮）
```

七大模块：直播行业真相课、反割韭菜测评、韭菜体验营、韭菜财商学院、韭菜致富营、韭菜的泪花（社区）、韭菜电台（预警）。

## 仓库结构（Monorepo）

```
JiucaiBox/
├── apps/
│   ├── web/        # H5 前端（Vue 3 + Vite + Vant 4 + Pinia）  http://localhost:5173
│   ├── admin/      # 管理后台（Vue 3 + Vite + Ant Design Vue） http://localhost:5174
│   └── api/        # 后端 API（NestJS + Prisma）               http://localhost:3000
├── packages/
│   └── shared/     # 三端共享类型 / 常量 / 风险词库
├── docker-compose.yml   # 生产形态基础设施：MySQL 8 + Redis 7
└── docs/           # 开发计划与协作文档
```

## 快速开始

```bash
# 0) 前置要求：Node.js >= 20（推荐 22+）

# 1) 安装依赖（一次性，根目录执行）
npm install

# 2) 初始化数据库（默认 SQLite，零依赖即可运行）
npm run db:generate   # 生成 Prisma Client
npm run db:push       # 建表（SQLite 直接生效）
npm run db:seed       # 写入演示数据（管理员账号、课程、电台、故事、词库）

# 3) 启动三端（三个终端分别执行）
npm run dev:api       # 后端 http://localhost:3000
npm run dev:web       # H5 前端 http://localhost:5173
npm run dev:admin     # 管理后台 http://localhost:5174
```

### 演示账号

| 端 | 账号 | 密码 |
|---|---|---|
| 管理后台 | `admin` | `jiucai123456` |
| H5（手机号登录，验证码任意 6 位数字） | `13800138000` | 例如 `123456` |

### 常用命令

```bash
npm run build          # 构建全部三端 + 共享包
npm run dev:api        # 后端开发模式（热重载）
npm run dev:web        # H5 开发模式
npm run dev:admin      # 管理后台开发模式
npm run db:migrate     # 数据库迁移（开发）
npm run db:seed        # 重新灌入演示数据
```

## 技术要点

- **视频不占用服务器带宽**：H5 仅存储标题/封面/外链，点击跳转抖音、视频号播放，符合《技术文档》轻运营模式。
- **AI 测评双引擎**：配置 `DEEPSEEK_API_KEY` 时调用大模型（DeepSeek，OpenAI 兼容协议）进行风险分析；未配置时自动回退**本地规则引擎**（内置风险词库 + 高风险触发词），保证开箱即用。
- **合规红线**：测评仅输出"风险特征/风险等级"，不做"骗子"等定性判断；所有报告与课程页附免责声明；"韭菜的泪花"强制匿名；涉及贷款/紧急信号触发红色紧急提示。
- **鉴权双体系**：用户 JWT（`api/*`）与管理后台 JWT（`admin/*`，独立签名 + RBAC 角色：super_admin / content_ops / reviewer / support / analyst）。

## 数据库

- 默认 **SQLite**（`apps/api/prisma/dev.db`）：本地零依赖开发。
- 生产切换 **MySQL 8**：`docker compose up -d` 后修改 `apps/api/.env` 中 `DB_PROVIDER=mysql` 与 `DATABASE_URL`（详见 `.env.example`）。
- Redis 已纳入 docker-compose，供后续会话/限流/队列扩展使用。

## 环境变量（apps/api/.env）

| 变量 | 说明 | 默认 |
|---|---|---|
| `PORT` | API 端口 | 3000 |
| `DB_PROVIDER` | sqlite / mysql | sqlite |
| `DATABASE_URL` | 数据库连接串 | file:./dev.db |
| `JWT_SECRET` | 用户 JWT 密钥（生产必改） | - |
| `DEEPSEEK_API_KEY` | 大模型 Key（留空使用规则引擎） | 空 |
| `DEEPSEEK_BASE_URL` / `DEEPSEEK_MODEL` | 大模型端点与模型 | api.deepseek.com / deepseek-chat |
| `WEB_ORIGIN` | CORS 白名单（逗号分隔） | 本地 5173/5174 |
| `ADMIN_INIT_USERNAME` / `ADMIN_INIT_PASSWORD` | seed 管理账号 | admin / jiucai123456 |

## API 一览

- 用户端（`/api/*`）：`auth`（wechat/phone）、`user`（profile/learning/analysis/stories/interactions/notifications/account）、`courses`、`analysis`（测评 + 深度接洽）、`popup`、`quiz`、`stories`（泪花社区 + 抱抱 + 评论）、`radio`、`home`
- 管理端（`/admin/*`）：`login`、`dashboard`、`courses`、`videos`、`popups`、`quiz`、`analysis`（列表/详情/复核）、`stories`（审核/驳回/删除）、`comments`、`radio`、`users`（封禁）、`lexicon`、`stats/overview`、`logs`
- 健康检查：`GET /api/health`

完整接口契约见 `packages/shared/src/types.ts` 与各控制器源码。

## 目录

- `docs/开发计划.md` —— 任务分解与迭代路线
- `docs/` —— 协作规范（随开发补充）

## 合规声明

本平台内容仅供教育参考，不构成事实认定或法律意见；不推荐任何具体金融产品；所有体验课内容由 AI 原创生成，仅模仿话术结构，不抄袭具体文案。
