// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('错误详情:', err);

  // 默认错误
  let error = { ...err };
  error.message = err.message;

  // Mongoose 错误处理
  if (err.name === 'CastError') {
    const message = '资源未找到';
    error = { message, statusCode: 404 };
  }

  // Mongoose 重复键错误
  if (err.code === 11000) {
    const message = '重复的字段值';
    error = { message, statusCode: 400 };
  }

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || '服务器错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;

