/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-01 00:25:46
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-03 05:32:47
 * @FilePath: \showcase-backend-node\src\routes\adminRoutes.js
 * @Description: 管理员路由
 */

const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');

// 管理员登录路由（不需要认证）
// POST /api/admins/login - 管理员登录
router.post('/login', AdminController.login);

// 创建管理员
// POST /api/admins
router.post('/', AdminController.createAdmin);

// 获取管理员列表（支持分页和级别筛选）
// GET /api/admins?page=1&limit=10&level=editor
router.get('/', AdminController.getAdmins);

// 根据ID获取管理员
// GET /api/admins/:id
router.get('/:id', AdminController.getAdminById);

// 更新管理员
// PUT /api/admins/:id
router.put('/:id', AdminController.updateAdmin);

// 删除管理员
// DELETE /api/admins/:id
router.delete('/:id', AdminController.deleteAdmin);

module.exports = router;




