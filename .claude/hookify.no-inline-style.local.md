---
name: warn-no-inline-style
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.tsx$
  - field: new_text
    operator: regex_match
    pattern: "style=\\{\\{"
---

⚠️ **检测到内联样式 `style={{}}`**

项目规范要求样式统一写入 `.less` 文件（CSS Modules），禁止在 TSX 中使用内联样式对象。

**为什么不用内联样式：**
- 内联样式无法使用媒体查询，无法实现响应式
- 样式散落在 TSX 中，难以维护和复用
- 影响运行时性能（每次渲染创建新对象）

**例外情况（可保留）：**
- 动态计算的尺寸，如 `style={{ width: `${progress}%` }}`
- 移动端特殊处理，如 Modal 全屏 `style={{ top: 0, maxWidth: '100vw' }}`
- 此类情况请加注释说明原因

**正确做法：**
```tsx
// ❌
<div style={{ color: 'red', fontSize: 14 }}>

// ✅ 在 index.module.less 中定义，用 CSS Modules 引用
import styles from './index.module.less';
<div className={styles.title}>
```
