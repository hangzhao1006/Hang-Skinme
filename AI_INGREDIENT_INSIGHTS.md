# 🧠 AI 成分分析洞察 - Intelligent Ingredient Insights

## 🎯 功能概述

这个功能使用 **Gemini 2.0 Flash** 模型来分析你的护肤成分使用模式，并提供个性化的洞察和建议。

**核心价值：** 不仅告诉你"用了什么"，更重要的是告诉你"这说明了什么"和"你该怎么做"。

---

## ✨ 主要特性

### 1. 智能数据聚合
后端自动计算以下统计数据：
- 📊 Top N 成分使用频率
- 🔄 成分出现天数和总次数
- 📦 每个成分涉及的产品数量
- 🏷️ 成分自动分类（活性成分/保湿剂/酸类/抗氧化剂等）
- ⚠️ 高频使用模式识别
- 🔀 多产品重复成分检测

### 2. AI 生成的洞察
Gemini 分析数据后提供：

#### TL;DR（一句话总结）
> "过去 7 天你的护肤整体比较温和，主要以保湿和清洁成分为主，有少量酸类活性成分，整体风险偏低。"

#### 使用模式（3条）
- 发现你的高频成分
- 识别护肤风格（温和派/功效派/极简派）
- 指出显著的成分重叠

#### 关键发现（3条）
- 正面观察（你做得好的地方）
- 温和的关注点（如果有的话）
- 优化机会

#### 优化建议（2-3条）
- 具体、可执行的建议
- 关于流程结构的建议
- 关于使用时机或叠加的建议

#### 下一步问题（3个）
引导用户继续对话的示例问题

---

## 🛠️ 技术架构

### 后端实现

#### 1. 成分分析器 ([ingredient_analyzer.py](src/api-service/agent/ingredient_analyzer.py))

```python
class IngredientAnalyzer:
    def calculate_ingredient_statistics(self, trends_data)
        """计算结构化统计数据"""

    def generate_insights(self, statistics, language)
        """调用 Gemini 生成洞察"""
```

**核心功能：**
- ✅ 聚合多天的成分数据
- ✅ 按类别分类成分（活性/保湿/酸类等）
- ✅ 计算使用频率和模式
- ✅ 识别高频和重复成分
- ✅ 多语言支持（中/英/西/越）

#### 2. API 端点

```http
GET /api/ingredient-insights/{user_identifier}?days=7&language=zh
```

**参数：**
- `user_identifier`: 用户email
- `days`: 分析天数（7/14/30）
- `language`: 返回语言（zh/en/es/vi）

**返回数据结构：**
```json
{
  "tldr": "一句话总结",
  "patterns": ["模式1", "模式2", "模式3"],
  "insights": ["洞察1", "洞察2", "洞察3"],
  "recommendations": ["建议1", "建议2", "建议3"],
  "followup_questions": ["问题1", "问题2", "问题3"],
  "overall_assessment": "positive|balanced|needs_attention",
  "statistics": {...}
}
```

---

### 前端实现

#### UI 组件结构

```
📈 成分使用趋势页面
├── 🧠 智能成分洞察卡片 (NEW!)
│   ├── TL;DR (带颜色指示器)
│   ├── 使用模式 (左栏)
│   ├── 关键发现 (右栏)
│   ├── 优化建议 (绿色卡片)
│   └── 你可以问我 (紫色卡片，可点击)
├── 📊 每日产品使用量
└── 📈 成分频率排行
```

#### 视觉设计

**颜色指示器：**
- 🟢 Green: `overall_assessment === 'positive'`
- 🟡 Yellow: `overall_assessment === 'needs_attention'`
- 🔵 Blue: `overall_assessment === 'balanced'`

**卡片渐变：**
- 主卡片: `bg-gradient-to-br from-blue-50 to-purple-50`
- 问题卡片: `bg-gradient-to-r from-purple-50 to-blue-50`

---

## 🎨 UI 效果预览

```
┌────────────────────────────────────────────────────────┐
│  🧠 智能成分洞察                                        │
├────────────────────────────────────────────────────────┤
│  🔵 过去7天你的护肤整体比较温和，主要以保湿和清洁成分  │
│     为主，有少量酸类活性成分，整体风险偏低。           │
├────────────────────────────────────────────────────────┤
│  📊 使用模式              │  💡 关键发现               │
│  • 你几乎每天都在用含有  │  • 你的保湿成分充足       │
│    water、glycerin的产品 │  • 活性成分使用适度       │
│  • 你的routine以保湿     │  • 可以考虑增加抗氧化成分 │
│    为主                  │                            │
├────────────────────────────────────────────────────────┤
│  ✨ 优化建议                                           │
│  1. 目前你的活性成分集中在晚间，如果白天环境日晒强...│
│  2. 水杨酸类成分已经出现在你最近7天的6天，可以尝试...│
│  3. 可以在早上增加一款带有抗氧化成分的产品...        │
├────────────────────────────────────────────────────────┤
│  💬 你可以问我：                                       │
│  💬 我现在的成分组合会不会太刺激？                    │
│  💬 如果我想主打补水，该删掉/增加什么？               │
│  💬 我最近长闭口，能不能帮我检查成分里容易堵塞的？    │
└────────────────────────────────────────────────────────┘
```

---

## 🤖 Prompt 工程

### LLM Prompt 结构

```python
prompt = f"""You are a gentle, knowledgeable skincare ingredient coach.

IMPORTANT: Respond ONLY in {output_lang}.

User's data for past {days} days:
- Total days: 7
- Avg products/day: 2.3
- Unique ingredients: 15

Top 10 ingredients:
1. water - used 7/7 days, appears in 3 products
2. glycerin - used 5/7 days, appears in 2 products
...

Ingredient categories:
- Active: niacinamide, retinol
- Acids: salicylic acid
- Moisturizers: hyaluronic acid, glycerin

Usage patterns:
- High-frequency (>80%): water, glycerin
- Overlapping (2+ products): water, glycerin, phenoxyethanol

Provide JSON with:
- tldr (1-2 sentence summary, gentle tone)
- patterns (3 observations)
- insights (3 findings, positive first)
- recommendations (2-3 actionable suggestions)
- followup_questions (3 example questions)
- overall_assessment (positive/balanced/needs_attention)

Guidelines:
1. Be warm, not clinical
2. Use "you might consider" not "you must"
3. Focus on patterns, not individual ingredients
4. Acknowledge what they're doing well first
5. Simple, jargon-free language
"""
```

### 关键提示策略

1. **温和语气** 🌸
   - ✅ "你可以考虑..."
   - ❌ "你必须..."
   - ❌ "这样会毁容"

2. **正面优先** ✨
   - 先说做得好的地方
   - 再温和提醒关注点
   - 最后给出建议

3. **具体可行** 🎯
   - 不说"注意成分"
   - 说"试试在早上增加抗氧化精华"

4. **引导对话** 💬
   - 提供3个示例问题
   - 让用户继续探索

---

## 📊 成分分类逻辑

```python
# 简化版分类（实际可以连接 BigQuery 获取完整数据）
categories = {
    "actives": ["retinol", "niacinamide", "vitamin c", "peptide"],
    "acids": ["acid", "aha", "bha", "salicylic", "glycolic"],
    "moisturizers": ["hyaluronic", "glycerin", "ceramide", "squalane"],
    "antioxidants": ["tocopherol", "vitamin e", "green tea"],
    "preservatives": ["phenoxyethanol", "methylparaben"],
    "solvents": ["water", "aqua", "alcohol"]
}
```

### 扩展建议
未来可以：
- 连接 BigQuery 获取完整的 EFG 风险等级
- 添加香精检测
- 识别致痘成分
- 检测成分冲突

---

## 🌍 多语言支持

支持4种语言，完全本地化：

| 语言 | 代码 | 示例输出 |
|------|------|---------|
| 简体中文 | `zh` | "过去7天你的护肤整体比较温和..." |
| English | `en` | "Your routine over the past 7 days..." |
| Español | `es` | "Tu rutina en los últimos 7 días..." |
| Tiếng Việt | `vi` | "Thói quen của bạn trong 7 ngày..." |

---

## 🚀 使用流程

### 用户视角

1. **记录护肤流程**
   - 在"每日护肤"页面记录至少2-3天

2. **查看趋势分析**
   - 点击侧边栏 📈 "使用趋势"
   - 选择时间范围（7/14/30天）

3. **获得AI洞察**
   - 页面自动加载智能分析
   - 查看TL;DR、模式、发现、建议

4. **互动探索**
   - 点击"你可以问我"中的问题（未来会打开chat）
   - 继续深入了解成分

### 开发者调试

```bash
# 测试 API
curl "http://localhost:8080/api/ingredient-insights/user@example.com?days=7&language=zh"

# 查看日志
docker logs skincare-api --tail 100 | grep "ingredient"

# 手动测试分析器
docker exec -it skincare-api python -c "
from agent.ingredient_analyzer import ingredient_analyzer
stats = {...}  # 你的测试数据
insights = ingredient_analyzer.generate_insights(stats, 'zh')
print(insights)
"
```

---

## ⚙️ 配置选项

### Gemini 模型设置

```python
# 当前使用
model = GenerativeModel("gemini-2.0-flash-exp")

# 可选替换（更强大但更慢）
model = GenerativeModel("gemini-pro")

# 可选替换（更经济）
model = GenerativeModel("gemini-1.5-flash")
```

### 分析天数

```typescript
// 前端提供3个选项
[7, 14, 30].map((days) => (
  <Button onClick={() => setDaysToShow(days)}>
    {days} days
  </Button>
))
```

---

## 🔒 隐私和安全

### 数据处理
- ✅ 所有分析在后端完成
- ✅ 用户数据隔离（按email）
- ✅ 不永久存储AI生成的洞察（每次重新生成）
- ✅ 统计数据不包含敏感信息

### API 安全
- 🔐 用户身份验证（需要登录）
- 🔐 Email隔离（只能访问自己的数据）
- 🔐 CORS配置
- 🔐 错误处理（不暴露内部信息）

---

## 📈 性能优化

### 缓存策略
```python
# 未来可以添加
@cache(ttl=3600)  # 1小时缓存
def get_cached_insights(user, days, language):
    ...
```

### 减少 LLM 调用
- 只在有新数据时重新生成
- 可以存储结果到GCS
- 按 `user + date_range + language` 缓存

---

## 🐛 故障排查

### 问题1: 洞察不显示

**检查：**
```bash
# 1. 确认有数据
curl "http://localhost:8080/api/routines/user@example.com/range?start_date=2025-12-05&end_date=2025-12-11"

# 2. 测试洞察API
curl "http://localhost:8080/api/ingredient-insights/user@example.com?days=7&language=en"

# 3. 查看错误日志
docker logs skincare-api | grep -i error
```

### 问题2: LLM 返回格式错误

**原因：** Gemini 有时返回带markdown的JSON

**解决：** 代码已包含清理逻辑
```python
if cleaned.startswith("```"):
    cleaned = cleaned.split("```")[1]
    if cleaned.startswith("json"):
        cleaned = cleaned[4:]
```

### 问题3: 多语言不工作

**检查：**
```python
# language参数是否正确传递
language = request.args.get('language', 'en')

# 确认在prompt中使用
output_lang = lang_instructions.get(language, "English")
```

---

## 🔮 未来功能

### 短期（1-2周）
- [ ] 成分冲突自动检测
- [ ] 点击"你可以问我"打开chat对话
- [ ] 缓存洞察结果（减少API调用）
- [ ] 添加"重新分析"按钮

### 中期（1个月）
- [ ] 连接 BigQuery EFG 风险数据
- [ ] 香精和致敏成分检测
- [ ] 成分目标设置（用户自定义）
- [ ] 对比两个时间段的变化

### 长期（2-3个月）
- [ ] 结合皮肤状态记录的关联分析
- [ ] 成分推荐引擎
- [ ] 护肤流程自动优化建议
- [ ] 导出PDF报告

---

## 📚 相关文档

- [每日护肤记录功能](./DAILY_ROUTINE_FEATURE.md)
- [成分使用趋势指南](./ROUTINE_TRENDS_GUIDE.md)
- [BigQuery API文档](./BIGQUERY_API_README.md)
- [Gemini API文档](https://ai.google.dev/docs)

---

## 🎓 设计理念

### 核心原则

1. **"洞察" > "数据"**
   - 不仅展示统计数字
   - 更要解释"这意味着什么"

2. **温和 > 吓人**
   - 避免"警告""危险"等字眼
   - 用"考虑""可以试试"等建议语气

3. **可行 > 理论**
   - 不说"注意成分平衡"
   - 说"早上增加抗氧化精华，晚上用视黄醇"

4. **引导 > 结束**
   - 每次分析后提供3个follow-up问题
   - 让用户继续探索

### 用户体验

```
数据可视化 (What)
  ↓
AI洞察 (Why & So What)
  ↓
具体建议 (What to do)
  ↓
引导问题 (What's next)
```

---

**Happy analyzing! 🌟**
