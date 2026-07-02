# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

个人日程计划管理应用，支持按年/月/日三级视图浏览和管理计划，移动端优先设计。

- **前端** (`client/`)：Umi 4 + React 18 + TypeScript + Ant Design **6** — 端口 8000
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

### 前端（`client/`）

```bash
pnpm dev         # Umi 开发服务器，端口 8000
pnpm build       # 生产构建
pnpm lint        # @umijs/lint
```

### Playwright E2E 测试（`client/`）

**⚠️ 必须在 `client/` 目录下执行**，否则 Playwright 找不到配置文件。

```bash
pnpm test:e2e                        # 运行全部 E2E 测试
pnpm test:e2e -- <spec>              # 运行指定测试文件
pnpm test:e2e -- <spec>:<行号>        # 运行指定测试用例
pnpm test:e2e:ui                      # Playwright UI 模式调试
pnpm test:e2e:report                  # 查看上次测试报告
```

示例：
```bash
cd client
pnpm test:e2e -- hover-clipping.spec.ts
pnpm test:e2e -- hover-clipping.spec.ts:107  # 只跑第 107 行的用例
```

**测试输出**：失败截图/视频存放在 `client/e2e/test-output/`（已 gitignore）。

**前提**：测试依赖前端 dev server 在 `localhost:8000` 运行（`pnpm dev`），API 调用通过 `page.route()` mock，不需要后端运行。

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

## 业务文档

`docs/` 目录维护面向开发者的业务文档，完整内容以此为准：

- [`docs/api.md`](docs/api.md) — 所有 API 接口、请求/响应格式、错误码
- [`docs/data-model.md`](docs/data-model.md) — Plan / Tag 数据结构、可编辑性判断逻辑
- [`docs/recurrence.md`](docs/recurrence.md) — 循环计划创建、编辑、删除的完整逻辑

**每次修改涉及 API 接口、数据模型或核心业务逻辑时，必须同步更新对应文档文件。**

## API 约定

所有响应格式：`{ success: true, data: T }` 或 `{ success: false, error: { code, message } }`。完整接口和错误码见 [`docs/api.md`](docs/api.md)。

## 数据库关键注意点

- `tags` 列存储 JSON 字符串数组，序列化/反序列化**仅在 `SqlitePlanRepository` 中处理**，Service 层不涉及。
- `done` 列为 `INTEGER 0/1`，与 boolean 的互转在 `SqlitePlanRepository.rowToPlan()` 中完成。
- `updated_at` 无 SQLite 触发器，每条 `UPDATE` 语句需手动加 `SET updated_at = datetime('now','localtime')`。

## 前端代码规范

- **禁止 `any`** — 改用 `unknown` + 类型收窄。
- **禁止内联样式**（`style={{}}`）— 所有样式写入 `index.module.less` CSS Modules。例外：移动端 Modal 全屏等动态值、SVG 动画属性。
- **禁止提交 `console.log`**。
- **只用绝对路径** — 使用 `@/` 别名（如 `import type { Plan } from '@/types/plan'`），禁止超过一级的 `../../`。
- 组件结构：`ComponentName/index.tsx` + `ComponentName/index.module.less`。
- 状态管理：局部用 `useState` + `useEffect`；跨组件共享用 `React.Context` 或 URL 参数，不引入 Redux/Zustand。
- API 调用：全部封装在 `src/services/`，页面/组件不直接调用 fetch，使用 Umi 内置 `request`。

## Ant Design 主题配置

**Ant Design 统一主题 token 通过 `ConfigProvider` 在 `layouts/index.tsx` 中注入**，所有子组件自动继承，不在各组件 `.less` 中单独覆盖颜色等基础 token。

注意：本项目使用纯 `umi`，**不能**在 `.umirc.ts` 中使用 `antd` 配置 key（需要 `@umijs/plugin-antd` 才支持）。

**Ant Design 6 注意**：AntD6 内部类名有变化，如 `.ant-modal-content` → `.ant-modal-container`，覆盖样式时需检查实际 DOM 类名。

仅需在组件 `.less` 中覆盖结构性样式（如 Modal padding、header 背景色等）时，才使用 `:global(.ant-modal-container)` 等方式局部覆写。

## 前端架构（已实现）

```
client/src/
├── types/          # Plan、Tag、ViewMode、API 响应类型；isPlanEditable 可编辑性判断
├── services/       # API 调用封装（plan、tag）
├── styles/         # variables.less — 设计系统变量（颜色、字体、断点）
├── layouts/        # 主布局（顶部导航，原生 button 替代 Ant Button）
├── components/     # PlanForm（Modal）、PlanCard、FabButton
└── pages/plans/    # year.tsx、month.tsx、day.tsx
```

路由：`/plans/year/:year`、`/plans/month/:month`、`/plans/day/:date`，所有 `/api/*` 代理到 `http://localhost:3001`。

移动端断点 768px：月视图在移动端从"左侧日历+右侧列表"切换为"顶部日期过滤器+按日分组列表"。

年视图使用内联 SVG 环形进度（`RingProgress` 组件）替代 Ant Design Progress，避免引入额外 JS bundle。FabButton、导航箭头均使用原生 `<button>` + CSS Modules，减少对 Ant Design 的依赖。Ant Design 保留用于：Form、Modal、DatePicker、TimePicker、Select、Calendar、Skeleton、Result、Empty、Popconfirm、message。

## Git 安全规则

- **禁止自动执行** `filter-branch`、`rebase -i`、`reset --hard`，操作前必须**显式请求用户确认**
- 执行前 `git stash list` 确认无遗留 stash，`git status` 确认工作区干净
- 执行前 `git branch backup` 创建备份分支，失败可回退
- 频繁 commit（每个功能点一次），WIP 比 stash 更安全

## Hookify 规则

`.claude/` 目录下的代码守护规则，在文件写入时自动触发：

- `hookify.no-any-type` — `.ts/.tsx` 中出现 `: any` 时警告
- `hookify.no-inline-style` — `.tsx` 中出现 `style={{` 时警告
- `hookify.no-console-log` — `.ts/.tsx` 中出现 `console.log(` 时警告
- `hookify.domain-layer-purity` — `domain/` 目录文件 import `infrastructure/` 时警告
- `hookify.sensitive-files` — 编辑 `.env` 或含 credentials/secrets 的文件时警告
