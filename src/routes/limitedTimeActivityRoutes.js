/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-11 18:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-11 18:30:00
 * @FilePath: \showcase-backend-node\src\routes\limitedTimeActivityRoutes.js
 * @Description: 限时活动路由
 */

const express = require('express');
const router = express.Router();
const LimitedTimeActivityController = require('../controllers/limitedTimeActivityController');
const { adminAuth, anyAdmin } = require('../middleware/adminAuth');
const { 
  validateCreateActivity, 
  validateUpdateActivity, 
  validateQueryParams, 
  validateBatchDelete 
} = require('../validators/limitedTimeActivityValidator');

// 获取限时活动列表（公开接口）
router.get('/', validateQueryParams, LimitedTimeActivityController.getActivities);

// 获取启用的限时活动列表（公开接口）
router.get('/active', LimitedTimeActivityController.getActiveActivities);

// 创建限时活动（管理员权限）
router.post('/', adminAuth, anyAdmin, validateCreateActivity, LimitedTimeActivityController.createActivity);

// 获取单个限时活动详情（公开接口）
router.get('/:id', LimitedTimeActivityController.getActivityById);

// 更新限时活动（管理员权限）
router.put('/:id', adminAuth, anyAdmin, validateUpdateActivity, LimitedTimeActivityController.updateActivity);

// 删除限时活动（管理员权限）
router.delete('/:id', adminAuth, anyAdmin, LimitedTimeActivityController.deleteActivity);

// 批量删除限时活动（管理员权限）
router.post('/batch/delete', adminAuth, anyAdmin, validateBatchDelete, LimitedTimeActivityController.batchDeleteActivities);

module.exports = router;

