# 计划管理应用

个人日程计划管理工具，支持按年 / 月 / 日三级视图浏览和管理计划，移动端优先设计。

## 技术栈

| 端 | 技术 |
|---|---|
| 前端 | Umi 4 · React 18 · TypeScript · Ant Design 5 · @dnd-kit/core |
| 后端 | Express · better-sqlite3 · TypeScript · zod |
| 数据库 | SQLite（WAL 模式，本地文件 `server/data/plans.db`） |

## 功能特性

- **三级视图**：年视图（月度统计概览）、月视图（日历 + 当日列表）、日视图（时间轴 + 全天区域）
- **计划管理**：新建、编辑、删除、勾选完成状态
- **优先级标识**：低 / 中 / 高三档，PlanCard 左侧色条可视化区分
- **循环计划**：每天 / 每周 / 每月重复，提前批量生成，各实例完成状态独立；编辑 / 删除支持仅此条 / 此条及之后 / 全部三种范围
- **搜索**：全局关键词搜索计划标题，结果页按日期分组展示
- **拖拽调整时间**：日视图时间轴计划块可直接拖拽移动，5 分钟步进吸附，松手后自动保存
- **标签系统**：5 个预置标签（工作 / 学习 / 健身 / 生活 / 其他），支持自定义添加
- **时间段**：可选开始 / 结束时间，日视图中展示在时间轴上
- **错误处理**：请求拦截器统一弹错误提示，操作按钮有 loading 状态防重复提交
- **移动端适配**：月视图在 <768px 下切换为日期分组列表；Modal 表单全屏；FAB 按钮适配 iOS 安全区域
- **当前时间线**：日视图今天显示红色实时指示线

## 项目结构

```
test/
├── client/                  # 前端（端口 8000）
│   ├── .umirc.ts            # 路由、代理配置
│   ├── playwright.config.ts # E2E 测试配置
│   ├── e2e/                 # Playwright E2E 测试
│   └── src/
│       ├── types/           # Plan、Tag、API 响应类型
│       ├── services/        # fetch 封装（plan、tag）
│       ├── styles/          # variables.less（响应式断点）
│       ├── layouts/         # 顶部导航布局（含搜索框）
│       ├── components/
│       │   ├── PlanCard/    # 计划卡片（勾选、编辑、删除、优先级色条）
│       │   ├── PlanForm/    # 新建 / 编辑 Modal 表单（含循环计划字段）
│       │   └── FabButton/   # 右下角悬浮新建按钮
│       └── pages/plans/
│           ├── year.tsx           # 年视图
│           ├── month.tsx          # 月视图
│           ├── day.tsx            # 日视图（含拖拽）
│           ├── DraggableTimeBlock.tsx  # 可拖拽时间块组件
│           └── search.tsx         # 搜索结果页
└── server/                  # 后端（端口 3001）
    ├── vitest.config.ts     # 单元测试配置
    └── src/
        ├── __tests__/       # vitest 单元 + 集成测试
        ├── domain/          # 实体、仓库接口、领域错误
        ├── application/     # PlanService、TagService
        ├── infrastructure/  # SQLite 仓库实现、migrate、seed
        └── interface/       # Express 路由、控制器、zod 校验
```

## 快速开始

### Docker 一键启动（生产模式）

```bash
# 从项目根目录（需已安装 Docker Desktop）
docker compose up --build
```

首次构建约需 3–5 分钟。完成后访问 `http://localhost`，Nginx 服务前端静态文件，`/api` 请求自动转发到后端容器。

局域网内其他设备可通过本机 IP 访问，例如 `http://192.168.x.x`。

```bash
docker compose down        # 停止（保留数据库）
docker compose down -v     # 停止并删除数据库（完全重置）
docker compose restart     # 重启容器（不重新构建）
```

### 离线镜像包部署

适用于目标机器无法访问 Docker Hub 的场景。

**导出镜像（已构建的机器）：**
```bash
docker save test-backend:latest test-frontend:latest -o plan-app.tar
```

**目标机器导入并启动：**
```bash
# 导入镜像
docker load -i plan-app.tar

# 将 docker-compose.yml 拷贝到同目录，然后启动
docker compose up -d
```

目标机器只需安装 Docker Desktop，无需联网。需要拷贝的文件：`plan-app.tar` + `docker-compose.yml`。

### 国内网络构建说明

如果拉取 Docker Hub 镜像超时，可先手动从镜像源拉取并打 tag：

```bash
docker pull docker.m.daocloud.io/library/node:20-alpine
docker pull docker.m.daocloud.io/library/nginx:1.27-alpine
docker tag docker.m.daocloud.io/library/node:20-alpine node:20-alpine
docker tag docker.m.daocloud.io/library/nginx:1.27-alpine nginx:1.27-alpine
```

再执行 `docker compose up --build` 即可。

### 本地开发启动

#### 环境要求

- Node.js 20（后端必须）
- pnpm（前后端包管理器）

#### 安装依赖

```bash
# 后端
cd server
pnpm install

# 前端
cd client
pnpm install
```

> **Windows + nvm-windows 用户**：安装前先执行 `nvm use 20` 切换到 Node 20，再运行 `pnpm install`。

### 启动开发服务器

```bash
# 后端（新终端）
cd server
pnpm dev          # http://localhost:3001

# 前端（新终端）
cd client
pnpm dev          # http://localhost:8000
```

浏览器访问 `http://localhost:8000` 即可使用。

### 构建生产版本

```bash
# 后端
cd server
pnpm build        # 输出到 dist/
pnpm start        # 运行编译产物

# 前端
cd client
pnpm build        # 输出到 dist/
```

## API 概览

所有响应格式统一为 `{ success: true, data: T }` 或 `{ success: false, error: { code, message } }`。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/plans?view=year&date=YYYY` | 年视图统计（每月 total/done） |
| GET | `/api/plans?view=month&date=YYYY-MM` | 月度计划列表 |
| GET | `/api/plans?view=day&date=YYYY-MM-DD` | 当日计划列表 |
| GET | `/api/plans?view=search&q=关键词` | 全文搜索（LIKE 匹配标题） |
| POST | `/api/plans` | 新建计划（支持循环计划批量生成） |
| PUT | `/api/plans/:id` | 更新单条计划 |
| PUT | `/api/plans/:id/recurrence` | 批量更新循环计划（scope: one/future/all） |
| DELETE | `/api/plans/:id` | 删除单条计划 |
| DELETE | `/api/plans/:id/recurrence?scope=` | 批量删除循环计划（scope: one/future/all） |
| GET | `/api/tags` | 获取所有标签 |
| POST | `/api/tags` | 新增自定义标签 |
| DELETE | `/api/tags/:id` | 删除自定义标签（预置标签不可删） |

### 计划字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 标题（必填，最多 100 字符） |
| `date` | string | 日期（YYYY-MM-DD，必填） |
| `start_time` | string \| null | 开始时间（HH:MM，可选） |
| `end_time` | string \| null | 结束时间（HH:MM，可选，须晚于开始时间） |
| `tags` | string[] | 标签名数组（可选） |
| `done` | boolean | 完成状态（默认 false） |
| `priority` | 1 \| 2 \| 3 | 优先级：1=低，2=中，3=高（默认 1） |
| `recurrence_type` | string | 循环类型：none/daily/weekly/monthly（默认 none） |
| `recurrence_days` | number[] \| null | 每周循环的星期（0=日…6=六，仅 weekly 有效） |
| `recurrence_end_date` | string \| null | 循环结束日期（可空，默认 90 天） |
| `recurrence_group_id` | string \| null | 同组循环计划共享的 UUID，普通计划为 null |

## 开发规范

- 后端遵循 DDD 四层架构，依赖方向：`interface → application → domain`，`infrastructure` 实现 `domain` 接口
- 前端禁止 `any`（用 `unknown` + 类型收窄）、禁止内联样式（用 CSS Modules）、禁止 `console.log` 提交
- API 调用全部封装在 `src/services/`，页面组件不直接调用 fetch
- 状态管理仅用 `useState + useEffect`，不引入 Redux / Zustand
- 请求层统一错误处理：`request.ts` 的 `req()` 函数拦截所有失败请求并弹 `message.error`，调用方使用 `.finally()` 清理 loading 状态

## 测试

### 后端单元 + 集成测试（vitest）

```bash
cd server
pnpm test              # 运行所有测试
pnpm test:watch        # 监听模式
pnpm test:coverage     # 生成覆盖率报告
```

测试覆盖：PlanService / TagService 单元测试（mock repository）、zod validators 校验规则、SqlitePlanRepository / SqliteTagRepository 集成测试（SQLite `:memory:`）。

### 前端 E2E 测试（Playwright）

```bash
# 先启动前后端 dev server，再执行：
cd client
pnpm test:e2e           # 有头模式运行（可见浏览器窗口）
pnpm test:e2e:ui        # Playwright UI 交互模式（推荐调试）
pnpm test:e2e:report    # 查看上次报告
```

> 首次运行需安装 Chromium：`npx playwright install chromium`

测试覆盖：视图导航、计划 CRUD 流程、表单校验、移动端 390px 布局。API 通过 `page.route` mock，不依赖真实后端。


## 项目结构

```
test/
├── client/                  # 前端（端口 8000）
│   ├── .umirc.ts            # 路由、代理配置
│   ├── playwright.config.ts # E2E 测试配置
│   ├── e2e/                 # Playwright E2E 测试
│   └── src/
│       ├── types/           # Plan、Tag、API 响应类型
│       ├── services/        # fetch 封装（plan、tag）
│       ├── styles/          # variables.less（响应式断点）
│       ├── layouts/         # 顶部导航布局（含搜索框）
│       ├── components/
│       │   ├── PlanCard/    # 计划卡片（勾选、编辑、删除、优先级色条）
│       │   ├── PlanForm/    # 新建 / 编辑 Modal 表单（含循环计划字段）
│       │   └── FabButton/   # 右下角悬浮新建按钮
│       └── pages/plans/
│           ├── year.tsx           # 年视图
│           ├── month.tsx          # 月视图
│           ├── day.tsx            # 日视图（含拖拽）
│           ├── DraggableTimeBlock.tsx  # 可拖拽时间块组件
│           └── search.tsx         # 搜索结果页
└── server/                  # 后端（端口 3001）
    ├── vitest.config.ts     # 单元测试配置
    └── src/
        ├── __tests__/       # vitest 单元 + 集成测试
        ├── domain/          # 实体、仓库接口、领域错误
        ├── application/     # PlanService、TagService
        ├── infrastructure/  # SQLite 仓库实现、migrate、seed
        └── interface/       # Express 路由、控制器、zod 校验
```

## 快速开始

### Docker 一键启动（生产模式）

```bash
# 从项目根目录（需已安装 Docker Desktop）
docker compose up --build
```

首次构建约需 3–5 分钟。完成后访问 `http://localhost`，Nginx 服务前端静态文件，`/api` 请求自动转发到后端容器。

局域网内其他设备可通过本机 IP 访问，例如 `http://192.168.x.x`。

```bash
docker compose down        # 停止（保留数据库）
docker compose down -v     # 停止并删除数据库（完全重置）
docker compose restart     # 重启容器（不重新构建）
```

### 离线镜像包部署

适用于目标机器无法访问 Docker Hub 的场景。

**导出镜像（已构建的机器）：**
```bash
docker save test-backend:latest test-frontend:latest -o plan-app.tar
```

**目标机器导入并启动：**
```bash
# 导入镜像
docker load -i plan-app.tar

# 将 docker-compose.yml 拷贝到同目录，然后启动
docker compose up -d
```

目标机器只需安装 Docker Desktop，无需联网。需要拷贝的文件：`plan-app.tar` + `docker-compose.yml`。

### 国内网络构建说明

如果拉取 Docker Hub 镜像超时，可先手动从镜像源拉取并打 tag：

```bash
docker pull docker.m.daocloud.io/library/node:20-alpine
docker pull docker.m.daocloud.io/library/nginx:1.27-alpine
docker tag docker.m.daocloud.io/library/node:20-alpine node:20-alpine
docker tag docker.m.daocloud.io/library/nginx:1.27-alpine nginx:1.27-alpine
```

再执行 `docker compose up --build` 即可。

### 本地开发启动

#### 环境要求

- Node.js 20（后端必须）
- pnpm（前端包管理器）

#### 安装依赖

```bash
# 后端
cd server
pnpm install

# 前端
cd client
pnpm install
```

> **Windows + nvm-windows 用户**：安装前先执行 `nvmuse 20` 切换到 Node 20，再运行 `pnpm install`。

### 启动开发服务器

```bash
# 后端（新终端）
cd server
pnpm dev          # http://localhost:3001

# 前端（新终端）
cd client
pnpm dev          # http://localhost:8000
```

浏览器访问 `http://localhost:8000` 即可使用。

### 构建生产版本

```bash
# 后端
cd server
pnpm build        # 输出到 dist/
pnpm start        # 运行编译产物

# 前端
cd client
pnpm build        # 输出到 dist/
```

## API 概览

所有响应格式统一为 `{ success: true, data: T }` 或 `{ success: false, error: { code, message } }`。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/plans?view=year&date=YYYY` | 年视图统计（每月 total/done） |
| GET | `/api/plans?view=month&date=YYYY-MM` | 月度计划列表 |
| GET | `/api/plans?view=day&date=YYYY-MM-DD` | 当日计划列表 |
| POST | `/api/plans` | 新建计划 |
| PUT | `/api/plans/:id` | 更新计划 |
| DELETE | `/api/plans/:id` | 删除计划 |
| GET | `/api/tags` | 获取所有标签 |
| POST | `/api/tags` | 新增自定义标签 |
| DELETE | `/api/tags/:id` | 删除自定义标签（预置标签不可删） |

### 计划字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 标题（必填，最多 100 字符） |
| `date` | string | 日期（YYYY-MM-DD，必填） |
| `start_time` | string \| null | 开始时间（HH:MM，可选） |
| `end_time` | string \| null | 结束时间（HH:MM，可选，须晚于开始时间） |
| `tags` | string[] | 标签名数组（可选） |
| `done` | boolean | 完成状态（默认 false） |

## 开发规范

- 后端遵循 DDD 四层架构，依赖方向：`interface → application → domain`，`infrastructure` 实现 `domain` 接口
- 前端禁止 `any`（用 `unknown` + 类型收窄）、禁止内联样式（用 CSS Modules）、禁止 `console.log` 提交
- API 调用全部封装在 `src/services/`，页面组件不直接调用 fetch
- 状态管理仅用 `useState + useEffect`，不引入 Redux / Zustand

## 测试

### 后端单元 + 集成测试（vitest）

```bash
cd server
pnpm test              # 运行所有测试
pnpm test:watch        # 监听模式
pnpm test:coverage     # 生成覆盖率报告
```

测试覆盖：PlanService / TagService 单元测试（mock repository）、zod validators 校验规则、SqlitePlanRepository / SqliteTagRepository 集成测试（SQLite `:memory:`）。

### 前端 E2E 测试（Playwright）

```bash
# 先启动前后端 dev server，再执行：
cd client
pnpm test:e2e           # 有头模式运行（可见浏览器窗口）
pnpm test:e2e:ui        # Playwright UI 交互模式（推荐调试）
pnpm test:e2e:report    # 查看上次报告
```

> 首次运行需安装 Chromium：`npx playwright install chromium`

测试覆盖：视图导航、计划 CRUD 流程、表单校验、移动端 390px 布局。API 通过 `page.route` mock，不依赖真实后端。所有 46 个用例在 chromium + mobile-chrome 两个 project 下均通过。
