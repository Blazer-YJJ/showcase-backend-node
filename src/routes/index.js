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
      'GET /api/explore-selections - 获取精选商品列表（公开接口）',
      'POST /api/explore-selections - 添加精选商品（管理员权限）',
      'GET /api/main-promotions - 获取主推款式列表（公开接口）',
      'POST /api/main-promotions - 添加主推款式（管理员权限）',
      'GET /api/announcements - 获取公告列表（公开接口）',
      'GET /api/announcements/active - 获取启用公告列表（公开接口）',
      'POST /api/announcements - 创建公告（管理员权限）',
      'DELETE /api/announcements/:id - 删除公告（管理员权限）',
      'GET /api/health - 健康检查'
    ]
  });
});

module.exports = router;

