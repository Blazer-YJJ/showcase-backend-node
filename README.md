# Showcase Backend API

一个基于Node.js和Express的后端服务，提供管理员和用户管理功能。

## 功能特性

- 👥 管理员管理
- 👤 用户管理
- 🔍 健康检查接口
- 🛡️ 安全中间件
- 📝 请求日志记录
- 🔐 身份验证和授权

## 技术栈

- **Node.js** - 运行时环境
- **Express.js** - Web框架
- **MySQL** - 数据库
- **Redis** - 缓存
- **CORS** - 跨域支持
- **Helmet** - 安全头设置
- **JWT** - 身份验证

## 项目结构

```
showcase-backend-node/
├── src/
│   ├── app.js                 # 主应用文件
│   ├── config/
│   │   ├── dbConnection.js    # 数据库配置
│   │   └── redisConnection.js # Redis配置
│   ├── controllers/
│   │   ├── adminController.js # 管理员控制器
│   │   └── userController.js  # 用户控制器
│   ├── middleware/
│   │   ├── errorHandler.js    # 错误处理中间件
│   │   ├── logger.js          # 日志中间件
│   │   └── auth.js            # 身份验证中间件
│   └── routes/
│       ├── index.js           # 基础路由
│       ├── adminRoutes.js     # 管理员路由
│       └── userRoutes.js      # 用户路由
├── package.json
├── .gitignore
└── README.md
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 启动生产服务器

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动

## API接口

### 基础接口

- `GET /` - 欢迎页面
- `GET /health` - 健康检查

### 管理员接口

- `GET /api/admins` - 获取管理员列表
- `GET /api/admins/:id` - 获取单个管理员详情
- `PUT /api/admins/:id` - 更新管理员信息

### 用户接口

- `GET /api/users` - 获取用户列表
- `GET /api/users/:id` - 获取单个用户详情
- `PUT /api/users/:id` - 更新用户信息

### 查询参数

#### 获取管理员列表 (`GET /api/admins`)

- `page` - 页码 (默认: 1)
- `limit` - 每页数量 (默认: 10)
- `level` - 按级别筛选 (如: admin, editor)

#### 获取用户列表 (`GET /api/users`)

- `page` - 页码 (默认: 1)
- `limit` - 每页数量 (默认: 10)
- `status` - 按状态筛选 (如: active, inactive)

## 响应格式

### 成功响应

```json
{
  "success": true,
  "data": [...],
  "total": 3
}
```

### 错误响应

```json
{
  "success": false,
  "error": "错误信息"
}
```

## 环境变量

创建 `.env` 文件配置环境变量：

```env
PORT=3000
NODE_ENV=development

# MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=showcase_db
DB_USER=root
DB_PASSWORD=password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
```

## 开发说明

- 使用 `nodemon` 进行开发时的热重载
- 所有API响应都包含统一的成功/失败标识
- 支持跨域请求
- 包含安全头设置
- 详细的请求日志记录
- 支持MySQL数据库连接池
- 集成Redis缓存
- JWT身份验证和授权

## 许可证

ISC

