# 🎨 成分风险等级可视化 - Ingredient Risk Level Visualization

## ✅ 已完成的改进

### 1. 产品搜索限制提升 📈
- ❌ **之前**：默认10条，最多100条
- ✅ **现在**：默认50条，最多200条

**修改文件**：`src/api-service/agent/bigquery_service.py`
```python
DEFAULT_SEARCH_LIMIT = 50   # 从 10 提升到 50
MAX_SEARCH_LIMIT = 200      # 从 100 提升到 200
```

---

### 2. 成分风险分类系统 🏷️

创建了智能成分分类器：`src/api-service/agent/ingredient_risk_classifier.py`

#### 风险等级分类

**高风险 (High Risk) ⚠️** - 需谨慎使用
- 强效活性成分：Retinol, Tretinoin, Hydroquinone
- 强酸类：Glycolic Acid, Salicylic Acid
- 香精和致敏原：Fragrance, Essential Oils, Limonene
- 强效酒精：Alcohol Denat, Isopropyl Alcohol
- 某些防腐剂：Methylisothiazolinone, Formaldehyde
- 硫酸盐表活：SLS, SLES

**中等风险 (Medium Risk) ⚡** - 适度使用
- 温和酸类：PHA, Gluconolactone
- 美白成分：Arbutin, Tranexamic Acid
- 高浓度抗氧化：Vitamin C, Ferulic Acid
- 常见防腐剂：Phenoxyethanol, Parabens
- 某些表活：Cocamidopropyl Betaine

**低风险 (Low Risk) ✓** - 一般安全
- 保湿剂：Hyaluronic Acid, Glycerin, Ceramide, Squalane
- 舒缓成分：Centella Asiatica, Niacinamide, Aloe Vera
- 温和抗氧化：Vitamin E, Green Tea
- 基础成分：Water, Butylene Glycol

#### 功能分类

成分同时按功能分类：
- **Active** (活性成分)
- **Exfoliant** (去角质)
- **Moisturizer** (保湿)
- **Antioxidant** (抗氧化)
- **Soothing** (舒缓)
- **Surfactant** (表活)
- **Preservative** (防腐剂)
- **Fragrance** (香精)
- **Solvent** (溶剂)

---

### 3. 新的可视化设计 🎨

#### Before (之前)
```
📊 成分频率排行
#1 water                         [3x]
████████████████████████████ 100%
来源: Serum, Moisturizer

#2 glycerin                      [2x]
████████████████             67%
来源: Cream
...
```

问题：
- ❌ 只按频率排序，没有风险意识
- ❌ 高风险成分和安全成分混在一起
- ❌ 用户无法快速识别需要关注的成分

#### After (现在)
```
📊 成分分析（按风险等级）

┌─────────────────────────────────────┐
│ ⚠️ 需谨慎           [2 种]           │
├─────────────────────────────────────┤
│ salicylic acid (exfoliant)    [3x] │
│ ████████████████████          75%   │
│ 来源: Paula's Choice BHA            │
│                                     │
│ fragrance (fragrance)         [2x] │
│ ████████████                  50%   │
│ 来源: Serum, Cream                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ⚡ 适度使用          [5 种]           │
├─────────────────────────────────────┤
│ niacinamide (active)          [2x] │
│ ████████████████              67%   │
│ ...                                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ✓ 安全              [8 种]           │
├─────────────────────────────────────┤
│ hyaluronic acid (moisturizer) [3x] │
│ ████████████████████████████ 100%   │
│ ...                                 │
└─────────────────────────────────────┘
```

优势：
- ✅ 高风险成分优先展示（红色区块）
- ✅ 颜色编码清晰（红/黄/绿）
- ✅ 显示功能分类（括号内）
- ✅ 用户一眼看出哪些需要注意

---

## 🎨 视觉设计细节

### 颜色方案

| 风险等级 | 背景色 | 边框 | 文字 | 徽章 | 进度条 | 图标 |
|---------|--------|------|------|------|--------|------|
| High    | `bg-red-50` | `border-red-200` | `text-red-700` | `bg-red-100` | `from-red-500 to-red-600` | ⚠️ |
| Medium  | `bg-yellow-50` | `border-yellow-200` | `text-yellow-700` | `bg-yellow-100` | `from-yellow-500 to-yellow-600` | ⚡ |
| Low     | `bg-green-50` | `border-green-200` | `text-green-700` | `bg-green-100` | `from-green-500 to-green-600` | ✓ |

### 布局结构

```
┌─────────────────────────────────┐
│ 🧪 成分统计                      │
├─────────────────────────────────┤
│ ┌─────────┬─────────┐           │
│ │ 产品总数 │ 成分种类 │           │
│ │   2     │   15    │           │
│ └─────────┴─────────┘           │
│                                 │
│ 📊 成分分析（按风险等级）        │
│                                 │
│ ⚠️ 需谨慎 [2 种]                │
│ ┌────────────────────────────┐ │
│ │ salicylic acid (exfoliant) │ │
│ │ ████████████████           │ │
│ │ 来源: Product A            │ │
│ └────────────────────────────┘ │
│                                 │
│ ⚡ 适度使用 [5 种]               │
│ ┌────────────────────────────┐ │
│ │ ...                        │ │
│ └────────────────────────────┘ │
│                                 │
│ ✓ 安全 [8 种]                   │
│ ┌────────────────────────────┐ │
│ │ ...                        │ │
│ └────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## 🔧 技术实现

### 后端改动

#### 1. 成分分类器
```python
class IngredientRiskClassifier:
    @classmethod
    def classify_risk(cls, ingredient_name: str) -> str:
        """返回 "high", "medium", "low" """

    @classmethod
    def get_functional_category(cls, ingredient_name: str) -> str:
        """返回功能分类"""

    @classmethod
    def sort_by_risk(cls, ingredients: List[Dict]) -> List[Dict]:
        """按风险等级排序（高->中->低），同等级内按使用次数排序"""
```

#### 2. API响应格式
```json
{
  "date": "2025-12-11",
  "total_products": 2,
  "ingredients": [
    {
      "name": "salicylic acid",
      "count": 3,
      "products": ["Paula's Choice BHA"],
      "risk_level": "high",
      "category": "exfoliant",
      "risk_description_zh": "需谨慎使用，建议从低浓度开始或咨询专业人士",
      "risk_description_en": "Use with caution, start with low concentration"
    }
  ]
}
```

### 前端改动

#### TypeScript类型
```typescript
interface IngredientSummary {
  name: string;
  count: number;
  products: string[];
  risk_level?: 'high' | 'medium' | 'low';
  category?: string;
  risk_description_zh?: string;
  risk_description_en?: string;
}
```

#### 渲染逻辑
```tsx
{['high', 'medium', 'low'].map((riskLevel) => {
  const filtered = ingredientSummary.filter(
    (ing) => ing.risk_level === riskLevel
  );

  // 为每个风险等级渲染一个卡片
  return <RiskLevelCard ingredients={filtered} />;
})}
```

---

## 📊 排序逻辑

### 新的排序优先级

1. **风险等级优先** (High → Medium → Low)
2. **使用次数其次** (Count 从高到低)

```python
risk_order = {"high": 0, "medium": 1, "low": 2}

enriched.sort(
    key=lambda x: (
        risk_order.get(x["risk_level"], 3),  # 先按风险
        -x.get("count", 0)                    # 再按次数
    )
)
```

### 示例

**Before** (只按count排序):
```
1. water (low) - 10x
2. glycerin (low) - 8x
3. retinol (high) - 6x
4. niacinamide (medium) - 5x
```

**After** (风险优先):
```
⚠️ High Risk:
  1. retinol - 6x

⚡ Medium Risk:
  1. niacinamide - 5x

✓ Low Risk:
  1. water - 10x
  2. glycerin - 8x
```

---

## 🌍 多语言支持

### 风险等级标签

| Risk Level | 中文 | English | Icon |
|------------|------|---------|------|
| High       | 需谨慎 | High Risk | ⚠️ |
| Medium     | 适度使用 | Moderate | ⚡ |
| Low        | 安全 | Low Risk | ✓ |

### 功能分类标签

| Category | 显示 |
|----------|------|
| active | (active) |
| exfoliant | (exfoliant) |
| moisturizer | (moisturizer) |
| antioxidant | (antioxidant) |
| soothing | (soothing) |
| surfactant | (surfactant) |
| preservative | (preservative) |
| fragrance | (fragrance) |
| solvent | (solvent) |
| other | 不显示 |

---

## 🎯 用户价值

### 1. 快速识别风险
**Before**: 需要逐个查看成分，手动判断风险
**After**: 高风险成分在顶部红色区块，一眼看出

### 2. 教育意义
- 用户了解成分功能（括号内标注）
- 理解风险等级的含义
- 学习哪些成分需要注意

### 3. 决策支持
看到高风险成分时：
- ✅ 如果只用1次 → 可能是合理使用
- ⚠️ 如果用3-4次 → 可能需要减少或咨询

---

## 📈 数据洞察

### 统计卡片
```
┌─────────┬─────────┐
│    2    │   15    │
│ 产品总数 │ 成分种类 │
└─────────┴─────────┘
```

### 风险分布
每个风险等级显示成分数量：
```
⚠️ 需谨慎 [2 种]
⚡ 适度使用 [5 种]
✓ 安全 [8 种]
```

用户可以快速了解：
- 当天使用了多少高风险成分
- 是否风险分布合理
- 是否需要调整routine

---

## 🔮 未来扩展

### 短期
- [ ] 添加风险说明tooltip（鼠标悬停显示详细信息）
- [ ] 高风险成分超过阈值时显示警告
- [ ] 导出风险分析报告

### 中期
- [ ] 连接EWG数据库获取更准确的风险评分
- [ ] 个性化风险阈值（敏感肌vs油皮）
- [ ] 成分冲突检测（如：视黄醇+维C）

### 长期
- [ ] AI推荐风险平衡的routine
- [ ] 基于皮肤状态调整风险容忍度
- [ ] 社区评分系统

---

## 🐛 已知限制

1. **风险分类基于关键词匹配**
   - 简化的启发式方法
   - 未来可以连接专业数据库

2. **浓度未考虑**
   - 0.5% salicylic acid vs 2%
   - 风险应该不同，但当前无法区分

3. **个体差异**
   - 某人对niacinamide过敏
   - 当前无法个性化风险评估

---

## 📚 成分风险参考

### 常见高风险成分

**活性成分**：
- Retinol/Tretinoin: 抗衰老，但可能刺激
- Hydroquinone: 强效美白，长期使用有风险

**酸类**：
- Glycolic Acid: AHA，去角质，可能过敏
- Salicylic Acid: BHA，去角质，需控制频率

**香精**：
- Fragrance/Parfum: 常见致敏原
- Essential Oils: 天然但仍可能刺激

**酒精**：
- Alcohol Denat: 快速干燥，可能破坏屏障
- Isopropyl Alcohol: 强效去油，需谨慎

### 安全成分

**保湿剂**：
- Hyaluronic Acid: 温和保湿
- Glycerin: 经典保湿剂
- Ceramide: 修护屏障

**舒缓**：
- Centella Asiatica: 积雪草，舒缓修护
- Niacinamide: 烟酰胺，多功能

**抗氧化**：
- Vitamin E: 温和抗氧化
- Green Tea: 天然抗氧化

---

## ✅ 测试清单

- [x] 高风险成分正确分类
- [x] 中等风险成分正确分类
- [x] 低风险成分正确分类
- [x] 功能分类正确显示
- [x] 颜色编码正确应用
- [x] 风险等级排序正确
- [x] 多语言标签正确
- [x] 移动端响应式布局
- [x] 空状态处理
- [x] 加载状态动画

---

## 🎉 总结

### 改进前
- 只看到"用了什么"
- 无法识别风险
- 需要手动查询每个成分

### 改进后
- 按风险分组展示
- 颜色编码清晰
- 功能标签辅助理解
- 一眼看出需要注意的成分

**核心价值**：从"数据展示"升级为"风险管理工具"！ 🎯
