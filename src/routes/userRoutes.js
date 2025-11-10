/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-03 05:35:47
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-03 09:10:17
 * @FilePath: \showcase-backend-node\src\routes\userRoutes.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { adminAuth, adminOrAbove } = require('../middleware/adminAuth');
const { userAuth } = require('../middleware/userAuth');

// 用户登录路由（不需要认证）
// POST /api/users/login - 用户登录
router.post('/login', userController.loginUser);

// 用户个人路由（需要用户认证）
// GET /api/users/profile - 获取当前登录用户的会员账号信息
router.get('/profile', userAuth, userController.getMyProfile);

// 用户管理路由（需要管理员认证）
router.use(adminAuth);

// POST /api/users - 创建用户
router.post('/', adminOrAbove, userController.createUser);

// GET /api/users - 获取用户列表（支持分页和筛选）
router.get('/', adminOrAbove, userController.getUsers);

// GET /api/users/:id - 根据ID获取用户
router.get('/:id', adminOrAbove, userController.getUserById);

// PUT /api/users/:id - 更新用户
router.put('/:id', adminOrAbove, userController.updateUser);

// DELETE /api/users/:id - 删除用户
router.delete('/:id', adminOrAbove, userController.deleteUser);

module.exports = router;
