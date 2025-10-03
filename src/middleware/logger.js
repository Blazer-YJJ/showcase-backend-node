const morgan = require('morgan');

// 自定义日志格式
const logFormat = ':method :url :status :res[content-length] - :response-time ms';

// 创建日志中间件
const morganLogger = morgan(logFormat, {
  skip: (req, res) => {
    // 跳过健康检查的日志
    return req.url === '/health';
  }
});

// 创建完整的 logger 对象
const logger = {
  // Morgan 中间件
  middleware: morganLogger,
  
  // 日志方法
  error: (...args) => {
    console.error('[ERROR]', ...args);
  },
  
  info: (...args) => {
    console.info('[INFO]', ...args);
  },
  
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },
  
  log: (...args) => {
    console.log('[LOG]', ...args);
  }
};

module.exports = logger;

