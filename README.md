# 计划管理应用

个人日程计划管理工具，支持按年 / 月 / 日三级视图浏览和管理计划，移动端优先设计。

## 技术栈

| 端 | 技术 |
|---|---|
| 前端 | Umi 4 · React 18 · TypeScript · Ant Design 5 |
| 后端 | Express · better-sqlite3 · TypeScript · zod |
| 数据库 | SQLite（WAL 模式，本地文件 `server/data/plans.db`） |

## 功能特性

- **三级视图**：年视图（月度统计概览）、月视图（日历 + 当日列表）、日视图（时间轴 + 全天区域）
- **计划管理**：新建、编辑、删除、勾选完成状态
- **标签系统**：5 个预置标签（工作 / 学习 / 健身 / 生活 / 其他），支持自定义添加
- **时间段**：可选开始 / 结束时间，日视图中展示在时间轴上
- **移动端适配**：月视图在 <768px 下切换为日期分组列表；Modal 表单全屏；FAB 按钮适配 iOS 安全区域
- **当前时间线**：日视图今天显示红色实时指示线

## 项目结构

```
test/
├── client/                  # 前端（端口 8000）
│   ├── .umirc.ts            # 路由、代理配置
│   └── src/
│       ├── types/           # Plan、Tag、API 响应类型
│       ├── services/        # fetch 封装（plan、tag）
│       ├── styles/          # variables.less（响应式断点）
│       ├── layouts/         # 顶部导航布局
│       ├── components/
│       │   ├── PlanCard/    # 计划卡片（勾选、编辑、删除）
│       │   ├── PlanForm/    # 新建 / 编辑 Modal 表单
│       │   └── FabButton/   # 右下角悬浮新建按钮
│       └── pages/plans/
│           ├── year.tsx     # 年视图
│           ├── month.tsx    # 月视图
│           └── day.tsx      # 日视图
└── server/                  # 后端（端口 3001）
    └── src/
        ├── domain/          # 实体、仓库接口、领域错误
        ├── application/     # PlanService、TagService
        ├── infrastructure/  # SQLite 仓库实现、migrate、seed
        └── interface/       # Express 路由、控制器、zod 校验
```

## 快速开始

### 环境要求

- Node.js 20（后端必须）
- pnpm（前端包管理器）

### 安装依赖

```bash
# 后端
cd server
npm install

# 前端
cd client
pnpm install
```

> Windows + nvm-windows 用户，安装前先切换 Node 版本：
> ```bash
> nvmuse 20
> command npm install   # 绕过 bash wrapper，使用真实 npm
> ```

### 启动开发服务器

```bash
# 后端（新终端）
cd server
npm run dev       # http://localhost:3001

# 前端（新终端）
cd client
pnpm dev          # http://localhost:8000
```

浏览器访问 `http://localhost:8000` 即可使用。

### 构建生产版本

```bash
# 后端
cd server
npm run build     # 输出到 dist/
npm run start     # 运行编译产物

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
