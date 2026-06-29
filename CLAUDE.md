# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

个人日程计划管理应用，支持按年/月/日三级视图浏览和管理计划，移动端优先设计。

- **前端** (`client/`)：Umi 4 + React 18 + TypeScript + Ant Design 5 — 端口 8000
- **后端** (`server/`)：Express + better-sqlite3 + TypeScript — 端口 3001
- **包管理器**：前后端均使用 pnpm + Node 20

## Node 版本注意事项

本项目使用 nvm-windows，前后端**均须 Node 20**：`nvmuse 20`。

better-sqlite3 是原生模块，需要 Windows C++ 构建工具。若编译失败，在管理员 PowerShell 中执行：`npm install --global windows-build-tools`

pnpm 安装 better-sqlite3 须在 `package.json` 声明 `"pnpm": { "onlyBuiltDependencies": ["better-sqlite3", "esbuild"] }`，否则构建脚本默认被跳过。

## 常用命令

### 后端（`server/`）

```bash
pnpm dev      # tsx watch 热重载，监听 3001 端口
pnpm build    # tsc 编译到 dist/
pnpm start    # 运行编译产物
pnpm lint     # tsc --noEmit 类型检查
```

### 前端（`client/`，待初始化）

```bash
pnpm dev         # Umi 开发服务器，端口 8000
pnpm build       # 生产构建
pnpm lint        # @umijs/lint
```

## 后端架构（DDD 标准四层）

依赖方向：`interface → application → domain`，`infrastructure` 实现 `domain` 中定义的接口。

```
server/src/
├── domain/          # 实体、仓库接口、领域错误 — 无任何外部依赖
├── application/     # 用例 Service（PlanService、TagService）— 只编排领域逻辑
├── infrastructure/  # domain 接口的 SQLite 实现；数据库连接、migrate、seed
└── interface/       # Express 路由、控制器、zod 校验器、错误中间件
```

依赖注入在 `interface/app.ts` 中手动完成——Repository 在此实例化后通过构造函数逐层传入。

数据库文件路径：`server/data/plans.db`，首次启动时由 `migrate.ts` 自动创建。seed 使用 `INSERT OR IGNORE`，重复启动安全。

## API 约定

所有响应格式：`{ success: true, data: T }` 或 `{ success: false, error: { code, message } }`。

`GET /api/plans` 必须传 `view=year|month|day` 和 `date=YYYY|YYYY-MM|YYYY-MM-DD`。**年视图返回每月统计摘要 `{ month, total, done }[]`，而非计划记录列表。**

错误码：`PLAN_NOT_FOUND`、`TAG_NOT_FOUND`、`TAG_ALREADY_EXISTS`、`TAG_PRESET_READONLY`、`INVALID_PARAM`、`INTERNAL_ERROR`。

## 数据库关键注意点

- `tags` 列存储 JSON 字符串数组，序列化/反序列化**仅在 `SqlitePlanRepository` 中处理**，Service 层不涉及。
- `done` 列为 `INTEGER 0/1`，与 boolean 的互转在 `SqlitePlanRepository.rowToPlan()` 中完成。
- `updated_at` 无 SQLite 触发器，每条 `UPDATE` 语句需手动加 `SET updated_at = datetime('now','localtime')`。

## 前端代码规范

- **禁止 `any`** — 改用 `unknown` + 类型收窄。
- **禁止内联样式**（`style={{}}`）— 所有样式写入 `index.module.less` CSS Modules。例外：移动端 Modal 全屏等动态值。
- **禁止提交 `console.log`**。
- **只用绝对路径** — 使用 `@/` 别名（如 `import type { Plan } from '@/types/plan'`），禁止超过一级的 `../../`。
- 组件结构：`ComponentName/index.tsx` + `ComponentName/index.module.less`。
- 状态管理：局部用 `useState` + `useEffect`；跨组件共享用 `React.Context` 或 URL 参数，不引入 Redux/Zustand。
- API 调用：全部封装在 `src/services/`，页面/组件不直接调用 fetch，使用 Umi 内置 `request`。

## 前端架构（待实现）

```
client/src/
├── types/          # Plan、Tag、ViewMode、API 响应类型
├── services/       # getPlans、createPlan、updatePlan、deletePlan、getTags、createTag、deleteTag
├── styles/         # variables.less — 响应式断点（@breakpoint-mobile: 768px）
├── layouts/        # 主布局包装组件
├── components/     # PlanForm（Modal）、PlanCard、FabButton
└── pages/plans/    # year.tsx、month.tsx、day.tsx
```

路由：`/plans/year/:year`、`/plans/month/:month`、`/plans/day/:date`，所有 `/api/*` 代理到 `http://localhost:3001`。

移动端断点 768px：月视图在移动端从"左侧日历+右侧列表"切换为"顶部日期过滤器+按日分组列表"。

## Hookify 规则

`.claude/` 目录下的代码守护规则，在文件写入时自动触发：

- `hookify.no-any-type` — `.ts/.tsx` 中出现 `: any` 时警告
- `hookify.no-inline-style` — `.tsx` 中出现 `style={{` 时警告
- `hookify.no-console-log` — `.ts/.tsx` 中出现 `console.log(` 时警告
- `hookify.domain-layer-purity` — `domain/` 目录文件 import `infrastructure/` 时警告
- `hookify.sensitive-files` — 编辑 `.env` 或含 credentials/secrets 的文件时警告
