/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-11 17:00:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-11 17:00:00
 * @FilePath: \showcase-backend-node\src\routes\orderRoutes.js
 * @Description: 订单路由
 */

const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { userAuth } = require('../middleware/userAuth');
const { adminAuth, anyAdmin } = require('../middleware/adminAuth');
const {
  validateCreateOrder,
  validateUpdateOrder,
  validateUpdateOrderStatus,
  validateQueryParams
} = require('../validators/orderValidator');

// ========== 会员接口 ==========

// 创建订单（需要用户认证）
router.post('/', userAuth, validateCreateOrder, OrderController.createOrder);

// 获取当前用户的订单列表（需要用户认证）
router.get('/', userAuth, validateQueryParams, OrderController.getMyOrders);

// 获取订单详情（需要用户认证）
router.get('/:id', userAuth, OrderController.getOrderById);

// 更新订单（需要用户认证）
router.put('/:id', userAuth, validateUpdateOrder, OrderController.updateOrder);

// 删除订单（需要用户认证）
router.delete('/:id', userAuth, OrderController.deleteOrder);

// ========== 管理员接口 ==========

// 获取所有订单列表（管理员权限）
router.get('/admin/list', adminAuth, anyAdmin, validateQueryParams, OrderController.getAllOrders);

// 获取订单详情（管理员权限）
router.get('/admin/:id', adminAuth, anyAdmin, OrderController.getOrderByIdAdmin);

// 更新订单（管理员权限）
router.put('/admin/:id', adminAuth, anyAdmin, validateUpdateOrder, OrderController.updateOrderAdmin);

// 修改订单状态（管理员权限）
router.put('/admin/:id/status', adminAuth, anyAdmin, validateUpdateOrderStatus, OrderController.updateOrderStatus);

// 删除订单（管理员权限）
router.delete('/admin/:id', adminAuth, anyAdmin, OrderController.deleteOrderAdmin);

module.exports = router;

