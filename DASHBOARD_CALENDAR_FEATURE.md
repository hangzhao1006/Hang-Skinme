# 📅 Dashboard 日历快速记录功能 - Dashboard Calendar Quick Log

## 🎯 功能概述

在 Dashboard 主页面添加了一个完整的日历widget，用户可以：
1. **可视化查看当月记录** - 带蓝点标记的日期表示已有记录
2. **一键快速记录** - 点击任意日期即可打开产品搜索模态框
3. **即时查看当日产品** - 选中日期后右侧显示该日期的护肤产品
4. **完整的搜索和保存流程** - 无需离开 Dashboard 即可完成记录

---

## ✨ 主要特性

### 1. 日历Widget 📅

**位置**: Dashboard 页面 Stats Cards 之后
**布局**: 左右两栏布局（md:grid-cols-2）

**左栏 - 日历**:
- 显示当月日历
- 蓝点标记已有记录的日期
- 点击日期自动打开产品搜索模态框
- 月份切换时自动加载新月份数据

**右栏 - 日期详情**:
- 显示选中的日期
- 列出该日期的所有产品（早/晚）
- 显示产品数量统计
- "添加产品"按钮

### 2. 产品搜索模态框 🔍

**功能**:
- 时间段选择（早上/晚上）
- 产品搜索（支持回车键搜索）
- 搜索结果列表（点击即可添加）
- 已添加产品列表（可删除）
- 保存/取消按钮

**特点**:
- 全屏遮罩层（z-50）
- 响应式设计（max-w-2xl）
- 最大高度限制（max-h-[80vh]）
- 内容区域可滚动

---

## 🎨 UI 设计

### 日历Widget

```
┌──────────────────────────────────────────────────────┐
│  📅 快速记录护肤                                      │
├──────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌──────────────────────────┐ │
│  │   December 2025 │    │  选中日期                 │ │
│  │                 │    │  December 12, 2025        │ │
│  │  Su Mo Tu We Th │    │                           │ │
│  │   1  2• 3  4  5 │    │  当日产品 (共 2 个)      │ │
│  │   8  9 10•11 12 │    │  ┌─────────────────────┐ │ │
│  │  15 16 17 18 19 │    │  │ CeraVe Cleanser     │ │ │
│  │  22 23 24 25 26 │    │  │ CeraVe • 🌅 • 2 pumps│ │
│  │  29 30 31       │    │  └─────────────────────┘ │ │
│  └─────────────────┘    │  ┌─────────────────────┐ │ │
│                         │  │ Retinol Serum        │ │ │
│                         │  │ The Ordinary • 🌙 • 3 drops│
│                         │  └─────────────────────┘ │ │
│                         │                           │ │
│                         │  [+ 添加产品]             │ │
│                         └──────────────────────────┘ │
└──────────────────────────────────────────────────────┘

• = 蓝点标记（该日期有记录）
```

### 产品搜索模态框

```
┌──────────────────────────────────────────────┐
│  添加产品                          [X]        │
│  December 12, 2025                           │
├──────────────────────────────────────────────┤
│  时间段                                       │
│  [🌅 早上]  [🌙 晚上]                        │
│                                              │
│  搜索产品                                     │
│  [输入产品名称、品牌...        ] [🔍]        │
│                                              │
│  搜索结果                                     │
│  ┌────────────────────────────────────────┐ │
│  │ CeraVe Hydrating Cleanser             │ │
│  │ CeraVe                                │ │
│  └────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────┐ │
│  │ CeraVe Moisturizing Cream             │ │
│  │ CeraVe                                │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  已添加 (1)                                  │
│  ┌────────────────────────────────────────┐ │
│  │ CeraVe Hydrating Cleanser         [🗑️] │ │
│  │ CeraVe • 1 application                │ │
│  └────────────────────────────────────────┘ │
│                                              │
├──────────────────────────────────────────────┤
│         [取消]              [保存]            │
└──────────────────────────────────────────────┘
```

---

## 🛠️ 技术实现

### 文件修改

**[dashboard/page.tsx](src/frontend/src/app/dashboard/page.tsx)**

### 1. 导入

```typescript
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Search, Loader2, X, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
```

### 2. 类型定义

```typescript
interface Product {
    id: string;
    title: string;
    brand: string;
    url: string;
}

interface RoutineProduct {
    product_id: string;
    product_name: string;
    brand: string;
    amount: string;
    time: 'morning' | 'evening';
    order: number;
}

interface RoutineData {
    user_identifier: string;
    date: string;
    products: RoutineProduct[];
    updated_at: string;
}
```

### 3. 状态管理

```typescript
// Calendar states
const [selectedDate, setSelectedDate] = useState<Date>(new Date());
const [datesWithRoutines, setDatesWithRoutines] = useState<Set<string>>(new Set());
const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

// Product search states
const [showProductModal, setShowProductModal] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState<Product[]>([]);
const [isSearching, setIsSearching] = useState(false);

// Routine states
const [routineProducts, setRoutineProducts] = useState<RoutineProduct[]>([]);
const [currentTime, setCurrentTime] = useState<'morning' | 'evening'>('morning');
const [isSaving, setIsSaving] = useState(false);
```

### 4. 数据加载

```typescript
// Load dates with routines when month changes
useEffect(() => {
    if (user?.email) {
        loadMonthRoutines(user.email, currentMonth);
    }
}, [currentMonth, user]);

// Load routine when date changes
useEffect(() => {
    if (user?.email) {
        loadRoutine(user.email, format(selectedDate, 'yyyy-MM-dd'));
    }
}, [selectedDate, user]);

// Load month routines
const loadMonthRoutines = async (email: string, month: Date) => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const response = await fetch(
        `${apiUrl}/api/routines/${email}/range?start_date=${format(firstDay, 'yyyy-MM-dd')}&end_date=${format(lastDay, 'yyyy-MM-dd')}`
    );

    const data = await response.json();
    const dates = new Set(data.routines.map((r: RoutineData) => r.date));
    setDatesWithRoutines(dates);
};
```

### 5. 日历组件

```tsx
<Calendar
    mode="single"
    selected={selectedDate}
    onSelect={(date) => {
        if (date) {
            setSelectedDate(date);
            setShowProductModal(true);  // 自动打开搜索模态框
            setCurrentTime('morning');
        }
    }}
    onMonthChange={(month) => setCurrentMonth(month)}
    modifiers={{
        hasRoutine: Array.from(datesWithRoutines).map(
            (dateStr) => new Date(dateStr + 'T00:00:00')
        ),
    }}
    modifiersClassNames={{
        hasRoutine: 'has-routine-marker',  // 使用全局CSS标记
    }}
    className="rounded-lg border"
/>
```

### 6. 产品搜索和保存

```typescript
// Search products
const handleSearch = async () => {
    const response = await fetch(
        `${apiUrl}/api/products/search?q=${encodeURIComponent(searchQuery)}&limit=50`
    );
    const data = await response.json();
    setSearchResults(data.products || []);
};

// Add product
const handleAddProduct = (product: Product, amount: string) => {
    const newProduct: RoutineProduct = {
        product_id: product.id,
        product_name: product.title,
        brand: product.brand,
        amount: amount || '1 application',
        time: currentTime,
        order: routineProducts.filter((p) => p.time === currentTime).length + 1,
    };
    setRoutineProducts([...routineProducts, newProduct]);
};

// Save routine
const handleSaveRoutine = async () => {
    await fetch(`${apiUrl}/api/routines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_identifier: user.email,
            date: format(selectedDate, 'yyyy-MM-dd'),
            products: routineProducts,
        }),
    });

    // Reload month data to update calendar markers
    await loadMonthRoutines(user.email, currentMonth);
    setShowProductModal(false);
};
```

---

## 🔄 工作流程

### 用户操作流程

```
打开 Dashboard
  ↓
看到日历Widget（当月数据已加载）
  ↓
点击某个日期
  ↓
【自动触发】
├─ 加载该日期的产品 → 显示在右侧
└─ 打开产品搜索模态框
  ↓
选择时间段（早上/晚上）
  ↓
搜索产品
  ↓
点击搜索结果添加产品
  ↓
查看已添加列表（可删除）
  ↓
点击"保存"
  ↓
【自动触发】
├─ 保存到 API
├─ 重新加载当月数据
├─ 更新日历标记
└─ 关闭模态框
```

### 数据流

```
Component Mount
  ↓
loadMonthRoutines()
  ↓
GET /api/routines/{user}/range?start_date=...&end_date=...
  ↓
setDatesWithRoutines(dates)
  ↓
Calendar 组件渲染（带蓝点标记）

User Clicks Date
  ↓
setSelectedDate(date)
  ↓
loadRoutine(email, date)
  ↓
GET /api/routines/{user}/{date}
  ↓
setRoutineProducts(products)
  ↓
显示产品列表

User Searches
  ↓
handleSearch()
  ↓
GET /api/products/search?q=...&limit=50
  ↓
setSearchResults(products)

User Saves
  ↓
handleSaveRoutine()
  ↓
POST /api/routines
  ↓
loadMonthRoutines() (reload)
  ↓
更新日历标记
```

---

## 📊 API 使用

### 1. 获取月度记录范围

```http
GET /api/routines/{user_identifier}/range?start_date=2025-12-01&end_date=2025-12-31
```

**响应**:
```json
{
  "routines": [
    {
      "user_identifier": "user@example.com",
      "date": "2025-12-05",
      "products": [...],
      "updated_at": "2025-12-05T10:30:00"
    }
  ],
  "count": 15
}
```

### 2. 获取单日记录

```http
GET /api/routines/{user_identifier}/2025-12-12
```

**响应**:
```json
{
  "user_identifier": "user@example.com",
  "date": "2025-12-12",
  "products": [
    {
      "product_id": "123",
      "product_name": "CeraVe Cleanser",
      "brand": "CeraVe",
      "amount": "2 pumps",
      "time": "morning",
      "order": 1
    }
  ],
  "updated_at": "2025-12-12T08:00:00"
}
```

### 3. 搜索产品

```http
GET /api/products/search?q=cerave&limit=50
```

**响应**:
```json
{
  "products": [
    {
      "id": "123",
      "title": "CeraVe Hydrating Cleanser",
      "brand": "CeraVe",
      "url": "https://..."
    }
  ],
  "count": 20
}
```

### 4. 保存记录

```http
POST /api/routines
Content-Type: application/json

{
  "user_identifier": "user@example.com",
  "date": "2025-12-12",
  "products": [
    {
      "product_id": "123",
      "product_name": "CeraVe Cleanser",
      "brand": "CeraVe",
      "amount": "2 pumps",
      "time": "morning",
      "order": 1
    }
  ]
}
```

---

## 🎯 与 daily-routine 页面的区别

| 特性 | Dashboard | Daily Routine |
|------|-----------|---------------|
| **位置** | 主页面 | 专门页面 |
| **布局** | 左右两栏（日历+详情） | 垂直布局（日期选择器+早晚routine+成分统计） |
| **重点** | 快速查看和记录 | 详细管理和分析 |
| **日历** | 完整月视图 | Popover日期选择器 |
| **产品列表** | 简化显示（只读） | 可编辑、可排序、可删除 |
| **成分分析** | 无 | 有（按风险等级分组） |
| **适用场景** | 日常快速记录 | 深度管理和分析 |

---

## 💡 用户价值

### 1. 快速访问 ⚡
- 无需导航到专门页面
- Dashboard 一眼看到当月记录情况
- 点击即可添加

### 2. 可视化概览 📊
- 月视图日历清晰展示记录密度
- 蓝点标记一目了然
- 当日产品即时预览

### 3. 简化流程 🎯
- 减少页面跳转
- 一个模态框完成所有操作
- 保存后自动更新标记

### 4. 上下文保持 📍
- 不离开 Dashboard
- 统计卡片和历史记录仍可见
- 减少认知负担

---

## 🎨 UI/UX 优化细节

### 1. 视觉反馈
- 日历标记（蓝点）使用主题色
- 选中日期高亮
- 搜索时加载动画
- 保存时禁用按钮

### 2. 响应式设计
- 桌面：左右两栏布局
- 移动：垂直堆叠
- 模态框自适应屏幕

### 3. 键盘友好
- 回车键搜索
- ESC键关闭模态框（可扩展）

### 4. 数据状态
- 空状态提示
- 加载状态显示
- 错误处理

---

## 🔮 未来扩展

### 短期
- [ ] 支持拖拽产品到日历日期
- [ ] 日历热力图（颜色深度表示产品数量）
- [ ] 快速复制前一天的routine

### 中期
- [ ] 日历上显示产品图标
- [ ] 周视图切换
- [ ] 批量编辑多天记录

### 长期
- [ ] AI 推荐最佳记录时间
- [ ] 习惯分析（连续记录天数）
- [ ] 导出为日历事件（iCal）

---

## 🐛 故障排查

### 问题 1: 日历标记不显示

**检查**:
```bash
# 1. 确认API返回数据
curl "http://localhost:8080/api/routines/user@example.com/range?start_date=2025-12-01&end_date=2025-12-31"

# 2. 检查浏览器控制台
# 应该看到 datesWithRoutines Set

# 3. 确认CSS类正确应用
# 检查元素是否有 .has-routine-marker 类
```

### 问题 2: 点击日期不打开模态框

**原因**: onSelect回调没有正确触发

**修复**:
```tsx
onSelect={(date) => {
  console.log('Date selected:', date);  // 调试日志
  if (date) {
    setSelectedDate(date);
    setShowProductModal(true);
  }
}}
```

### 问题 3: 模态框背景滚动

**修复**: 添加 `overflow-hidden` 到 body

```tsx
useEffect(() => {
  if (showProductModal) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'unset';
  }
  return () => {
    document.body.style.overflow = 'unset';
  };
}, [showProductModal]);
```

---

## ✅ 测试清单

- [x] 日历正确显示当月
- [x] 蓝点标记已有记录的日期
- [x] 点击日期打开模态框
- [x] 切换月份重新加载数据
- [x] 右侧显示当日产品
- [x] 产品搜索功能正常
- [x] 添加产品到列表
- [x] 删除产品功能
- [x] 保存routine成功
- [x] 保存后更新日历标记
- [x] 响应式布局正常
- [x] 多语言支持（中/英）

---

## 📚 相关文档

- [日历产品搜索功能](./CALENDAR_PRODUCT_SEARCH.md) - daily-routine页面的日历实现
- [每日护肤记录](./DAILY_ROUTINE_FEATURE.md) - 完整的routine管理功能
- [成分风险可视化](./INGREDIENT_RISK_VISUALIZATION.md) - 成分分析功能

---

## 🎉 总结

### 核心价值

**从"功能入口"到"快捷面板"** 🚀

Dashboard不再只是统计展示，而是成为：
- ✅ 快速记录入口
- ✅ 月度可视化概览
- ✅ 一站式操作中心

### 技术亮点

- ✅ 复用现有日历组件和API
- ✅ 模态框设计遵循最佳实践
- ✅ 状态管理清晰
- ✅ 响应式布局完善

**提升用户留存率的关键功能！** 💎
