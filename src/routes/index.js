const express = require('express');
const router = express.Router();

// 基础路由
router.get('/', (req, res) => {
  res.json({
    message: 'API路由根目录',
    availableRoutes: [
      'GET /api/admins - 获取管理员列表',
      'GET /api/users - 获取用户列表',
      'GET /api/health - 健康检查'
    ]
  });
});

module.exports = router;

