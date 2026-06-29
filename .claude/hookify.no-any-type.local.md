---
name: warn-no-any-type
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.tsx?$
  - field: new_text
    operator: regex_match
    pattern: ":\s*any[^A-Za-z]|:\s*any$"
---

⚠️ **禁止使用 `any` 类型**

检测到 `: any` 类型注解，违反了项目 TypeScript 严格模式规范。

**为什么不能用 any：**
- `any` 会绕过 TypeScript 类型检查，使严格模式形同虚设
- 类型错误会在运行时才暴露，而不是编译时

**替代方案：**
- 未知类型 → 使用 `unknown`，再做类型收窄（`if (typeof x === 'string')`）
- 外部 API 返回值 → 定义对应的 interface 或用 `z.infer<typeof schema>`（zod）
- 复杂联合类型 → 用 `type` 定义具体联合类型
- 确实无法确定 → 使用 `unknown` + 类型断言，并写注释说明原因
