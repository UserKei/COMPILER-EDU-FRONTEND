# Before Begining

### 简介

<aside>

BACKEND 是项目的后端

FRONTEND 是正在开发的前端

FRONTEND-OLD 是之前的前端

需求是美化之前的前端，我打算直接重新写一个前端，不需要修改后端

</aside>

---

### 技术栈

<aside>

- Tailwind CSS
- Shadcn-ui
- GSAP
- Vue-Flow（这个在之前的前端也有使用，可以参考TS的代码部分，样式要自己写）
</aside>

---

### 参考网站

<aside>

https://ai.google/our-ai-journey

这个网站我觉得设计挺不错

</aside>

---

# Specific Requirements

## Template

```html
<el-collapse-item title="1️⃣ 输入正则表达式" name="1">...

<el-collapse-item title="2️⃣ 绘制NFA" name="2" >...

<el-collapse-item title="3️⃣ 用子集法求解 转换表和状态转换矩阵" name="3">...

<el-collapse-item title="4️⃣ 绘制DFA" name="4">

<el-collapse-item title="5️⃣ 最小化DFA" name="5">

<el-collapse-item title="6️⃣ 绘制最小化DFA" name="6">
```

这样的直接摆列太丑了

要求做成页面最上面有个转换图然后切换子页面的

---

## Transition Diagram Design (For Page Switch)

```mermaid
graph LR
    A[REGEX] -->|Thompson| B[NFA]
    B -->|Subset| C[TABLE]
    C -->|Convert| D[DFA]
    D -->|Hopcroft| E[MIN]
    E -->|Draw| F[RESULT]
    
    style A fill:#3B82F6,stroke:#fff,stroke-width:2px,color:#fff
    style B fill:#8B5CF6,stroke:#fff,stroke-width:2px,color:#fff
    style C fill:#10B981,stroke:#fff,stroke-width:2px,color:#fff
    style D fill:#F59E0B,stroke:#fff,stroke-width:2px,color:#fff
    style E fill:#EF4444,stroke:#fff,stroke-width:2px,color:#fff
    style F fill:#6366F1,stroke:#fff,stroke-width:2px,color:#fff
```
效果图大概这样，但是我想要线条的链接有一个向上的弧度，然后哥哥节点是圆形

里面的样式可以不管