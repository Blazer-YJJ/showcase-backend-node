/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-11-06 00:00:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-11-06 00:00:00
 * @FilePath: \showcase-backend-node\src\routes\orderAfterSaleRoutes.js
 * @Description: 订单售后路由
 */

const express = require('express');
const router = express.Router();
const OrderAfterSaleController = require('../controllers/orderAfterSaleController');
const { userAuth } = require('../middleware/userAuth');
const { adminAuth, anyAdmin } = require('../middleware/adminAuth');
const {
  validateCreateAfterSale,
  validateUpdateAfterSale,
  validateUpdateAfterSaleStatus,
  validateQueryParams
} = require('../validators/orderAfterSaleValidator');

// ========== 会员接口 ==========

// 创建售后（需要用户认证）
router.post('/', userAuth, validateCreateAfterSale, OrderAfterSaleController.createAfterSale);

// 获取当前用户的售后列表（需要用户认证）
router.get('/', userAuth, validateQueryParams, OrderAfterSaleController.getMyAfterSales);

// 获取售后详情（需要用户认证）
router.get('/:id', userAuth, OrderAfterSaleController.getAfterSaleById);

// 更新售后（需要用户认证）
router.put('/:id', userAuth, validateUpdateAfterSale, OrderAfterSaleController.updateAfterSale);

// 删除售后（需要用户认证）
router.delete('/:id', userAuth, OrderAfterSaleController.deleteAfterSale);

// ========== 管理员接口 ==========

// 获取所有售后列表（管理员权限）
router.get('/admin/list', adminAuth, anyAdmin, validateQueryParams, OrderAfterSaleController.getAllAfterSales);

// 获取售后详情（管理员权限）
router.get('/admin/:id', adminAuth, anyAdmin, OrderAfterSaleController.getAfterSaleByIdAdmin);

// 更新售后（管理员权限）
router.put('/admin/:id', adminAuth, anyAdmin, validateUpdateAfterSale, OrderAfterSaleController.updateAfterSaleAdmin);

// 修改售后状态（管理员权限）
router.put('/admin/:id/status', adminAuth, anyAdmin, validateUpdateAfterSaleStatus, OrderAfterSaleController.updateAfterSaleStatus);

// 删除售后（管理员权限）
router.delete('/admin/:id', adminAuth, anyAdmin, OrderAfterSaleController.deleteAfterSaleAdmin);

module.exports = router;

