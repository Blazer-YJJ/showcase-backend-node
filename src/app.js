const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// 导入中间件
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// 导入数据库连接
const dbConnection = require('./config/dbConnection');
const redisConnection = require('./config/redisConnection');

// 导入路由
const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const exploreSelectionRoutes = require('./routes/exploreSelectionRoutes');
const mainPromotionRoutes = require('./routes/mainPromotionRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS配置 - 必须在helmet之前
const corsOptions = {
  origin: function (origin, callback) {
    // 允许所有来源（开发环境）
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};

app.use(cors(corsOptions)); // 跨域支持

// 中间件
app.use(helmet({
  crossOriginResourcePolicy: false, // 禁用CORP策略
  crossOriginEmbedderPolicy: false  // 禁用COEP策略
})); // 安全头
app.use(logger.middleware); // 自定义日志
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析

// 静态文件服务 - 提供uploads目录访问
app.use('/uploads', (req, res, next) => {
  // 设置CORS头
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
}, express.static('uploads', {
  setHeaders: (res, path) => {
    // 为静态文件设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// 专门的静态文件路由（确保CORS正确工作）
app.get('/uploads/*', (req, res, next) => {
  // 设置CORS头
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// 路由
app.use('/', indexRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/explore-selections', exploreSelectionRoutes);
app.use('/api/main-promotions', mainPromotionRoutes);

// 健康检查
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await dbConnection.checkConnection();
    const redisStatus = await redisConnection.ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbStatus ? 'connected' : 'disconnected',
        redis: redisStatus ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    path: req.originalUrl
  });
});

// 错误处理中间件
app.use(errorHandler);

// 初始化数据库和Redis连接
async function initializeConnections() {
  try {
    console.log('🚀 正在启动Showcase Backend服务...');
    console.log('📋 环境:', process.env.NODE_ENV || 'development');
    
    // 初始化MySQL连接
    console.log('🔗 正在连接MySQL数据库...');
    await dbConnection.createPool();
    
    // 初始化Redis连接
    console.log('🔗 正在连接Redis...');
    await redisConnection.connect();
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log('🎉 服务启动完成!');
      console.log(`🌐 服务器运行在: http://localhost:${PORT}`);
      console.log(`📊 健康检查: http://localhost:${PORT}/health`);
      console.log('📝 日志级别:', process.env.LOG_LEVEL || 'info');
    });
    
  } catch (error) {
    console.error('❌ 服务启动失败:', error.message);
    process.exit(1);
  }
}

// 优雅关闭处理
process.on('SIGTERM', async () => {
  console.log('🛑 收到SIGTERM信号，正在优雅关闭服务...');
  await dbConnection.close();
  await redisConnection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 收到SIGINT信号，正在优雅关闭服务...');
  await dbConnection.close();
  await redisConnection.close();
  process.exit(0);
});

// 启动服务
initializeConnections();

module.exports = app;