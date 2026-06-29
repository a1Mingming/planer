---
name: warn-domain-layer-purity
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: /domain/
  - field: new_text
    operator: regex_match
    pattern: "from ['\"].*infrastructure"
---

🚫 **DDD 架构违规：领域层不能依赖基础设施层**

检测到 `domain/` 目录下的文件正在 import `infrastructure/` 中的模块。

**DDD 依赖方向（单向）：**
```
interface → application → domain
infrastructure → (implements) domain interfaces
```

**领域层（domain/）只能：**
- 定义实体类（Entity）
- 定义仓库接口（IRepository）
- 定义领域错误（DomainError）
- 引用其他 domain 内的模块

**正确做法：**
- 在 `domain/` 中定义接口（如 `IPlanRepository`）
- 在 `infrastructure/repositories/` 中实现该接口（`SqlitePlanRepository implements IPlanRepository`）
- 通过依赖注入（构造函数参数）将实现传入 `application/` 层

这是 DDD 的核心原则：领域层不依赖任何具体技术实现。
