# 精选商品和主推款式接口文档

## 概述

本文档描述了新增的精选商品（explore_selections）和主推款式（main_promotions）模块的API接口。

## 数据库表结构

### 精选商品表 (explore_selections)
- `selection_id` (int, 主键) - 精选ID
- `product_id` (int, 外键) - 商品ID
- `sort_order` (int, 默认0) - 排序
- `created_at` (timestamp) - 创建时间

### 主推款式表 (main_promotions)
- `promotion_id` (int, 主键) - 主推ID
- `product_id` (int, 外键) - 商品ID
- `sort_order` (int, 默认0) - 排序
- `created_at` (timestamp) - 创建时间

## 精选商品接口

### 1. 获取精选商品列表（公开接口）

**请求**
```
GET /api/explore-selections
```

**响应**
```json
{
  "success": true,
  "message": "获取精选商品列表成功",
  "data": {
    "selections": [
      {
        "selection_id": 1,
        "product_id": 1,
        "sort_order": 1,
        "created_at": "2025-01-03T16:50:00.000Z",
        "product_name": "商品名称",
        "product_description": "商品描述",
        "product_price": "99.99",
        "product_tags": "标签1,标签2",
        "category_id": 1,
        "category_name": "分类名称",
        "main_image": "/uploads/products/image.jpg"
      }
    ],
    "total": 1
  }
}
```

### 2. 获取单个精选商品详情（公开接口）

**请求**
```
GET /api/explore-selections/:id
```

**响应**
```json
{
  "success": true,
  "message": "获取精选商品详情成功",
  "data": {
    "selection_id": 1,
    "product_id": 1,
    "sort_order": 1,
    "created_at": "2025-01-03T16:50:00.000Z",
    "product_name": "商品名称",
    "product_description": "商品描述",
    "product_price": "99.99",
    "product_tags": "标签1,标签2",
    "category_id": 1,
    "category_name": "分类名称",
    "main_image": "/uploads/products/image.jpg"
  }
}
```

### 3. 创建精选商品（支持单个和批量，需要管理员权限）

**请求**
```
POST /api/explore-selections
Authorization: Bearer <token>
Content-Type: application/json
```

**单个创建（兼容旧接口）**
```json
{
  "product_id": 1,
  "sort_order": 1
}
```

**批量创建**
```json
{
  "product_ids": [1, 2, 3, 4, 5],
  "sort_order_start": 0
}
```

**参数说明**:
- `product_id` (单个创建) - 商品ID
- `product_ids` (批量创建) - 商品ID数组
- `sort_order` (单个创建) - 排序值
- `sort_order_start` (批量创建) - 起始排序值，默认为0

**单个创建响应**
```json
{
  "success": true,
  "message": "添加精选商品成功",
  "data": {
    "selection_id": 1,
    "product_id": 1,
    "sort_order": 1,
    "created_at": "2025-01-03T16:50:00.000Z",
    "product_name": "商品名称",
    "product_description": "商品描述",
    "product_price": "99.99",
    "product_tags": "标签1,标签2",
    "category_id": 1,
    "category_name": "分类名称",
    "main_image": "/uploads/products/image.jpg"
  }
}
```

**批量创建响应**
```json
{
  "success": true,
  "message": "批量创建精选商品成功",
  "data": {
    "created": [
      {
        "selection_id": 1,
        "product_id": 1,
        "sort_order": 0,
        "created_at": "2025-01-03T16:50:00.000Z",
        "product_name": "商品名称1",
        "product_description": "商品描述1",
        "product_price": "99.99",
        "product_tags": "标签1,标签2",
        "category_id": 1,
        "category_name": "分类名称",
        "main_image": "/uploads/products/image1.jpg"
      }
    ],
    "skipped": [
      {
        "product_id": 2,
        "reason": "该商品已被精选"
      }
    ],
    "total_requested": 5,
    "total_created": 1,
    "total_skipped": 1
  }
}
```

### 4. 更新精选商品排序（需要管理员权限）

**请求**
```
PUT /api/explore-selections/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "sort_order": 2
}
```

**响应**
```json
{
  "success": true,
  "message": "更新精选商品排序成功",
  "data": {
    "selection_id": 1,
    "product_id": 1,
    "sort_order": 2,
    "created_at": "2025-01-03T16:50:00.000Z",
    "product_name": "商品名称",
    "product_description": "商品描述",
    "product_price": "99.99",
    "product_tags": "标签1,标签2",
    "category_id": 1,
    "category_name": "分类名称",
    "main_image": "/uploads/products/image.jpg"
  }
}
```

### 5. 删除精选商品（需要管理员权限）

**请求**
```
DELETE /api/explore-selections/:id
Authorization: Bearer <token>
```

**响应**
```json
{
  "success": true,
  "message": "删除精选商品成功"
}
```

### 6. 批量更新精选商品排序（需要管理员权限）

**请求**
```
POST /api/explore-selections/batch/sort
Authorization: Bearer <token>
Content-Type: application/json

{
  "updates": [
    {
      "selection_id": 1,
      "sort_order": 1
    },
    {
      "selection_id": 2,
      "sort_order": 2
    }
  ]
}
```

**响应**
```json
{
  "success": true,
  "message": "批量更新精选商品排序成功"
}
```

### 7. 获取精选商品统计（需要管理员权限）

**请求**
```
GET /api/explore-selections/admin/stats
Authorization: Bearer <token>
```

**响应**
```json
{
  "success": true,
  "message": "获取精选商品统计成功",
  "data": {
    "total": 10
  }
}
```

## 主推款式接口

### 1. 获取主推款式列表（公开接口）

**请求**
```
GET /api/main-promotions
```

**响应**
```json
{
  "success": true,
  "message": "获取主推款式列表成功",
  "data": {
    "promotions": [
      {
        "promotion_id": 1,
        "product_id": 1,
        "sort_order": 1,
        "created_at": "2025-01-03T16:50:00.000Z",
        "product_name": "商品名称",
        "product_description": "商品描述",
        "product_price": "99.99",
        "product_tags": "标签1,标签2",
        "category_id": 1,
        "category_name": "分类名称",
        "main_image": "/uploads/products/image.jpg"
      }
    ],
    "total": 1
  }
}
```

### 2. 获取单个主推款式详情（公开接口）

**请求**
```
GET /api/main-promotions/:id
```

**响应**
```json
{
  "success": true,
  "message": "获取主推款式详情成功",
  "data": {
    "promotion_id": 1,
    "product_id": 1,
    "sort_order": 1,
    "created_at": "2025-01-03T16:50:00.000Z",
    "product_name": "商品名称",
    "product_description": "商品描述",
    "product_price": "99.99",
    "product_tags": "标签1,标签2",
    "category_id": 1,
    "category_name": "分类名称",
    "main_image": "/uploads/products/image.jpg"
  }
}
```

### 3. 创建主推款式（支持单个和批量，需要管理员权限）

**请求**
```
POST /api/main-promotions
Authorization: Bearer <token>
Content-Type: application/json
```

**单个创建（兼容旧接口）**
```json
{
  "product_id": 1,
  "sort_order": 1
}
```

**批量创建**
```json
{
  "product_ids": [1, 2, 3, 4, 5],
  "sort_order_start": 0
}
```

**参数说明**:
- `product_id` (单个创建) - 商品ID
- `product_ids` (批量创建) - 商品ID数组
- `sort_order` (单个创建) - 排序值
- `sort_order_start` (批量创建) - 起始排序值，默认为0

**单个创建响应**
```json
{
  "success": true,
  "message": "添加主推款式成功",
  "data": {
    "promotion_id": 1,
    "product_id": 1,
    "sort_order": 1,
    "created_at": "2025-01-03T16:50:00.000Z",
    "product_name": "商品名称",
    "product_description": "商品描述",
    "product_price": "99.99",
    "product_tags": "标签1,标签2",
    "category_id": 1,
    "category_name": "分类名称",
    "main_image": "/uploads/products/image.jpg"
  }
}
```

**批量创建响应**
```json
{
  "success": true,
  "message": "批量创建主推款式成功",
  "data": {
    "created": [
      {
        "promotion_id": 1,
        "product_id": 1,
        "sort_order": 0,
        "created_at": "2025-01-03T16:50:00.000Z",
        "product_name": "商品名称1",
        "product_description": "商品描述1",
        "product_price": "99.99",
        "product_tags": "标签1,标签2",
        "category_id": 1,
        "category_name": "分类名称",
        "main_image": "/uploads/products/image1.jpg"
      }
    ],
    "skipped": [
      {
        "product_id": 2,
        "reason": "该商品已被主推"
      }
    ],
    "total_requested": 5,
    "total_created": 1,
    "total_skipped": 1
  }
}
```

### 4. 更新主推款式排序（需要管理员权限）

**请求**
```
PUT /api/main-promotions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "sort_order": 2
}
```

**响应**
```json
{
  "success": true,
  "message": "更新主推款式排序成功",
  "data": {
    "promotion_id": 1,
    "product_id": 1,
    "sort_order": 2,
    "created_at": "2025-01-03T16:50:00.000Z",
    "product_name": "商品名称",
    "product_description": "商品描述",
    "product_price": "99.99",
    "product_tags": "标签1,标签2",
    "category_id": 1,
    "category_name": "分类名称",
    "main_image": "/uploads/products/image.jpg"
  }
}
```

### 5. 删除主推款式（需要管理员权限）

**请求**
```
DELETE /api/main-promotions/:id
Authorization: Bearer <token>
```

**响应**
```json
{
  "success": true,
  "message": "删除主推款式成功"
}
```

### 6. 批量更新主推款式排序（需要管理员权限）

**请求**
```
POST /api/main-promotions/batch/sort
Authorization: Bearer <token>
Content-Type: application/json

{
  "updates": [
    {
      "promotion_id": 1,
      "sort_order": 1
    },
    {
      "promotion_id": 2,
      "sort_order": 2
    }
  ]
}
```

**响应**
```json
{
  "success": true,
  "message": "批量更新主推款式排序成功"
}
```

### 7. 获取主推款式统计（需要管理员权限）

**请求**
```
GET /api/main-promotions/admin/stats
Authorization: Bearer <token>
```

**响应**
```json
{
  "success": true,
  "message": "获取主推款式统计成功",
  "data": {
    "total": 10
  }
}
```

## 错误响应

所有接口在出错时都会返回以下格式的错误响应：

```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息"
}
```

常见错误状态码：
- `400` - 请求参数错误
- `401` - 未授权（需要登录）
- `403` - 权限不足
- `404` - 资源不存在
- `409` - 冲突（如商品已被精选/主推）
- `500` - 服务器内部错误

## 权限说明

- **公开接口**：获取列表和详情接口无需认证
- **管理员接口**：增删改操作需要管理员权限（super或admin级别）
- **认证方式**：使用Bearer Token认证

## 注意事项

1. 每个商品只能被精选一次，不能重复添加
2. 每个商品只能被主推一次，不能重复添加
3. 删除商品时会自动移除相关的精选和主推记录
4. 排序值越小，显示顺序越靠前
5. 所有时间字段使用UTC时间格式
