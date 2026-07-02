# 循环计划功能

## 创建循环计划

创建时设置 `recurrence_type != 'none'`，后端自动：

1. 生成 `recurrence_group_id`（UUID）
2. 计算所有日期实例（最多 365 天，默认 90 天）
3. 批量插入，所有实例共享同一 `recurrence_group_id`
4. 返回第一条

### 日期生成规则

| 类型 | 规则 |
|------|------|
| `daily` | 起始日到结束日每天一条 |
| `weekly` | `recurrence_days` 指定星期几（空数组=每天），从起始日到结束日 |
| `monthly` | 每月同一天，从起始日到结束日 |

---

## 编辑循环计划

前端弹出 scope 选择弹窗：

| 选项 | 行为 |
|------|------|
| 仅修改此条 | 走普通 `PUT /api/plans/:id`，循环规则字段在此模式下禁用 |
| 此条及之后 | 走批量路径，`scope=future` |
| 修改全部 | 走批量路径，`scope=all` |

### 两种批量路径

**不修改循环规则**（仅改 title / 时间 / 标签 / 优先级）→ `PUT /:id/recurrence`  
- 批量 UPDATE，仅影响 `done=false` 的条目

**修改循环规则**（recurrence_type / recurrence_days / recurrence_end_date 有变化）→ `PATCH /:id/recurrence/rebuild`  
- 删除受影响范围内 `done=false AND date > today` 的旧条目
- 用新规则重新生成并插入
- 已完成（`done=true`）的条目保留不变

### 影响条数预览

scope 弹窗切换到 `future` 或 `all` 时，前端调用 `GET /:id/recurrence/count?scope=X`，显示"将影响 N 条未来未完成的计划"。

---

## 删除循环计划

scope 选择与编辑相同（仅此条 / 此条及之后 / 全部）。

**限制**：`future` / `all` 只删 `done=false AND date > today` 的条目。  
**可编辑性限制**：已到来的计划（`isPlanEditable` 返回 false），删除 scope 只能选"仅此条"，`future` / `all` 选项禁用。

---

## 可编辑性限制

详见 [data-model.md](./data-model.md#可编辑性判断isplaneditable)。

编辑和批量删除的入口均受 `isPlanEditable` 保护：
- PlanCard 编辑按钮：`disabled={!isPlanEditable(plan)}`，并有视觉灰化
- `openEdit`（day.tsx / month.tsx）：`if (!isPlanEditable(plan)) return`
- 删除 scope modal：`future` / `all` 的 Radio `disabled={!isPlanEditable(target)}`
