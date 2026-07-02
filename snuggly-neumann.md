# 计划管理 Web 应用 — 实现计划

## Context

个人日程管理工具，支持按年/月/日三级视图浏览和管理计划，移动端优先。
技术栈：Umi 4 + React 18 + TypeScript + Ant Design 6（前端）+ Express + better-sqlite3（后端）。
目录 `C:\Users\GhostCloud\Desktop\test` 当前为空，从零搭建。

---

## 需求明确

### 计划字段
- 标题（必填）
- 日期（必填，YYYY-MM-DD）
- 时间段（可选，start_time / end_time，HH:MM）
- 标签（可选，预设 + 可自定义）
- 状态：未完成 / 已完成（两态）

### 三级视图
| 视图 | 作用 | 布局 |
|------|------|------|
| 年视图 | 统计概览，展示每月完成数 / 总数 | 12 个月卡片，不做编辑交互 |
| 月视图 | 日历 + 当日计划列表 | 左侧日历（点击选日期），右侧当日计划列表 |
| 日视图 | 某天的全部计划 | 有时间段的排时间轴，无时间的列在底部 |

### 新建入口
- 点击日历中的日期 → 弹出创建表单（日期预填）
- 右下角悬浮按钮（FAB）→ 弹出创建表单

### 标签
- 有预置标签（工作、学习、健身、生活等）
- 用户可自定义添加

---

## 项目结构

```
test/
├── client/          # Umi 4 前端（端口 8000）
├── server/          # Express + better-sqlite3（端口 3001）
└── README.md
```

---

## 数据库设计（SQLite）

```sql
-- 计划表
CREATE TABLE plans (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL,
  date       TEXT    NOT NULL,         -- 'YYYY-MM-DD'
  start_time TEXT,                     -- 'HH:MM' 可为空
  end_time   TEXT,                     -- 'HH:MM' 可为空
  tags       TEXT,                     -- JSON 字符串数组
  done       INTEGER NOT NULL DEFAULT 0, -- 0=未完成 1=已完成
  created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE INDEX idx_plans_date ON plans(date);
CREATE INDEX idx_plans_date_done ON plans(date, done);

-- 标签表（预置 + 用户自定义）
CREATE TABLE tags (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL UNIQUE,
  is_preset  INTEGER NOT NULL DEFAULT 0  -- 1=预置 0=用户自定义
);
-- 预置标签种子数据：工作、学习、健身、生活、其他
```

---

## REST API

Base: `/api`，响应格式：`{ success: boolean, data?: T, error?: { code, message } }`

| 方法 | 路径 | 说明 | 关键参数 |
|------|------|------|----------|
| GET | /api/plans | 列表查询 | `view=year/month/day&date=YYYY/YYYY-MM/YYYY-MM-DD` |
| POST | /api/plans | 创建计划 | body: title, date, start_time?, end_time?, tags?, done |
| PUT | /api/plans/:id | 更新计划 | body: 同上（均可选） |
| DELETE | /api/plans/:id | 删除计划 | — |
| GET | /api/tags | 获取所有标签（含自定义） | — |
| POST | /api/tags | 添加自定义标签 | body: name |
| DELETE | /api/tags/:id | 删除自定义标签（预置不可删） | — |

SQL 查询策略：
- year → `WHERE date LIKE 'YYYY-%'`
- month → `WHERE date LIKE 'YYYY-MM-%'`
- day → `WHERE date = 'YYYY-MM-DD'`

年视图响应额外返回每月统计：`{ month: string, total: number, done: number }[]`

---

## 前端路由（.umirc.ts）

```
/                    → redirect /plans/month
/plans/year/:year    → 年视图（year = 2025）
/plans/month/:month  → 月视图（month = 2025-06）
/plans/day/:date     → 日视图（date = 2025-06-15）
```

Umi proxy: `'/api' → http://localhost:3001`

### 月视图响应式规则
- 桌面端（≥768px）：左侧日历 + 右侧当日计划列表
- 移动端（<768px）：顶部日期过滤器（Ant Design DatePicker 月份选择）+ 下方计划列表（按日期分组）

### 日期导航
- 月视图顶部：左右箭头切换上一月/下一月，中间显示"YYYY年MM月"
- 年视图顶部：左右箭头切换年份
- 日视图顶部：左右箭头切换前一天/后一天

### 删除确认
- 所有删除操作使用 Ant Design `Popconfirm` 二次确认，防止误删

## TypeScript 核心类型（client/src/types/plan.ts）

```typescript
export type ViewMode = 'year' | 'month' | 'day';

export interface Plan {
  id:         number;
  title:      string;
  date:       string;         // 'YYYY-MM-DD'
  start_time: string | null;  // 'HH:MM'
  end_time:   string | null;  // 'HH:MM'
  tags:       string[];
  done:       boolean;
  created_at: string;
  updated_at: string;
}

export type CreatePlanPayload = Omit<Plan, 'id'|'created_at'|'updated_at'>;
export type UpdatePlanPayload = Partial<CreatePlanPayload>;
```

---

## 关键文件清单

### 后端（server/）
- `src/db/connection.ts` — better-sqlite3 单例，启用 WAL 模式
- `src/db/migrate.ts` — 建表 + 索引，启动时自动执行
- `src/db/seed.ts` — 预置标签（工作/学习/健身/生活/其他）
- `src/services/planService.ts` — SQL 操作 + tags JSON 序列化
- `src/services/tagService.ts` — 标签 CRUD
- `src/controllers/planController.ts` — 请求/响应
- `src/routes/plans.ts` — 计划路由
- `src/routes/tags.ts` — 标签路由
- `src/middlewares/errorHandler.ts` — 统一错误处理
- `src/app.ts` — Express 配置（cors、json、路由）
- `src/index.ts` — 入口（3001 端口）

### 前端（client/）
- `.umirc.ts` — 路由 + proxy + 主题
- `src/types/plan.ts` — 核心类型
- `src/services/plan.ts` — API 封装（基于 umi-request）
- `src/services/tag.ts` — 标签 API
- `src/pages/plans/year.tsx` — 年视图（12 月卡片网格）
- `src/pages/plans/month.tsx` — 月视图（左日历 + 右列表）
- `src/pages/plans/day.tsx` — 日视图（时间轴 + 底部无时间计划）
- `src/components/PlanForm/index.tsx` — 新建/编辑 Modal 表单
- `src/components/PlanCard/index.tsx` — 单条计划卡片（含完成勾选）
- `src/components/FabButton/index.tsx` — 右下角悬浮新建按钮
- `src/layouts/index.tsx` — 主布局（顶部导航 + 内容区）；配置 Ant Design `ConfigProvider`（主题 + `zhCN` locale）及 dayjs 中文化（`weekday`、`localeData` 插件 + `dayjs.locale('zh-cn')`）

---

## 移动端适配要点
- 月视图：移动端（<768px）切换为顶部日期选择器（月份） + 下方计划列表（按日期分组展示）
- 日视图：时间轴简化，计划卡片全宽
- 表单 Modal：移动端全屏展示（style: { top: 0, padding: 0, maxWidth: '100vw' }）
- 点击/触摸区域 ≥ 44px
- FAB 按钮固定右下角，bottom 保留安全区域（避开 iOS 底部手势区，使用 `env(safe-area-inset-bottom)`）

---

## 关键实现注意点

- **updated_at 更新**：SQLite 无自动触发器，UPDATE 语句中需手动 `SET updated_at = datetime('now','localtime')`
- **状态管理**：前端使用局部 `useState + useEffect`，无需 Umi Model（数据量小，各视图独立请求）
- **tags 序列化**：后端存入前 `JSON.stringify(tags)`，读取后 `JSON.parse(tags ?? '[]')`，封装在 `planService` 内
- **done 转换**：SQLite 存 0/1 整数，planService 读取时转为 boolean，写入时转回 0/1

### 空状态
- 每个视图无数据时显示：空插图 + 引导文案 + "新建计划"按钮

### 加载状态
- 各视图初始加载及切换月/年时展示 `Ant Design Skeleton` 骨架屏

### 错误处理
- 列表加载失败：展示 `Result` 组件（含"重试"按钮）
- 创建/编辑/删除失败：`message.error` 提示，表单保留用户输入

### 表单验证
- 标题：必填，最多 100 字符
- 时间段：end_time 必须晚于 start_time（提交时校验），不支持跨天
- 过去日期可以选择（允许补录）
- 自定义标签：最多 20 字符，不允许重复
- 表单使用 `validateTrigger="onBlur"` + 提交时全量校验

### 完成态视觉
- 已完成的计划：标题加删除线 + 整体透明度 50%，排在列表底部

### 视图联动
- 年视图点击月卡片 → 跳转到对应月视图
- 月视图点击日期 → 更新右侧列表（桌面）或滚动到对应日期组（移动）；双击/长按 → 新建计划
- 日视图标题点击 → 返回月视图（保持日期）

### 月/年切换边界
- 1月点"上一月" → 跳到上一年12月（年份同步更新）
- 12月点"下一月" → 跳到下一年1月

### 时间轴细节（日视图）
- 时间轴以 1 小时为单位
- 显示"当前时间"红色指示线（仅当日显示）
- 无时间段的计划放在底部"全天"区域

### 移动端键盘
- 表单 Modal 底部提交按钮需在 sticky 固定，防止被虚拟键盘遮挡

### 标签展示
- 计划卡片最多显示 3 个标签，多余的显示 "+N"

---

## 实现步骤

1. **初始化后端**：在 `server/` 下 `npm init -y` → 安装 `express better-sqlite3 cors`，安装 `typescript ts-node @types/express @types/node` 为开发依赖 → 配置 tsconfig + package.json scripts（`dev: ts-node src/index.ts`）
2. **初始化前端**：`pnpm dlx create-umi@latest client`（选 Simple App 模板）→ 安装 `antd dayjs` → 配置 `.umirc.ts`（路由 + proxy）
3. **后端实现**：migrate（建表+索引）→ seed（预置标签）→ planService → tagService → controllers → routes → errorHandler → 测试接口
4. **前端实现**：类型定义 → services（API 封装）→ 布局 → YearView → MonthView → DayView → PlanForm（Modal）→ PlanCard → FabButton
5. **联调测试**：启动前后端，验证三个视图数据流、新建/编辑/删除/完成勾选
6. **移动端测试**：Chrome DevTools 模拟手机，检查月视图列表模式、表单全屏、FAB 位置

---

## 验证方式

1. `cd server && npm run dev`（3001 端口）
2. `cd client && npm run dev`（8000 端口）
3. 浏览器访问 `http://localhost:8000` 验证：
   - 年视图 12 个月卡片显示统计
   - 月视图左右布局，点击日期刷新右侧列表
   - 日视图时间轴 + 底部无时间计划
   - 新建计划（FAB + 点日期两个入口）
   - 勾选完成状态
   - 手机模拟布局正常
4. `curl http://localhost:3001/api/plans?view=month&date=2025-06` 验证后端
