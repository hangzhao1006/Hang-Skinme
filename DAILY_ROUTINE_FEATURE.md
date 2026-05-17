# 每日护肤记录功能 - Daily Skincare Routine Feature

## ✅ 功能概述 | Feature Overview

**中文：** 用户可以记录每天使用的护肤品和用量，系统会自动分析并统计当天使用的所有成分。数据存储在 GCP Cloud Storage 中。

**English:** Users can track daily skincare products and amounts. The system automatically analyzes and summarizes all ingredients used for the day. Data is stored in GCP Cloud Storage.

---

## 🎯 核心功能 | Core Features

### 1. 日期选择 | Date Selection
- 📅 日历组件选择日期
- 🔄 自动加载选中日期的护肤记录
- 💾 每个日期独立保存

### 2. 产品管理 | Product Management
- **晨间护肤 (Morning Routine)**
  - ➕ 添加产品
  - 🔍 搜索产品（复用 BigQuery 搜索）
  - 📝 记录用量（如 "2滴"、"1泵"）
  - 🗑️ 删除产品

- **晚间护肤 (Evening Routine)**
  - 同上功能

### 3. 成分统计 | Ingredient Summary
- 🧪 显示当天所有产品的成分
- 🔢 统计每种成分出现次数
- 📊 显示成分来源产品
- 🏆 按出现频率排序（前15种）

### 4. 数据持久化 | Data Persistence
- ☁️ 存储在 GCS: `daily_routines/{user_email}/{YYYY-MM-DD}.json`
- 🔐 用户隔离存储
- 📅 按日期组织

---

## 🛠️ 技术实现 | Technical Implementation

### 后端 | Backend

#### 1. [src/api-service/agent/daily_routine_manager.py](src/api-service/agent/daily_routine_manager.py)

**功能：** 管理 GCS 中的每日护肤记录

**核心方法：**

```python
class DailyRoutineManager:
    def save_routine(self, user_identifier: str, date: str, products: List[Dict])
        """保存每日记录到 GCS"""

    def get_routine(self, user_identifier: str, date: str)
        """获取指定日期的记录"""

    def get_routines_range(self, user_identifier: str, start_date: str, end_date: str)
        """获取日期范围内的记录"""

    def delete_routine(self, user_identifier: str, date: str)
        """删除指定日期的记录"""

    def get_ingredient_summary(self, user_identifier: str, date: str, product_ingredients_map: Dict)
        """获取当天的成分统计"""
```

**存储格式：**
```json
{
  "user_identifier": "user@example.com",
  "date": "2025-12-11",
  "products": [
    {
      "product_id": "uuid",
      "product_name": "Vitamin C Serum",
      "brand": "The Ordinary",
      "amount": "3 drops",
      "time": "morning",
      "order": 1
    }
  ],
  "updated_at": "2025-12-11T07:30:00"
}
```

---

#### 2. [src/api-service/api-service/main.py](src/api-service/api-service/main.py)

**新增 API 端点：**

##### (1) 保存每日记录
```http
POST /api/routines/save
```

**Request Body:**
```json
{
  "user_identifier": "user@example.com",
  "date": "2025-12-11",
  "products": [
    {
      "product_id": "prod_123",
      "product_name": "Niacinamide Serum",
      "brand": "The Ordinary",
      "amount": "2 drops",
      "time": "morning",
      "order": 1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Routine saved successfully"
}
```

---

##### (2) 获取指定日期记录
```http
GET /api/routines/{user_identifier}/{date}
```

**Example:**
```http
GET /api/routines/user@example.com/2025-12-11
```

**Response:**
```json
{
  "user_identifier": "user@example.com",
  "date": "2025-12-11",
  "products": [...],
  "updated_at": "2025-12-11T07:30:00"
}
```

---

##### (3) 获取日期范围记录
```http
GET /api/routines/{user_identifier}/range?start_date={date}&end_date={date}
```

**Example:**
```http
GET /api/routines/user@example.com/range?start_date=2025-12-01&end_date=2025-12-31
```

**Response:**
```json
[
  {
    "user_identifier": "user@example.com",
    "date": "2025-12-11",
    "products": [...],
    "updated_at": "2025-12-11T07:30:00"
  },
  {
    "date": "2025-12-10",
    ...
  }
]
```

---

##### (4) 删除记录
```http
DELETE /api/routines/{user_identifier}/{date}
```

**Example:**
```http
DELETE /api/routines/user@example.com/2025-12-11
```

**Response:**
```json
{
  "success": true,
  "message": "Routine deleted successfully"
}
```

---

##### (5) 获取成分统计
```http
GET /api/routines/{user_identifier}/{date}/ingredients
```

**Example:**
```http
GET /api/routines/user@example.com/2025-12-11/ingredients
```

**Response:**
```json
{
  "date": "2025-12-11",
  "total_products": 3,
  "ingredients": [
    {
      "name": "hyaluronic acid",
      "count": 2,
      "products": ["Hydrating Serum", "Moisturizer"]
    },
    {
      "name": "niacinamide",
      "count": 1,
      "products": ["Niacinamide Serum"]
    }
  ]
}
```

---

### 前端 | Frontend

#### 1. [src/frontend/src/app/daily-routine/page.tsx](src/frontend/src/app/daily-routine/page.tsx)

**页面结构：**

```
┌────────────────────────────────────────────────────────┐
│  📅 每日护肤记录                                        │
│  记录每天使用的护肤品和用量，查看成分统计                │
├────────────────────────────────────────────────────────┤
│  📆 [日期选择器: 2025-12-11]  💾 [保存记录]            │
├─────────────────────────────┬──────────────────────────┤
│  🌅 晨间护肤       [添加产品] │  🧪 成分统计              │
│                             │                          │
│  • Vitamin C Serum          │  Hyaluronic Acid  [2x]   │
│    The Ordinary • 3 drops   │  来源：Serum, Moisturizer│
│                       [🗑️]  │                          │
│  • Moisturizer              │  Niacinamide     [1x]    │
│    CeraVe • 1 pump    [🗑️]  │  来源：Serum             │
│                             │                          │
├─────────────────────────────┤  Glycerin        [2x]    │
│  🌙 晚间护肤       [添加产品] │  来源：Serum, Cream      │
│                             │                          │
│  • Retinol Serum            │  ...                     │
│    The Ordinary • 2 drops   │                          │
│                       [🗑️]  │                          │
└─────────────────────────────┴──────────────────────────┘
```

**核心功能实现：**

```typescript
// 状态管理
const [selectedDate, setSelectedDate] = useState<Date>(new Date());
const [routineProducts, setRoutineProducts] = useState<RoutineProduct[]>([]);
const [ingredientSummary, setIngredientSummary] = useState<IngredientSummary[]>([]);

// 加载记录
useEffect(() => {
  if (user?.email) {
    loadRoutine(user.email, format(selectedDate, 'yyyy-MM-dd'));
  }
}, [selectedDate, user]);

// 添加产品
const handleAddProduct = (product: Product, amount: string) => {
  const newProduct: RoutineProduct = {
    product_id: product.id,
    product_name: product.title,
    brand: product.brand,
    amount: amount,
    time: currentTime, // 'morning' or 'evening'
    order: routineProducts.filter(p => p.time === currentTime).length + 1
  };
  setRoutineProducts([...routineProducts, newProduct]);
};

// 保存记录
const handleSaveRoutine = async () => {
  const response = await fetch(`${apiUrl}/api/routines/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_identifier: user.email,
      date: format(selectedDate, 'yyyy-MM-dd'),
      products: routineProducts
    })
  });
  // 重新加载成分统计
  await loadIngredientSummary(user.email, format(selectedDate, 'yyyy-MM-dd'));
};
```

---

#### 2. [src/frontend/src/components/layout/DashboardLayout.tsx](src/frontend/src/components/layout/DashboardLayout.tsx)

**新增侧边栏按钮：**

```tsx
import { Calendar } from 'lucide-react';

{/* Daily Routine Icon */}
<button
  onClick={() => {
    router.push('/daily-routine');
    closeSidebar();
  }}
  className="w-full lg:w-12 lg:h-12 flex items-center justify-center gap-3 py-3 lg:py-0 hover:bg-accent transition-colors mb-3 rounded-lg"
  title={t.dailyRoutine}
>
  <Calendar className="w-5 h-5 text-foreground" />
  <span className="lg:hidden text-sm text-foreground font-medium">
    {t.dailyRoutine}
  </span>
</button>
```

---

#### 3. [src/frontend/src/locales/translations.ts](src/frontend/src/locales/translations.ts)

**新增翻译：**

```typescript
interface Translations {
  // ...
  dailyRoutine: string;
}

export const translations: Record<Language, Translations> = {
  zh: {
    dailyRoutine: "每日护肤",
    // ...
  },
  en: {
    dailyRoutine: "Daily Routine",
    // ...
  },
  es: {
    dailyRoutine: "Rutina Diaria",
    // ...
  },
  vi: {
    dailyRoutine: "Thói quen hàng ngày",
    // ...
  }
};
```

---

## 📊 数据流程 | Data Flow

### 1. 添加产品流程
```
用户点击"添加产品"
  → 打开搜索模态框
  → 搜索产品 (GET /api/products/search)
  → 选择产品 + 输入用量
  → 添加到前端状态 (routineProducts)
  → 点击"保存记录"
  → POST /api/routines/save
  → 存储到 GCS
```

### 2. 查看成分统计流程
```
选择日期
  → GET /api/routines/{user}/{date}
  → 加载产品列表
  → GET /api/routines/{user}/{date}/ingredients
  → 后端查询 BigQuery 获取每个产品的成分
  → 聚合成分（计数 + 来源产品）
  → 返回统计结果
  → 前端显示
```

---

## 🗂️ GCS 存储结构 | GCS Storage Structure

```
hang-skincare/
└── daily_routines/
    ├── user_at_example_com/
    │   ├── 2025-12-10.json
    │   ├── 2025-12-11.json
    │   └── 2025-12-12.json
    └── alice_at_example_com/
        ├── 2025-12-11.json
        └── 2025-12-12.json
```

**文件命名规则：**
- Email 中的 `@` 替换为 `_at_`
- `.` 替换为 `_`
- 日期格式：`YYYY-MM-DD.json`

---

## 🚀 使用流程 | Usage Flow

### 用户操作步骤：

1. **进入页面**
   - 点击侧边栏 📅 图标
   - 进入每日护肤记录页面

2. **选择日期**
   - 点击日期选择器
   - 选择要记录的日期
   - 系统自动加载该日期的记录（如果有）

3. **添加晨间产品**
   - 点击"晨间护肤"下的"添加产品"
   - 搜索产品（如 "Vitamin C Serum"）
   - 点击产品，输入用量（如 "3 drops"）
   - 产品添加到晨间列表

4. **添加晚间产品**
   - 点击"晚间护肤"下的"添加产品"
   - 同上操作

5. **保存记录**
   - 点击"保存记录"按钮
   - 数据存储到 GCS
   - 自动生成成分统计

6. **查看成分统计**
   - 右侧显示当天所有产品的成分
   - 查看成分出现次数和来源

7. **管理产品**
   - 点击 🗑️ 图标删除产品
   - 重新保存更新记录

---

## 🎨 界面特性 | UI Features

### 响应式设计
- **桌面端 (≥1024px)**：左右分栏，晨间/晚间/成分统计三列
- **移动端 (<1024px)**：单列堆叠布局

### 视觉反馈
- 🔄 加载状态：Spinner 动画
- ✅ 保存成功：自动刷新成分统计
- ❌ 错误提示：红色警告卡片
- 🎯 悬停效果：产品卡片高亮

### 交互优化
- 📅 日历弹窗选择日期
- 🔍 搜索模态框（复用成分分析功能）
- 💬 用户输入用量（浏览器原生 prompt）
- ⌨️ 键盘支持：Enter 搜索

---

## 🔧 技术细节 | Technical Details

### 数据类型定义

```typescript
interface RoutineProduct {
  product_id: string;
  product_name: string;
  brand: string;
  amount: string;        // 用户输入，如 "2 drops", "1 pump"
  time: 'morning' | 'evening';
  order: number;         // 使用顺序
}

interface IngredientSummary {
  name: string;          // 成分名称
  count: number;         // 出现次数
  products: string[];    // 来源产品列表
}
```

### 后端 Pydantic 模型

```python
class RoutineProductModel(BaseModel):
    product_id: str
    product_name: str
    brand: str
    amount: str
    time: str  # "morning" or "evening"
    order: int

class SaveRoutineRequest(BaseModel):
    user_identifier: str
    date: str  # YYYY-MM-DD
    products: List[RoutineProductModel]
```

---

## 📝 API 响应示例 | API Response Examples

### 成分统计响应
```json
{
  "date": "2025-12-11",
  "total_products": 5,
  "ingredients": [
    {
      "name": "water",
      "count": 5,
      "products": [
        "Vitamin C Serum",
        "Moisturizer",
        "Retinol Serum",
        "Cleanser",
        "Toner"
      ]
    },
    {
      "name": "hyaluronic acid",
      "count": 2,
      "products": [
        "Vitamin C Serum",
        "Moisturizer"
      ]
    },
    {
      "name": "niacinamide",
      "count": 1,
      "products": [
        "Toner"
      ]
    }
  ]
}
```

---

## 🐛 已知限制 | Known Limitations

1. **用量输入**
   - 使用浏览器原生 `prompt()`，体验一般
   - 后续可改为自定义输入框

2. **成分查询性能**
   - 需要为每个产品查询 BigQuery
   - 多产品时可能较慢
   - 已添加缓存逻辑（产品成分映射）

3. **批量操作**
   - 暂不支持批量添加/删除
   - 需要逐个操作

4. **数据同步**
   - 仅在点击"保存"时上传
   - 离线模式暂不支持

---

## 🔮 未来优化 | Future Improvements

### 短期优化
- [ ] 自定义用量输入组件（替换 prompt）
- [ ] 拖拽排序产品顺序
- [ ] 批量添加/删除功能
- [ ] 自动保存（防止数据丢失）

### 中期优化
- [ ] 产品模板（快速添加常用组合）
- [ ] 每周/每月成分趋势分析
- [ ] 成分冲突警告
- [ ] 导出为 PDF/Excel

### 长期优化
- [ ] AI 推荐最佳使用顺序
- [ ] 与日历天气联动（根据天气调整建议）
- [ ] 社交功能（分享护肤记录）
- [ ] 成分过敏追踪

---

## ✅ 测试清单 | Testing Checklist

### 功能测试
- [ ] 添加晨间产品
- [ ] 添加晚间产品
- [ ] 删除产品
- [ ] 保存记录
- [ ] 切换日期加载记录
- [ ] 查看成分统计
- [ ] 删除记录

### 边界情况
- [ ] 空记录（新日期）
- [ ] 单个产品
- [ ] 大量产品（>20）
- [ ] 特殊字符用量输入
- [ ] 网络错误处理

### 用户体验
- [ ] 移动端响应式布局
- [ ] 加载状态显示
- [ ] 错误提示
- [ ] 多语言支持

---

## 📚 相关文档 | Related Documentation

- [BigQuery API 文档](./BIGQUERY_API_README.md)
- [成分分析功能](./INGREDIENT_ANALYSIS_FRONTEND.md)
- [前端架构](./FRONTEND_README.md)
- [数据版本控制](./DATA_VERSIONING_README.md)

---

## 🎉 完成状态 | Completion Status

- ✅ 后端 API 实现
- ✅ GCS 存储管理
- ✅ 前端页面开发
- ✅ 侧边栏集成
- ✅ 多语言支持（中/英/西/越）
- ✅ Docker 容器构建
- ⏳ 用户测试
- ⏳ 性能优化

---

**祝使用愉快！** 🌟
**Happy Tracking!** 🎊
