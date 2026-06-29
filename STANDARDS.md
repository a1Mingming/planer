# 代码规范文档

> 版本：v1.0 | 日期：2026-06-29

---

## 一、通用规范

- 包管理器：**pnpm**（前后端统一）
- 语言：TypeScript，前后端均开启严格模式

---

## 二、前端规范（client/）

### 2.1 代码质量

- **ESLint**：使用 Umi 内置 ESLint 配置（基于 `@umijs/lint`）
- **Prettier**：通过 ESLint 集成，不单独配置
- 提交前通过 lint 检查（`pnpm lint`）

### 2.2 样式规范

- 使用 **CSS Modules**（文件名：`index.module.less`）
- 样式统一写入 `.less` 文件，禁止在 TSX 中使用 `style={{}}` 内联样式（除移动端动态样式如 Modal 全屏）
- 使用 Ant Design 5 的 Design Token 做主题定制，不直接覆盖组件样式类名
- 响应式断点变量统一定义在 `src/styles/variables.less`：
  ```less
  @breakpoint-mobile: 768px;
  @breakpoint-tablet: 1024px;
  ```

### 2.3 组件文件结构

每个组件或页面统一如下结构：

```
ComponentName/
├── index.tsx          # 组件主文件
├── index.module.less  # 组件样式
└── types.ts           # 组件内部类型（如 Props 接口，可选）
```

- 组件名使用 **PascalCase**
- 文件名和目录名使用 **PascalCase**（页面文件除外，页面用小写）

### 2.4 路径引用

- 统一使用 `@/` 绝对路径，禁止使用 `../../` 相对路径（超过一级）
- 示例：`import type { Plan } from '@/types/plan'`
- Umi 已默认配置 `@/` 指向 `src/`，无需额外配置

### 2.5 TypeScript 规范

```json
// tsconfig.json 关键配置
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "paths": { "@/*": ["src/*"] }
  }
}
```

- 禁止使用 `any`，确实需要用 `unknown` + 类型收窄
- Props 接口命名：`[ComponentName]Props`，定义在组件文件顶部
- 优先使用 `interface` 定义对象类型，`type` 用于联合类型和工具类型

### 2.6 状态管理

- 局部状态：`useState` + `useEffect`
- 跨组件共享（如当前选中日期）：通过 `React.Context` 或 URL 参数传递
- 不引入 Redux / Zustand 等额外状态库

### 2.7 API 请求

- 统一使用 Umi 内置的 `request`（基于 `umi-request`）
- 所有请求封装在 `src/services/` 目录，页面/组件不直接调用 fetch
- 请求函数命名：`[动词][资源名]`，如 `getPlans`、`createPlan`、`updatePlan`、`deletePlan`

---

## 三、后端规范（server/）

### 3.1 TypeScript 配置

```json
// tsconfig.json 关键配置
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

### 3.2 DDD 标准四层架构

```
server/src/
├── domain/                    # 领域层：实体、仓库接口、领域规则
│   ├── plan/
│   │   ├── Plan.ts            # Plan 实体类
│   │   ├── IPlanRepository.ts # 仓库接口
│   │   └── PlanErrors.ts      # 领域错误定义
│   └── tag/
│       ├── Tag.ts
│       ├── ITagRepository.ts
│       └── TagErrors.ts
│
├── application/               # 应用层：用例 Service，编排领域逻辑
│   ├── PlanService.ts         # 计划相关用例
│   └── TagService.ts          # 标签相关用例
│
├── infrastructure/            # 基础设施层：DB 实现、外部服务
│   ├── db/
│   │   ├── connection.ts      # better-sqlite3 单例（WAL 模式）
│   │   ├── migrate.ts         # 建表 + 索引（启动时执行）
│   │   └── seed.ts            # 预置标签
│   ├── repositories/
│   │   ├── SqlitePlanRepository.ts  # IPlanRepository 的 SQLite 实现
│   │   └── SqliteTagRepository.ts   # ITagRepository 的 SQLite 实现
│
└── interface/                 # 接口层：路由、控制器、请求/响应 DTO
    ├── controllers/
    │   ├── PlanController.ts
    │   └── TagController.ts
    ├── routes/
    │   ├── plans.ts
    │   └── tags.ts
    ├── middlewares/
    │   ├── errorHandler.ts    # 统一错误处理中间件
    │   └── validate.ts        # zod 校验中间件
    ├── app.ts                 # Express 配置
    └── index.ts               # 启动入口
```

**各层依赖方向：** `interface → application → domain`，`infrastructure` 实现 `domain` 的接口。

### 3.3 统一错误码

```typescript
// domain/errors.ts
export const ErrorCodes = {
  // 通用
  INVALID_PARAM:       'INVALID_PARAM',
  INTERNAL_ERROR:      'INTERNAL_ERROR',
  // 计划
  PLAN_NOT_FOUND:      'PLAN_NOT_FOUND',
  // 标签
  TAG_NOT_FOUND:       'TAG_NOT_FOUND',
  TAG_ALREADY_EXISTS:  'TAG_ALREADY_EXISTS',
  TAG_PRESET_READONLY: 'TAG_PRESET_READONLY',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
```

### 3.4 请求参数校验（zod）

- 所有 POST/PUT 请求 body 用 zod schema 校验
- 校验失败统一返回 `400 { success: false, error: { code: 'INVALID_PARAM', message: '...' } }`
- Schema 定义在 `interface/validators/` 目录

```typescript
// 示例：interface/validators/plan.ts
import { z } from 'zod';

export const CreatePlanSchema = z.object({
  title:      z.string().min(1).max(100),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end_time:   z.string().regex(/^\d{2}:\d{2}$/).optional(),
  tags:       z.array(z.string()).optional(),
  done:       z.boolean().optional().default(false),
});
```

### 3.5 日志输出（morgan）

- 使用 `morgan` 记录 HTTP 请求日志
- 开发环境使用 `dev` 格式（彩色简洁输出）
- 生产环境使用 `combined` 格式（完整日志）

```typescript
// app.ts
import morgan from 'morgan';
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
```

### 3.6 统一响应格式

```typescript
// interface/response.ts
export const ok = <T>(data: T) => ({ success: true, data });
export const fail = (code: string, message: string) => ({
  success: false,
  error: { code, message },
});
```

### 3.7 数据库规范

- `better-sqlite3` 单例模式，启用 WAL 模式（`db.pragma('journal_mode = WAL')`）
- `tags` 字段：存储前 `JSON.stringify`，读取后 `JSON.parse`，封装在 Repository 层
- `done` 字段：SQLite 存 0/1，Repository 层负责与 boolean 互转
- `updated_at`：UPDATE 语句中手动 `SET updated_at = datetime('now','localtime')`

### 3.8 package.json scripts

```json
{
  "scripts": {
    "dev":   "tsx watch src/interface/index.ts",
    "build": "tsc",
    "start": "node dist/interface/index.js",
    "lint":  "tsc --noEmit"
  }
}
```

---

## 四、Git 规范

- commit message 格式：`type(scope): description`
  - type: `feat` / `fix` / `refactor` / `style` / `docs` / `chore`
  - 示例：`feat(plan): add year view statistics`
- 分支命名：`feature/xxx`、`fix/xxx`

---

## 五、目录结构总览

```
test/
├── client/                    # 前端（Umi 4，端口 8000）
│   ├── .umirc.ts
│   ├── package.json
│   └── src/
│       ├── types/             # TypeScript 类型定义
│       ├── services/          # API 请求封装
│       ├── styles/            # 全局样式变量
│       ├── components/        # 通用组件（PlanForm, PlanCard, FabButton）
│       ├── layouts/           # 主布局
│       └── pages/
│           └── plans/         # 年/月/日视图页面
│
├── server/                    # 后端（Express + SQLite，端口 3001）
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── domain/            # 领域层
│       ├── application/       # 应用层
│       ├── infrastructure/    # 基础设施层
│       └── interface/         # 接口层
│
├── REQUIREMENTS.md            # 需求文档
└── STANDARDS.md               # 代码规范文档（本文件）
```
