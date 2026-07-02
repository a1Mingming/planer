# API 文档

所有响应格式：`{ success: true, data: T }` 或 `{ success: false, error: { code, message } }`

基础 URL：`http://localhost:3001`

---

## Plans

### GET /api/plans

查询计划列表。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `view` | `year\|month\|day\|search` | 是 | 视图类型 |
| `date` | string | 是 | 对应格式：`YYYY` / `YYYY-MM` / `YYYY-MM-DD` |
| `q` | string | 否 | `view=search` 时的搜索关键词 |

**年视图**返回 `{ month: string; total: number; done: number }[]`，每月一条摘要。  
**月/日视图**返回 `Plan[]`。

---

### GET /api/plans/:id

返回单条计划。

---

### POST /api/plans

创建计划。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string (max 100) | 是 | |
| `date` | string `YYYY-MM-DD` | 是 | |
| `start_time` | string `HH:MM` | 是 | |
| `end_time` | string `HH:MM` | 是 | 必须晚于 `start_time` |
| `tags` | string[] | 否 | 默认 `[]`，每项 max 20 字符 |
| `done` | boolean | 否 | 默认 `false` |
| `priority` | `1\|2\|3` | 否 | 1=低 2=中 3=高，默认 `1` |
| `recurrence_type` | `none\|daily\|weekly\|monthly` | 否 | 默认 `none` |
| `recurrence_days` | number[] | 否 | `weekly` 时使用，0=周日…6=周六 |
| `recurrence_end_date` | string `YYYY-MM-DD` | 否 | 循环结束日期，留空默认 90 天 |

创建循环计划时，后端生成 `recurrence_group_id`（UUID），并批量插入所有日期实例，返回第一条。

---

### PUT /api/plans/:id

更新单条计划（所有字段均为可选的 patch 语义）。

---

### DELETE /api/plans/:id

删除单条计划。

---

### GET /api/plans/:id/recurrence/count

查询批量操作将影响的计划条数（仅统计未完成且日期 > 今天的条目）。

| Query 参数 | 类型 | 必填 | 说明 |
|------------|------|------|------|
| `scope` | `future\|all` | 是 | `future`=该条及之后，`all`=整个循环组 |

返回 `{ count: number }`。

---

### PATCH /api/plans/:id/recurrence/rebuild

修改循环规则时调用（重建路径）：删除受影响的未完成未来条目，用新规则重新生成。已完成计划不受影响。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `scope` | `future\|all` | 是 | 影响范围 |
| `date` | string `YYYY-MM-DD` | 是 | 重建起始日期 |
| `recurrence_type` | `daily\|weekly\|monthly` | 是 | 新循环类型 |
| `title` | string | 否 | |
| `start_time` | string `HH:MM` \| null | 否 | |
| `end_time` | string `HH:MM` \| null | 否 | |
| `tags` | string[] | 否 | |
| `priority` | `1\|2\|3` | 否 | |
| `recurrence_days` | number[] \| null | 否 | |
| `recurrence_end_date` | string \| null | 否 | |

---

### PUT /api/plans/:id/recurrence

批量更新循环计划（非循环规则字段）。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `scope` | `one\|future\|all` | 是 | |
| `title` | string | 否 | |
| `start_time` | string \| null | 否 | |
| `end_time` | string \| null | 否 | |
| `tags` | string[] | 否 | |
| `priority` | `1\|2\|3` | 否 | |

仅更新 `done=false` 的条目，`scope=future` 时还限制 `date >= 该条日期`。

---

### DELETE /api/plans/:id/recurrence

批量删除循环计划。

**请求体：** `{ scope: "one" | "future" | "all" }`

仅删除 `done=false AND date > today` 的条目（`scope=one` 不受此限制，直接删除该条）。

---

## Tags

### GET /api/tags

返回所有标签 `Tag[]`。

### POST /api/tags

创建标签。请求体：`{ name: string }` (max 20)。预设标签不可删除。

### DELETE /api/tags/:name

删除标签（预设标签返回 `TAG_PRESET_READONLY` 错误）。

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| `PLAN_NOT_FOUND` | 计划不存在 |
| `TAG_NOT_FOUND` | 标签不存在 |
| `TAG_ALREADY_EXISTS` | 标签名重复 |
| `TAG_PRESET_READONLY` | 预设标签不可修改/删除 |
| `INVALID_PARAM` | 请求参数校验失败 |
| `INTERNAL_ERROR` | 服务器内部错误 |
