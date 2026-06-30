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
- **禁止内联样式**（`style={{}}`）— 所有样式写入 `index.module.less` CSS Modules。例外：移动端 Modal 全屏等动态值、SVG 动画属性。
- **禁止提交 `console.log`**。
- **只用绝对路径** — 使用 `@/` 别名（如 `import type { Plan } from '@/types/plan'`），禁止超过一级的 `../../`。
- 组件结构：`ComponentName/index.tsx` + `ComponentName/index.module.less`。
- 状态管理：局部用 `useState` + `useEffect`；跨组件共享用 `React.Context` 或 URL 参数，不引入 Redux/Zustand。
- API 调用：全部封装在 `src/services/`，页面/组件不直接调用 fetch，使用 Umi 内置 `request`。

## Ant Design 主题配置

**Ant Design 5 统一主题 token 通过 `ConfigProvider` 在 `layouts/index.tsx` 中注入**，所有子组件自动继承，不在各组件 `.less` 中单独覆盖颜色等基础 token。

```tsx
// layouts/index.tsx
import { ConfigProvider } from 'antd';

const antdTheme = {
  token: {
    colorPrimary: '#C84B31',
    colorBgContainer: '#FDFAF7',
    colorBorder: '#C4BFBA',
    colorText: '#1C1917',
    borderRadius: 4,
    fontFamily: "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
};

// <ConfigProvider theme={antdTheme}> 包裹整个布局
```

注意：本项目使用纯 `umi`，**不能**在 `.umirc.ts` 中使用 `antd` 配置 key（需要 `@umijs/plugin-antd` 才支持）。

仅需在组件 `.less` 中覆盖结构性样式（如 Modal padding、header 背景色等）时，才使用 `:global(.ant-modal-content)` 等方式局部覆写。

## 前端架构（已实现）

```
client/src/
├── types/          # Plan、Tag、ViewMode、API 响应类型
├── services/       # getPlans、createPlan、updatePlan、deletePlan、getTags、createTag、deleteTag
├── styles/         # variables.less — 设计系统变量（颜色、字体、断点）
├── layouts/        # 主布局（顶部导航，原生 button 替代 Ant Button）
├── components/     # PlanForm（Modal）、PlanCard（原生 checkbox + 自定义标签）、FabButton（原生 button）
└── pages/plans/    # year.tsx、month.tsx、day.tsx
```

路由：`/plans/year/:year`、`/plans/month/:month`、`/plans/day/:date`，所有 `/api/*` 代理到 `http://localhost:3001`。

移动端断点 768px：月视图在移动端从"左侧日历+右侧列表"切换为"顶部日期过滤器+按日分组列表"。

年视图使用内联 SVG 环形进度（`RingProgress` 组件）替代 Ant Design Progress，避免引入额外 JS bundle。FabButton、导航箭头均使用原生 `<button>` + CSS Modules，减少对 Ant Design 的依赖。Ant Design 保留用于：Form、Modal、DatePicker、TimePicker、Select、Calendar、Skeleton、Result、Empty、Popconfirm、message。

## 已知问题与解决方案

### 浏览器控制台警告排查

遇到控制台警告时，使用 Playwright 监听 `console` 事件批量捕获，无需手动逐页检查：

```ts
page.on('console', (msg) => {
  console.log(`[${msg.type()}] ${msg.text()}`);
});
```

在临时 E2E 测试文件中访问各页面、触发交互后打印收集到的消息，定位警告来源后再修复。

### Ant Design 废弃 API

升级 Ant Design 大版本后可能出现 `[antd: XxxComponent] xxx is deprecated` 警告，查阅对应版本迁移文档替换废弃 prop。可通过上述 Playwright 控制台捕获方法快速定位。

### Umi 配置项无效

`.umirc.ts` 中只能使用已安装插件支持的 config key。本项目未安装 `@umijs/plugin-antd`，**不能**使用 `antd` key。Ant Design 主题通过 `ConfigProvider` 注入（见"Ant Design 主题配置"章节）。

## Hookify 规则

`.claude/` 目录下的代码守护规则，在文件写入时自动触发：

- `hookify.no-any-type` — `.ts/.tsx` 中出现 `: any` 时警告
- `hookify.no-inline-style` — `.tsx` 中出现 `style={{` 时警告
- `hookify.no-console-log` — `.ts/.tsx` 中出现 `console.log(` 时警告
- `hookify.domain-layer-purity` — `domain/` 目录文件 import `infrastructure/` 时警告
- `hookify.sensitive-files` — 编辑 `.env` 或含 credentials/secrets 的文件时警告
