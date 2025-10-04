/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-01 00:25:28
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-03 16:09:30
 * @FilePath: \showcase-backend-node\src\routes\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const express = require('express');
const router = express.Router();

// 基础路由
router.get('/', (req, res) => {
  res.json({
    message: 'API路由根目录',
    availableRoutes: [
      'GET /api/admins - 获取管理员列表',
      'GET /api/users - 获取用户列表',
      'GET /api/products - 获取商品列表',
      'POST /api/products/batch/delete - 批量删除商品',
      'POST /api/products/batch/tags - 批量给多个商品添加标签',
      'POST /api/products/batch/create - 批量创建商品（根据图片名自动命名）',
      'GET /api/categories/all - 获取所有分类（无需认证）',
      'GET /api/health - 健康检查'
    ]
  });
});

module.exports = router;

