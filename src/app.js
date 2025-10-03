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

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet()); // 安全头
app.use(cors()); // 跨域支持
app.use(logger.middleware); // 自定义日志
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析

// 路由
app.use('/', indexRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/users', userRoutes);

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