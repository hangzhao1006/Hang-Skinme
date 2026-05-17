# SkinMe 更新记录 (2026-04-16 下午)

## 概览

本次更新在已有 SSE 流式输出基础上，完成三项改进：
1. **打字机效果** — 逐字符渲染，配合光标动画
2. **思考状态动画** — 第一个 token 到达前显示 `▍` 光标
3. **语言自动跟随** — 用户用中文提问就回中文，用英文就回英文
4. **模型统一升级 + 环境变量化** — 全链路升到 `gemini-2.5-flash`，一处配置控制所有模块

---

## 一、打字机效果 + 思考光标

### 问题
之前 SSE token 到达后立即渲染，Gemini 后端是批量返回（一次返回多个词），导致前端看起来是一段一段蹦出来，不像 DeepSeek/ChatGPT 那种逐字流动感。

### 实现方案

**文件：** `src/frontend/src/components/DashboardContent.tsx`

#### 阶段一：等待光标

在 SSE 连接建立、`clearInterval(statusInterval)` 之后、第一个 token 到达之前，立刻把 status bubble 替换成一个跳动光标：

```typescript
setChatMessages(prev => prev.map(m =>
  (m as any).id === STATUS_ID ? { ...m, content: '▍', id: STATUS_ID } : m
));
```

效果：旋转文字（"Thinking..."）消失，换成 `▍`，告诉用户模型已经开始生成。

#### 阶段二：Token 队列 + 定时器

核心思路：**把 SSE token 和前端渲染解耦**。

SSE 数据到达速度不均匀（后端批量返回），直接渲染会一段一段蹦。解法是引入一个中间队列：

```
SSE token → tokenQueue[] → setInterval(18ms) → 逐字符渲染
```

具体实现：

```typescript
const tokenQueue: string[] = [];       // 字符缓冲队列
let typingTimer: ReturnType<typeof setInterval> | null = null;
let streamDone = false;                // 后端是否已发完
let finalProducts: any[] = [];
let finalSessionId = '';

const startTyping = () => {
  if (typingTimer) return;             // 已在运行则跳过
  typingTimer = setInterval(() => {
    if (tokenQueue.length > 0) {
      const tok = tokenQueue.shift()!;
      accumulated += tok;
      setChatMessages(prev => prev.map(m =>
        (m as any).id === STATUS_ID
          ? { role: 'assistant', content: accumulated + '▍', id: STATUS_ID }
          : m
      ));
    } else if (streamDone) {
      // 队列清空且后端已结束 → 最终化消息，去掉光标
      clearInterval(typingTimer!);
      if (finalSessionId && !sessionId) setSessionId(finalSessionId);
      setChatMessages(prev => prev.map(m => {
        if ((m as any).id !== STATUS_ID) return m;
        const final: ChatMessage = { role: 'assistant', content: accumulated };
        if (finalProducts.length > 0) final.products = finalProducts;
        return final;
      }));
    }
    // 若队列空但后端未结束 → 定时器继续等待新 token
  }, 18);  // 18ms ≈ 55 fps，接近人眼感知的流畅阈值
};
```

**为什么 18ms：** 人眼能感知到约 60fps 的动画，18ms ≈ 55fps，比 16ms（60fps）略慢一点，给 React state 更新留余量，避免掉帧。

#### 阶段三：processEvent 改造

`ev.token` 事件不再直接 `setChatMessages`，而是把每个字符推入队列：

```typescript
} else if (ev.token) {
  for (const ch of ev.token) tokenQueue.push(ch);  // 按字符拆分
  startTyping();
}
```

`ev.done` 事件只存储最终数据，不再直接更新 DOM：

```typescript
} else if (ev.done) {
  finalSessionId = ev.session_id || '';
  finalProducts = Array.isArray(ev.products) ? ev.products : [];
  streamDone = true;
  // 定时器检测到 streamDone 且队列空时自动最终化
}
```

#### 整体时序

```
用户发送消息
  ↓
旋转 status 文字（Thinking... / Analyzing...）
  ↓ SSE 连接建立
▍ 光标（等待第一个 token）
  ↓ 第一个 token 到达
逐字打出... ▍  （18ms/字，末尾跟光标）
  ↓ 后端 done 事件 + tokenQueue 清空
最终消息（无光标，产品卡片出现）
```

---

## 二、语言自动跟随

### 问题
用户用中文提问，LLM 有时回英文（因为 system prompt、RAG 文献、agent 数据格式都是英文，LLM 被"带偏"到英文）。

### 实现方案

**文件：** `src/api-service/api-service/runner.py`

在 `_get_chat()` 的 `system_instruction` 最开头加入语言规则，优先级高于其他所有规则：

```python
"LANGUAGE RULE (highest priority):\n"
"- ALWAYS reply in the SAME language the user wrote in.\n"
"- If the user writes in Chinese (中文), reply entirely in Chinese.\n"
"- If the user writes in English, reply in English.\n"
"- Never switch languages mid-conversation unless the user does first.\n\n"
```

**为什么放在最前面：** Gemini 对 system instruction 开头部分的权重更高（Lost in the Middle 效应）。放末尾容易被大量上下文稀释。

**覆盖范围：** 这条规则作用于 chat session（`AgentRunner._get_chat()`），即最终回复的生成阶段。Analysis agent（`analysis_agent.py`）产出的是结构化数据（成分名称），不是对话，所以不需要语言规则。

---

## 三、模型升级 + 统一环境变量化

### 问题
- Chat session（`runner.py`）用 `gemini-2.0-flash`，Analysis agent（`analysis_agent.py`）用硬编码的 `"gemini-2.5-flash"`，两处不一致
- 换模型需要改两个地方

### 实现方案

**`analysis_agent.py`：**
```python
# 修改前
GEMINI_MODEL = "gemini-2.5-flash"

# 修改后
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
```

**`docker-compose.yml`：**
```yaml
# 修改前
GEMINI_MODEL: "gemini-2.0-flash"

# 修改后
GEMINI_MODEL: "gemini-2.5-flash"
```

现在 `docker-compose.yml` 里的一个环境变量同时控制：
- `runner.py` — chat session 模型
- `analysis_agent.py` — 皮肤图像分析模型

#### 模型对比

| 模型 | 速度 | 质量 | 适用场景 |
|------|------|------|----------|
| `gemini-2.0-flash` | 最快 | 一般 | 简单对话 |
| `gemini-2.5-flash` | 快 ✅ 当前 | 好 | 综合最优 |
| `gemini-2.5-pro` | 慢 | 最强 | 复杂推理（成本高） |

换模型只需修改 `docker-compose.yml` 一行，然后 `docker compose restart skincare-api`。

---

## 四、已修复的历史 Bug（本次 session）

| Bug | 根因 | 修复 |
|-----|------|------|
| SSE 截断 | `.env.local` 里 `NEXT_PUBLIC_API_URL=192.168.1.166:8080`（旧 GKE IP），请求打到已停服的公网服务器，nginx 缓冲 SSE | 改为 `localhost:8080` |
| 流式显示不全 | `ev.token` 处理时生成的新消息没有 `id: STATUS_ID`，后续 token 和 `done` 事件的 `prev.map` 找不到目标消息 | 在 token 更新时保留 `id: STATUS_ID` |
| GCS/Gemini 403 | `docker-compose.yml` 指向 billing 已关闭的旧项目（`hang-app` + `hang-skincare` bucket） | 改为 `hang-app-481022` + `hang-skinme` |
| LLM 编造收到图片 | system prompt 没有约束 | 加 IMAGE RULES |
| 路由 intent 污染 | `route_and_process()` 对包含 "image"/"history" 词的 `contextualized_message` 重新分类 | 新增 `intent` 参数，外部传入跳过内部重分类 |
