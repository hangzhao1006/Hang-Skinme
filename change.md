# 今日有效修改记录 (2026-04-16)

## 一、架构概览（未变动部分）

### 前端输出流程
```
用户输入 → POST /chat (FormData)
         ← JSON { response, session_id, result }
         → setChatMessages 替换 statusMessage → 渲染 Markdown
```

前端聊天逻辑在 `src/frontend/src/components/DashboardContent.tsx`：
- 发送消息时先插入 rotating status message（每 2 秒切换文案）
- 收到完整响应后用 `statusMessageIndex` 替换为真实内容
- 产品推荐单独渲染为 BUY LINK 卡片

### 后端 Agent 结构
```
POST /chat
  └── runner.run()
        ├── user_context_retriever.get_smart_context()   # 拼接用户画像+天气+历史
        ├── classify_intent_fast(user_message)            # 意图分类（纯关键词，不调LLM）
        │     → 'none' | 'analysis_only' | 'recommendation' | 'both' | 'image_history'
        ├── route_and_process(contextualized_msg, image, intent)
        │     ├── analysis_only  → analyze_skin()
        │     ├── recommendation/both → analyze_skin() + recommend_products()
        │     └── image_history  → analyze_user_image_history()
        └── chat.send_message(agent_data_prompt | contextualized_msg)
              → Gemini 2.0 Flash 生成最终回复
```

---

## 二、今日有效修改（3处）

### 1. GCP 项目配置修正
**文件:** `docker-compose.yml`

原配置指向已停用 billing 的旧项目，导致所有 GCS/Gemini 请求返回 403。

| 配置项 | 修改前 | 修改后 |
|--------|--------|--------|
| `GCP_PROJECT` | `hang-app` | `hang-app-481022` |
| `GOOGLE_CLOUD_LOCATION` | `us-east1` | `us-south1` |
| `GCP_PROJECT_ID` | `resonant-time-480901-n6` | `hang-app-481022` |
| `BUCKET_NAME` | `hang-skincare` | `hang-skinme` |
| `RAG_CORPUS` | `projects/resonant-time-480901-n6/...` | `projects/hang-app-481022/locations/us-south1/ragCorpora/2305843009213693952` |

**原因:** `hang-skincare` bucket 属于 billing 已关闭的旧项目；`hang-skinme` 是 `hang-app-481022` 下的正确 bucket。

---

### 2. 路由 intent 污染修复
**文件:** `src/api-service/agent/routing_agent.py`

**问题:** `route_and_process()` 内部对 `contextualized_message`（包含用户画像、天气、历史记录等大段上下文）重新执行 `classify_intent_fast()`，上下文中含有 "image"、"history" 等词导致普通文字消息被误路由到 `image_history`。

**修复:** `route_and_process()` 新增可选 `intent` 参数，若外部已传入则跳过内部重分类：

```python
# 修改前
def route_and_process(user_input: str, user_image=None) -> dict:
    intent = classify_intent_fast(user_input, has_image=bool(user_image))

# 修改后
def route_and_process(user_input: str, user_image=None, intent: str = None) -> dict:
    if intent is None:
        intent = classify_intent_fast(user_input, has_image=bool(user_image))
```

`runner.py` 同步修改，将已在原始 `user_message` 上算好的 intent 直接传入：
```python
result = route_and_process(contextualized_message, user_image, intent)
```

---

### 3. LLM 编造"收到图片"修复
**文件:** `src/api-service/api-service/runner.py`

**问题:** 用户发普通文字消息时，LLM 有时回复"I've received your skin image"或"Based on the photo you shared..."。

**修复:** 在 system prompt 末尾追加明确的 IMAGE RULES：

```
IMAGE RULES:
- NEVER say you received, saw, or analyzed an image unless the prompt explicitly
  contains 'IMAGE ANALYSIS RESULT' or 'image_analysis' data.
- If no image data is present, treat the conversation as text-only.
- Do NOT reference photos, pictures, or skin images the user hasn't uploaded.
```

---

## 三、无变动部分

- 前端输出方式：仍为非流式 `POST /chat`，收到完整 JSON 后一次性渲染
- 数据库、GCS 读写逻辑无变化
- Agent 内部逻辑（analysis、recommendation、image_history）无变化
- 前端 UI 组件无变化

---

## 四、遗留问题

- 前端 status message 替换仍依赖数组下标 `statusMessageIndex`（存在 stale closure 风险）
- 流式输出（SSE）尝试过多次均因截断问题放弃，仍使用同步响应
- 天气 CORS：前端直接调后端 `/weather/fetch` 代理，URL hardcode 依赖 `NEXT_PUBLIC_API_URL` 正确配置
