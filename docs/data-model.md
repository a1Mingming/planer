# 数据模型

## Plan

```ts
interface Plan {
  id:                   number;
  title:                string;
  date:                 string;          // YYYY-MM-DD
  start_time:           string | null;   // HH:MM，null 表示全天计划
  end_time:             string | null;   // HH:MM
  tags:                 string[];
  done:                 boolean;
  priority:             1 | 2 | 3;      // 1=低 2=中 3=高
  recurrence_type:      RecurrenceType;
  recurrence_days:      number[] | null; // 0=周日…6=周六，仅 weekly 使用
  recurrence_end_date:  string | null;  // YYYY-MM-DD
  recurrence_group_id:  string | null;  // UUID，循环组共享同一值
  created_at:           string;
  updated_at:           string;
}

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';
type RecurrenceScope = 'one' | 'future' | 'all';
```

SQLite 存储注意：
- `tags` 列存 JSON 字符串，序列化/反序列化仅在 `SqlitePlanRepository.rowToPlan()` 中处理
- `done` 列为 `INTEGER 0/1`，在 `rowToPlan()` 中转换为 boolean
- `updated_at` 无触发器，每条 UPDATE 语句手动写 `SET updated_at = datetime('now','localtime')`

---

## Tag

```ts
interface Tag {
  name:      string;
  color:     string;   // hex，前端展示时由 tagColor() 哈希计算，不使用此字段
  is_preset: boolean;
}
```

预设标签（`is_preset=true`）不可删除，创建时由 seed 脚本写入。

---

## 可编辑性判断（`isPlanEditable`）

决定是否允许编辑/批量删除的逻辑，前端 `client/src/types/plan.ts` 中定义：

```
if plan.date < today                          → false（过去日期）
if plan.date > today                          → true（未来日期）
if plan.date === today:
  if plan.start_time === null                 → false（全天计划，今天0点已到来）
  if toMinutes(plan.start_time) <= nowMinutes → false（时间段已到来）
  else                                        → true
```

此规则同时用于：
- PlanCard 编辑按钮的 disabled 状态
- `openEdit` 入口守卫（day.tsx / month.tsx）
- 删除 scope modal 中 `future` / `all` 选项的 disabled 状态
