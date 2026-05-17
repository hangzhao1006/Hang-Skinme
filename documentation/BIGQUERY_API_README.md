# BigQuery Product & Ingredient API

这是 SkinMe AI 项目的产品搜索和成分查询后端 API，使用 BigQuery 作为数据源。

## 📋 目录

- [功能概述](#功能概述)
- [数据结构](#数据结构)
- [环境配置](#环境配置)
- [API 端点](#api-端点)
- [使用示例](#使用示例)
- [本地开发](#本地开发)
- [部署](#部署)

---

## 功能概述

该 API 提供以下核心功能：

1. **产品搜索** - 根据关键词搜索护肤品（按品牌/产品名模糊匹配）
2. **成分查询** - 查询指定产品的完整成分列表及详细信息
3. **成分汇总**（开发中）- 分析多个产品的成分分布和风险评估

---

## 数据结构

### BigQuery 数据集: `skinme`

#### 表结构说明

**1. `products` - 产品表**
```sql
- product_id (STRING): 产品唯一ID
- title (STRING): 产品名称
- brand (STRING): 品牌名称
- url (STRING): EWG 数据库产品链接
- category (STRING): 产品分类（如 "Facial Serum", "Moisturizer"）
```

**2. `ingredients` - 成分表**
```sql
- ingredient_id (STRING): 成分唯一ID
- name_original (STRING): 成分原始名称
- name_normalized (STRING): 成分标准化名称
- function (STRING): 成分功能（如 "humectant", "preservative"）
- risk_level (STRING): 风险等级（low/medium/high）
```

**3. `product_ingredients` - 产品-成分关联表**
```sql
- product_id (STRING): 产品ID（外键）
- ingredient_id (STRING): 成分ID（外键）
- position (INT): 成分在配方中的位置（可选）
```

---

## 环境配置

### 1. GCP 服务账号设置

**步骤：**

1. 在 [GCP Console](https://console.cloud.google.com) 创建服务账号
2. 为服务账号分配以下权限：
   - `BigQuery Data Viewer` - 读取数据
   - `BigQuery Job User` - 执行查询
3. 下载服务账号的 JSON 密钥文件
4. 将密钥文件保存到安全位置（如 `secrets/bigquery-service-account.json`）

### 2. 环境变量配置

在 [docker-compose.yml](../docker-compose.yml#L40-L50) 或本地 `.env` 文件中设置：

```bash
# GCP 配置
GOOGLE_APPLICATION_CREDENTIALS=/secrets/bigquery-service-account.json
GCP_PROJECT_ID=resonant-time-480901-n6
BIGQUERY_DATASET=skinme

# 可选：如果使用不同的项目ID
# GCP_PROJECT_ID=your-project-id
```

### 3. 更新 docker-compose.yml

确保 `skincare-api` 服务包含 BigQuery 相关的环境变量：

```yaml
services:
  skincare-api:
    environment:
      GOOGLE_APPLICATION_CREDENTIALS: /secrets/llm-service-account.json
      GCP_PROJECT_ID: resonant-time-480901-n6  # 添加这一行
      BIGQUERY_DATASET: skinme                  # 添加这一行
      # ... 其他环境变量
```

---

## API 端点

### 1. 产品搜索

**端点:** `GET /api/products/search`

**参数:**
- `q` (string, required): 搜索关键词
- `limit` (int, optional): 返回结果数量，默认 10，最大 100

**示例请求:**
```bash
GET http://localhost:8080/api/products/search?q=niacinamide&limit=5
```

**示例响应:**
```json
{
  "products": [
    {
      "product_id": "prod_12345",
      "title": "Niacinamide 10% + Zinc 1%",
      "brand": "The Ordinary",
      "url": "https://www.ewg.org/skindeep/products/...",
      "category": "Facial Serum"
    }
  ],
  "count": 1
}
```

---

### 2. 按 product_id 查询成分

**端点:** `GET /api/products/{product_id}/ingredients`

**路径参数:**
- `product_id` (string): 产品唯一ID

**示例请求:**
```bash
GET http://localhost:8080/api/products/prod_12345/ingredients
```

**示例响应:**
```json
{
  "product": {
    "product_id": "prod_12345",
    "title": "Sally B's Skin Yummies Peptide Booster Serum",
    "brand": "Sally B's Skin Yummies",
    "url": "https://www.ewg.org/skindeep/products/646470-...",
    "category": "Facial Moisturizer/Treatment"
  },
  "ingredients": [
    {
      "ingredient_id": "ing_001",
      "name_original": "Distilled Water",
      "name_normalized": "water",
      "function": "solvent",
      "risk_level": "low"
    },
    {
      "ingredient_id": "ing_002",
      "name_original": "Hyaluronic Acid",
      "name_normalized": "hyaluronic acid",
      "function": "humectant",
      "risk_level": "low"
    }
  ]
}
```

**错误响应 (404):**
```json
{
  "error": "Product not found"
}
```

---

### 3. 按 URL 查询成分

**端点:** `GET /api/products/ingredients`

**参数:**
- `url` (string, required): EWG 数据库产品链接

**示例请求:**
```bash
GET http://localhost:8080/api/products/ingredients?url=https://www.ewg.org/skindeep/products/646470-...
```

**响应格式:** 与按 product_id 查询相同

---

### 4. 成分汇总（开发中）

**端点:** `POST /api/ingredients/summary`

**状态:** 501 Not Implemented

**计划功能:**
- 分析多个产品的成分分布
- 计算成分出现频率
- 按功能和风险等级统计

---

## 使用示例

### Python 客户端示例

```python
import requests

BASE_URL = "http://localhost:8080"

# 1. 搜索产品
response = requests.get(
    f"{BASE_URL}/api/products/search",
    params={"q": "vitamin c", "limit": 5}
)
products = response.json()["products"]

# 2. 获取第一个产品的成分
if products:
    product_id = products[0]["product_id"]
    response = requests.get(
        f"{BASE_URL}/api/products/{product_id}/ingredients"
    )
    product_data = response.json()

    print(f"Product: {product_data['product']['title']}")
    print(f"Ingredients count: {len(product_data['ingredients'])}")

    for ing in product_data['ingredients']:
        print(f"  - {ing['name_original']} ({ing['risk_level']} risk)")
```

### JavaScript/Fetch 示例

```javascript
// 搜索产品
const searchProducts = async (keyword) => {
  const response = await fetch(
    `http://localhost:8080/api/products/search?q=${encodeURIComponent(keyword)}&limit=10`
  );
  const data = await response.json();
  return data.products;
};

// 获取产品成分
const getProductIngredients = async (productId) => {
  const response = await fetch(
    `http://localhost:8080/api/products/${productId}/ingredients`
  );
  const data = await response.json();
  return data;
};

// 使用示例
searchProducts("retinol").then(products => {
  console.log(`Found ${products.length} products`);

  if (products.length > 0) {
    getProductIngredients(products[0].product_id).then(data => {
      console.log(`Product: ${data.product.title}`);
      console.log(`Ingredients: ${data.ingredients.length}`);
    });
  }
});
```

---

## 本地开发

### 1. 安装依赖

```bash
cd src/api-service
pip install -e .
# 或使用 uv
uv pip install -e .
```

### 2. 设置环境变量

创建 `.env` 文件：
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account.json
export GCP_PROJECT_ID=resonant-time-480901-n6
export BIGQUERY_DATASET=skinme
```

### 3. 运行服务

**方式一：使用 Docker Compose**
```bash
docker-compose up skincare-api
```

**方式二：直接运行**
```bash
cd src/api-service/api-service
python main.py
```

### 4. 测试 API

访问 API 文档：
```
http://localhost:8080/docs
```

测试健康检查：
```bash
curl http://localhost:8080/health
```

测试产品搜索：
```bash
curl "http://localhost:8080/api/products/search?q=moisturizer&limit=3"
```

---

## 部署

### Docker 部署

确保 [docker-compose.yml](../docker-compose.yml) 包含正确的环境变量和 volume 挂载：

```yaml
services:
  skincare-api:
    volumes:
      - ../secrets:/secrets  # 挂载服务账号密钥
    environment:
      GOOGLE_APPLICATION_CREDENTIALS: /secrets/bigquery-service-account.json
      GCP_PROJECT_ID: resonant-time-480901-n6
      BIGQUERY_DATASET: skinme
```

启动服务：
```bash
docker-compose up -d skincare-api
```

---

## 代码结构

```
src/api-service/
├── agent/
│   ├── bigquery_service.py       # BigQuery 服务逻辑（新增）
│   ├── analysis_agent.py         # 皮肤分析代理
│   ├── recommendation_agent.py   # 产品推荐代理
│   └── ...
├── api-service/
│   ├── main.py                   # FastAPI 应用（已添加 BigQuery 端点）
│   └── runner.py
├── pyproject.toml                # 项目依赖（已添加 google-cloud-bigquery）
└── README.md
```

### 新增文件说明

#### `agent/bigquery_service.py`
- **BigQueryService 类**: 封装所有 BigQuery 操作
- **核心方法**:
  - `search_products(query, limit)` - 产品搜索
  - `get_product_ingredients_by_id(product_id)` - 按ID查询成分
  - `get_product_ingredients_by_url(url)` - 按URL查询成分
  - `get_ingredients_summary(product_ids)` - 成分汇总（TODO）

#### `api-service/main.py`（更新）
- 新增 4 个 BigQuery 相关端点
- 导入 `bigquery_service` 模块
- 添加相应的请求/响应模型

---

## 故障排查

### 1. BigQuery 权限错误

**错误信息:**
```
403 Access Denied: BigQuery BigQuery: Permission denied
```

**解决方案:**
- 检查服务账号是否有 `BigQuery Data Viewer` 和 `BigQuery Job User` 权限
- 确认 `GOOGLE_APPLICATION_CREDENTIALS` 路径正确
- 验证密钥文件未损坏

### 2. 找不到表

**错误信息:**
```
404 Not found: Table resonant-time-480901-n6:skinme.products
```

**解决方案:**
- 确认表已在 BigQuery 中创建
- 检查 `BIGQUERY_DATASET` 环境变量是否正确
- 验证项目ID和数据集名称拼写

### 3. 查询超时

**解决方案:**
- 检查 BigQuery 配额限制
- 优化查询（添加索引、减少 JOIN）
- 增加查询超时时间

---

## TODO / 未来改进

- [ ] 实现 `get_ingredients_summary` 成分汇总功能
- [ ] 添加分页支持（offset + limit）
- [ ] 缓存热门搜索结果（Redis）
- [ ] 添加全文搜索（BigQuery SEARCH 函数）
- [ ] 成分风险可视化接口
- [ ] 产品对比功能

---

## 联系方式

如有问题，请联系开发团队或提交 Issue。
