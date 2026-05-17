# SkinMe 面试手册事实核查 (2026-04-16)

对照 `src/api-service/` 实际代码，逐一核查 interview_v2.html 中关于 SkinMe 项目的描述。

---

## ❌ 错误或夸大的地方

### 1. Gemini 模型版本说错了
**手册描述：** "AnalysisAgent 调用 **Gemini 2.5 Flash** 做皮肤图像分析"

**实际情况：**
- `analysis_agent.py` 第10行：`GEMINI_MODEL = "gemini-2.5-flash"` ✅（analysis agent 用 2.5 Flash）
- `runner.py` 第17行 + `docker-compose.yml`：`GEMINI_MODEL = "gemini-2.0-flash"` — **chat session 用的是 2.0 Flash**

**结论：** 两个地方用不同版本，手册只提 2.5 Flash，没说清楚 chat 用的是 2.0 Flash。面试时应说明：AnalysisAgent 用 gemini-2.5-flash 做图像分析，AgentRunner 的 chat session 用 gemini-2.0-flash。

---

### 2. RAG chunk_size/overlap 参数错误
**手册描述：** "chunk_size=512，overlap=100"

**实际情况：** `dermnet_preprocess.py` 第33行：
```python
splitter = CharacterTextSplitter(chunk_size=350, chunk_overlap=20, separator=" ")
```
实际是 **chunk_size=350，overlap=20**，手册数字完全不对。

---

### 3. 推荐返回 top-5 说法不精确
**手册描述：** "返回 top-5"

**实际情况：** `recommendation_agent.py`：
- 先取 scored_products[:15]，再 diversity 筛选
- 最终 `top_products[:5]` 返回给 chat 格式化
- 但 products 字段本身存了更多（最多15条）

**结论：** 说 top-5 基本正确（chat 格式化用前5），但如果被追问细节要说清楚内部是先取15再取5。

---

### 4. 缓存 TTL 数值描述错误
**手册描述：** "user_context_cache 120秒 / profile_cache 600秒"

**实际情况：** `cache.py` 第72-73行：
```python
user_context_cache = SimpleCache(default_ttl=300)  # 5 minutes（默认300秒）
profile_cache = SimpleCache(default_ttl=600)       # 10 minutes
```
`user_context_retriever.py` 第121行：`self.cache.set(cache_key, result, ttl=120)` — 写入时覆盖为120秒

**结论：** user_context_cache 的实例默认是300秒，但实际写入时指定了 ttl=120。profile_cache 是600秒正确。手册说"120秒"是对的，但来源容易说错（不是实例默认值，是 set 时传入的）。

---

### 5. 数据层说用了 MySQL 和 Redis，实际没有
**手册描述：** "结构化数据 → MySQL" 、 "热点缓存 → Redis"

**实际情况：**
- 代码中**零 MySQL 引用**，用户画像全存 GCS（JSON文件）
- 代码中**零 Redis 引用**，缓存是 `SimpleCache`（纯内存 Python dict + threading.Lock）
- BigQuery 用于产品结构化查询（有 `bigquery_service.py`），但不是主路径

**结论：** MySQL 和 Redis 是**面试中讲的理想架构扩展方向**，不是已落地的技术。面试时必须清楚区分"已实现"和"规划中"，否则被追问会穿帮。

---

### 6. 四种设计模式在代码里不存在
**手册描述：** 策略模式、观察者模式、工厂模式、中介者模式 — 代码里能体现这些设计模式

**实际情况：** 代码里没有 Strategy class、没有 Observer/Subject、没有 AgentFactory 类、没有 Mediator。

实际架构是：
- `routing_agent.py` — 一个函数 `route_and_process()` + if/elif 分支
- `runner.py` — `AgentRunner` 类直接调用各 agent 函数，没有模式封装

**结论：** 这些设计模式是"可以用来描述架构思想"的类比，但**代码里没有落地**。面试时如果说"我们实现了策略模式"会被追问代码在哪，容易穿帮。应改为"架构上体现了策略模式的思想"。

---

### 7. Agent 间通信说是"共享状态 dict"，实际是函数返回值传递
**手册描述：** "所有Agent读写同一个dict（共享状态）"

**实际情况：** 没有共享状态 dict。各 agent 是函数调用，返回值直接传给下一个：
```python
result = route_and_process(...)          # 返回 dict
agent_data_prompt = _format_agent_data_for_chat(result, ...)  # 传入 dict
response = chat.send_message(agent_data_prompt)
```
是**函数调用链传值**，不是共享状态。

---

### 8. response_schema 只用在 profile_extractor，不是全局
**手册描述：** "关键输出用 Gemini 的 response_schema 强约束 JSON"（暗示是普遍用法）

**实际情况：** `response_schema` 只在 `profile_extractor.py` 第71行使用（temperature=0.1）。`analysis_agent.py` 里 response_schema 是注释掉的代码，未启用。

---

### 9. 聊天历史摘要说是"规则抽取"，但方法名叫 `get_conversation_summary` 容易误解
**手册描述：** "7天历史压成约20词摘要（关键词规则抽取：过敏/敏感/皮肤问题/图片上传事件）"

**实际情况：** `chat_logger.py` 第150行的实现确实是关键词规则（非LLM），这部分描述**正确**。但实际只看最近3条 user 消息，最多取2个 key_info 拼接，不一定是20词，是"CHAT HISTORY: concern: acne; uploaded skin image"这种格式。

---

### 10. SSE 流式渲染描述与实际实现不符
**手册描述：** "SSE流式渲染：fetch+ReadableStream，setMessage(prev=>prev+text)防闭包，ref缓冲+RAF批量渲染防卡顿"、"Agent链路进度展示：路由完成→RAG检索中→生成回答中"

**实际情况：** 当前代码（commit 43f2961 恢复后）是**非流式**的。前端用 `POST /chat` 拿完整 JSON，没有 SSE、没有 ReadableStream、没有 ref 缓冲。SSE 实现尝试过但因截断问题放弃了。

**结论：** 这整段描述的是**未落地的规划**，不是已实现功能。面试时如果被要求 demo 会穿帮。

---

## ✅ 描述正确的地方

| 内容 | 核查结果 |
|------|----------|
| RoutingAgent 用纯关键词，不调 LLM | ✅ `classify_intent_fast()` 纯 if/elif |
| 5种 intent 分类 | ✅ none/analysis_only/recommendation/both/image_history |
| AVOID 成分硬过滤 | ✅ `recommendation_agent.py` 第126行 skip 逻辑 |
| PRIMARY +10 / SECONDARY +5 评分 | ✅ 第135/141行 |
| similarity_top_k=10 | ✅ `analysis_agent.py` 第99行 |
| 7天对话历史（默认值） | ✅ `conversation_days=7` |
| profile_cache 600秒 TTL | ✅ `cache.py` 第73行 |
| context 缓存主动失效 | ✅ `profile_extractor.py` 第203-205行 |
| 历史摘要用关键词规则而非LLM | ✅ `chat_logger.py` 第181-196行 |
| DATA_SOURCE 切换 GCS/Postgres | ✅ `docker-compose.yml` DATA_SOURCE 环境变量 |
| asyncio.gather 是规划中优化，未实测 | ✅ 手册有注明，正确 |
| 简单问候不注入 context | ✅ `user_context_retriever.py` 有 greeting 检测逻辑 |

---

## 建议面试前修正的说法

1. **模型版本**：明确说"AnalysisAgent 用 gemini-2.5-flash，chat session 用 gemini-2.0-flash"
2. **chunk 参数**：改为"chunk_size=350，overlap=20"
3. **MySQL/Redis**：改为"当前用 GCS + 内存缓存，规划扩展到 MySQL/Redis"
4. **设计模式**：改为"架构思想上体现了 X 模式"，不说"实现了"
5. **Agent通信**：改为"函数返回值传递"，不说"共享状态"
6. **SSE流式**：不在面试里主动提，除非被问到再说"探索过，遇到实现问题"
7. **response_schema**：说"profile_extractor 用了 response_schema 强约束"，不说是全局做法
