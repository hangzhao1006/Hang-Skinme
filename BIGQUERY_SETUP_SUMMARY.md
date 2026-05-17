# BigQuery API 后端搭建总结

## 📝 已完成的工作

### 1. 新增文件

#### ✅ `src/api-service/agent/bigquery_service.py`
完整的 BigQuery 服务模块，包含：
- `BigQueryService` 类：封装所有 BigQuery 操作
- 产品搜索功能：`search_products(query, limit)`
- 按ID查询成分：`get_product_ingredients_by_id(product_id)`
- 按URL查询成分：`get_product_ingredients_by_url(url)`
- 成分汇总（预留）：`get_ingredients_summary(product_ids)` - TODO

#### ✅ `documentation/BIGQUERY_API_README.md`
完整的 API 使用文档，包含：
- 功能概述和数据结构说明
- 环境配置指南
- API 端点文档和示例
- 本地开发和部署指南
- 故障排查和常见问题

#### ✅ `src/api-service/test_bigquery.py`
BigQuery 连接测试脚本：
- 测试数据库连接
- 测试产品搜索
- 测试成分查询

---

### 2. 更新的文件

#### ✅ `src/api-service/api-service/main.py`
新增 4 个 BigQuery API 端点：
1. `GET /api/products/search` - 产品搜索
2. `GET /api/products/{product_id}/ingredients` - 按ID查询成分
3. `GET /api/products/ingredients?url=...` - 按URL查询成分
4. `POST /api/ingredients/summary` - 成分汇总（501 Not Implemented）

#### ✅ `src/api-service/pyproject.toml`
添加依赖：
```toml
"google-cloud-bigquery>=3.11.0"
```

---

## 🚀 快速开始

### 步骤 1: 设置 GCP 服务账号

1. 在 GCP Console 创建服务账号
2. 分配权限：
   - `BigQuery Data Viewer`
   - `BigQuery Job User`
3. 下载 JSON 密钥文件到 `secrets/` 目录

### 步骤 2: 配置环境变量

在 [docker-compose.yml](docker-compose.yml) 的 `skincare-api` 服务中添加：

```yaml
environment:
  # 现有变量...
  GCP_PROJECT_ID: resonant-time-480901-n6
  BIGQUERY_DATASET: skinme
  # GOOGLE_APPLICATION_CREDENTIALS 已存在
```

### 步骤 3: 重新构建并启动服务

```bash
# 重新构建 Docker 镜像（安装新依赖）
docker-compose build skincare-api

# 启动服务
docker-compose up skincare-api
```

### 步骤 4: 测试 API

**方式一：使用测试脚本**
```bash
docker exec -it skincare-api python test_bigquery.py
```

**方式二：使用 curl**
```bash
# 产品搜索
curl "http://localhost:8080/api/products/search?q=moisturizer&limit=3"

# 查询成分（需要先搜索获取 product_id）
curl "http://localhost:8080/api/products/{product_id}/ingredients"
```

**方式三：访问 API 文档**
```
http://localhost:8080/docs
```

---

## 📊 API 端点速览

### 1. 产品搜索
```http
GET /api/products/search?q={keyword}&limit={number}
```

**示例响应：**
```json
{
  "products": [
    {
      "product_id": "prod_123",
      "title": "Vitamin C Serum",
      "brand": "The Ordinary",
      "url": "https://...",
      "category": "Facial Serum"
    }
  ],
  "count": 1
}
```

### 2. 成分查询（按ID）
```http
GET /api/products/{product_id}/ingredients
```

**示例响应：**
```json
{
  "product": {
    "product_id": "prod_123",
    "title": "Vitamin C Serum",
    "brand": "The Ordinary",
    "url": "https://...",
    "category": "Facial Serum"
  },
  "ingredients": [
    {
      "ingredient_id": "ing_001",
      "name_original": "Water",
      "name_normalized": "water",
      "function": "solvent",
      "risk_level": "low"
    }
  ]
}
```

### 3. 成分查询（按URL）
```http
GET /api/products/ingredients?url={product_url}
```

### 4. 成分汇总（开发中）
```http
POST /api/ingredients/summary
```
**状态：** 501 Not Implemented

---

## 🔧 代码结构

```
src/api-service/
├── agent/
│   ├── bigquery_service.py          ← 新增：BigQuery 服务
│   ├── analysis_agent.py
│   ├── recommendation_agent.py
│   └── ...
├── api-service/
│   ├── main.py                       ← 更新：添加 BigQuery 端点
│   └── runner.py
├── pyproject.toml                    ← 更新：添加 BigQuery 依赖
├── test_bigquery.py                  ← 新增：测试脚本
└── README.md

documentation/
└── BIGQUERY_API_README.md            ← 新增：完整文档
```

---

## ⚙️ 环境变量说明

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `GOOGLE_APPLICATION_CREDENTIALS` | - | 服务账号 JSON 密钥路径 |
| `GCP_PROJECT_ID` | `resonant-time-480901-n6` | GCP 项目 ID |
| `BIGQUERY_DATASET` | `skinme` | BigQuery 数据集名称 |

---

## 🧪 测试

### 运行测试脚本
```bash
# 在 Docker 容器内
docker exec -it skincare-api python test_bigquery.py

# 或者本地运行
cd src/api-service
python test_bigquery.py
```

### 预期输出
```
╔==========================================================╗
║          BigQuery Service Test Suite                    ║
╚==========================================================╝

Project ID: resonant-time-480901-n6
Dataset: skinme
Credentials: /secrets/llm-service-account.json

============================================================
Testing BigQuery Connection...
============================================================
✅ BigQuery connection successful!

============================================================
Testing Product Search...
============================================================

Searching for: 'moisturizer'
✅ Found 3 products:
  1. Advanced Night Repair Moisturizer
     Brand: Estée Lauder
     Category: Facial Moisturizer
...
```

---

## 📋 BigQuery 表结构要求

确保 BigQuery 中有以下表结构：

### `skinme.products`
```sql
CREATE TABLE skinme.products (
  product_id STRING,
  title STRING,
  brand STRING,
  url STRING,
  category STRING
);
```

### `skinme.ingredients`
```sql
CREATE TABLE skinme.ingredients (
  ingredient_id STRING,
  name_original STRING,
  name_normalized STRING,
  function STRING,
  risk_level STRING
);
```

### `skinme.product_ingredients`
```sql
CREATE TABLE skinme.product_ingredients (
  product_id STRING,
  ingredient_id STRING,
  position INT64
);
```

---

## 🐛 故障排查

### 问题 1: 权限错误
```
403 Access Denied: BigQuery BigQuery: Permission denied
```

**解决方案：**
- 检查服务账号权限（需要 `BigQuery Data Viewer` + `BigQuery Job User`）
- 确认 `GOOGLE_APPLICATION_CREDENTIALS` 路径正确

### 问题 2: 表不存在
```
404 Not found: Table resonant-time-480901-n6:skinme.products
```

**解决方案：**
- 确认表已在 BigQuery 中创建
- 检查 `BIGQUERY_DATASET` 环境变量

### 问题 3: 依赖未安装
```
ModuleNotFoundError: No module named 'google.cloud.bigquery'
```

**解决方案：**
```bash
# 重新构建 Docker 镜像
docker-compose build skincare-api

# 或手动安装
pip install google-cloud-bigquery>=3.11.0
```

---

## 📚 相关文档

- 详细 API 文档：[documentation/BIGQUERY_API_README.md](documentation/BIGQUERY_API_README.md)
- Docker Compose 配置：[docker-compose.yml](docker-compose.yml)
- 项目依赖：[src/api-service/pyproject.toml](src/api-service/pyproject.toml)

---

## ✅ 验证清单

在开始使用之前，请确认：

- [ ] GCP 服务账号已创建并下载密钥
- [ ] 服务账号有 BigQuery 相关权限
- [ ] 密钥文件保存在 `secrets/` 目录
- [ ] `docker-compose.yml` 包含 `GCP_PROJECT_ID` 和 `BIGQUERY_DATASET`
- [ ] BigQuery 中有 `products`, `ingredients`, `product_ingredients` 表
- [ ] 表中有测试数据
- [ ] Docker 容器已重新构建
- [ ] 测试脚本运行成功

---

## 🎯 下一步

现在你可以：

1. **前端集成** - 在前端调用新的 API 端点
2. **实现成分汇总** - 完成 `get_ingredients_summary` 功能
3. **添加缓存** - 使用 Redis 缓存热门搜索
4. **性能优化** - 添加分页、索引等
5. **监控和日志** - 添加更详细的日志和错误追踪

祝开发顺利！🚀
