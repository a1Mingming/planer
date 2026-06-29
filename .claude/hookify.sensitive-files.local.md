---
name: warn-sensitive-files
enabled: true
event: file
action: warn
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.env$|\.env\.|credentials|secrets
---

🔐 **检测到敏感文件**

正在编辑可能含有敏感数据的文件。

**检查项：**
- 确认该文件已加入 `.gitignore`，不会被提交到版本库
- 不要在文件中硬编码密码、API Key、数据库连接串
- 使用环境变量引用，如 `process.env.DB_PATH`

**项目约定：**
- `.env` 文件存放本地环境变量，不提交
- `.env.example` 存放变量名模板（无实际值），可提交作为参考
