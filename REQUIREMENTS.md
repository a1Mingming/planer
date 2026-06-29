# 计划管理 Web 应用 — 需求文档

> 版本：v1.0 | 日期：2026-06-29

---

## 一、项目概述

个人日程计划管理工具，支持按年/月/日三级视图浏览、创建和管理计划，移动端优先设计。

**技术栈**
- 前端：Umi 4 + React 18 + TypeScript + Ant Design 5
- 后端：Node.js + Express + better-sqlite3
- 包管理：pnpm

---

## 二、功能需求

### 2.1 计划字段

| 字段 | 类型 | 是否必填 | 说明 |
|------|------|----------|------|
| 标题 | string | 必填 | 最多 100 字符 |
| 日期 | string | 必填 | YYYY-MM-DD，允许选过去日期（补录） |
| 开始时间 | string | 可选 | HH:MM |
| 结束时间 | string | 可选 | HH:MM，必须晚于开始时间，不支持跨天 |
| 标签 | string[] | 可选 | 从预置 + 自定义标签中选择 |
| 完成状态 | boolean | — | 默认未完成，两态切换 |

### 2.2 三级视图

| 视图 | 功能 | 桌面端布局 | 移动端布局 |
|------|------|-----------|-----------|
| 年视图 | 统计概览，每月完成数/总数 | 3×4 月卡片网格 | 2×6 月卡片网格 |
| 月视图 | 日历 + 当日计划列表 | 左侧日历 + 右侧列表 | 顶部日期过滤器 + 下方列表（按日分组） |
| 日视图 | 某天全部计划 | 时间轴（有时间段）+ 底部全天区域 | 同桌面端，卡片全宽 |

### 2.3 新建入口

- 右下角 FAB 悬浮按钮 → 弹出创建表单
- 月视图点击日历日期 → 弹出创建表单（日期预填）

### 2.4 标签系统

- 预置标签：工作、学习、健身、生活、其他
- 用户可自定义添加标签（最多 20 字符，不允许重复）
- 自定义标签可删除，预置标签不可删除
- 计划卡片最多显示 3 个标签，多余显示 "+N"

---

## 三、交互规范

### 3.1 日期导航

- 月视图：顶部左右箭头切换月份，跨年时年份同步更新（1月→上年12月，12月→下年1月）
- 年视图：顶部左右箭头切换年份
- 日视图：顶部左右箭头切换前/后一天

### 3.2 视图联动

- 年视图点击月卡片 → 跳转到对应月视图
- 月视图双击/长按日期 → 新建计划（日期预填）
- 日视图顶部返回 → 回到所属月视图

### 3.3 完成态视觉

- 已完成：标题加删除线 + 整体透明度 50% + 排在列表底部

### 3.4 删除确认

- 所有删除使用 `Popconfirm` 二次确认
- 文案：「确定删除该计划吗？此操作无法撤销」

### 3.5 时间轴（日视图）

- 以 1 小时为单位
- 仅当日显示"当前时间"红色指示线
- 无时间段的计划放在底部"全天"分区

---

## 四、状态与错误处理

### 4.1 加载状态

- 各视图初始加载及切换月/年时展示 `Skeleton` 骨架屏
- 骨架形状与最终渲染保持比例一致

### 4.2 空状态

- 每个视图无数据时展示：空状态插图 + 引导文案 + "新建计划"按钮

### 4.3 错误处理

| 场景 | 处理方式 |
|------|----------|
| 列表加载失败 | `Result` 组件（含"重试"按钮） |
| 创建/编辑失败 | `message.error` 提示，表单保留用户输入 |
| 删除失败 | `message.error` 提示 |
| 网络断开 | 全局 `message.error` 提示 |

---

## 五、移动端适配

- 断点：768px（桌面/移动分界）
- 月视图移动端：改为顶部日期过滤器 + 按日分组的计划列表
- 表单 Modal 移动端全屏展示（`style: { top: 0, maxWidth: '100vw' }`）
- 触摸点击区域 ≥ 44px
- FAB 按钮使用 `env(safe-area-inset-bottom)` 避开 iOS 底部手势区
- 表单 Modal 底部提交按钮 sticky 固定，防止虚拟键盘遮挡

---

## 六、API 接口

Base URL: `http://localhost:3001/api`

统一响应格式：
```json
{ "success": true, "data": {} }
{ "success": false, "error": { "code": "PLAN_NOT_FOUND", "message": "计划不存在" } }
```

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /plans | 查询计划列表（`view`, `date` 参数） |
| POST | /plans | 创建计划 |
| PUT | /plans/:id | 更新计划 |
| DELETE | /plans/:id | 删除计划 |
| GET | /tags | 获取所有标签 |
| POST | /tags | 添加自定义标签 |
| DELETE | /tags/:id | 删除自定义标签（预置不可删） |

---

## 七、数据库设计

```sql
CREATE TABLE plans (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL,
  date       TEXT    NOT NULL,
  start_time TEXT,
  end_time   TEXT,
  tags       TEXT,                              -- JSON 字符串数组
  done       INTEGER NOT NULL DEFAULT 0,        -- 0=未完成 1=已完成
  created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE tags (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT    NOT NULL UNIQUE,
  is_preset INTEGER NOT NULL DEFAULT 0          -- 1=预置 0=自定义
);
```
