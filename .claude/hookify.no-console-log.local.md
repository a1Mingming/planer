---
name: warn-no-console-log
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.tsx?$
  - field: new_text
    operator: contains
    pattern: console.log(
---

🔍 **检测到 `console.log`**

调试日志不应进入生产代码。

**处理方式：**
- 临时调试完毕后请删除
- 后端需要持久日志 → 使用 `morgan`（HTTP 请求日志已配置）或 `console.info/warn/error`（有语义区分）
- 前端需要诊断信息 → 考虑在开发环境条件下输出：
  ```ts
  if (process.env.NODE_ENV === 'development') {
    console.log(...)
  }
  ```

**注意：** `console.warn` 和 `console.error` 用于标记真实警告/错误，可以保留。
