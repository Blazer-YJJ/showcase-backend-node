/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\routes\feedbackRoutes.js
 * @Description: 意见反馈路由
 */

const express = require('express');
const router = express.Router();
const FeedbackController = require('../controllers/feedbackController');
const { userAuth } = require('../middleware/userAuth');
const { adminAuth, anyAdmin } = require('../middleware/adminAuth');
const { validateCreateFeedback, validateQueryParams, validateBatchDelete } = require('../validators/feedbackValidator');
const { uploadFeedbackImage, handleUploadError } = require('../middleware/uploadMiddleware');

// 创建反馈（需要用户认证，支持文件上传）
router.post('/', userAuth, uploadFeedbackImage, handleUploadError, validateCreateFeedback, FeedbackController.createFeedback);

// 获取反馈列表（管理员权限）
router.get('/', adminAuth, anyAdmin, validateQueryParams, FeedbackController.getFeedbacks);

// 获取单个反馈详情（管理员权限）
router.get('/:id', adminAuth, anyAdmin, FeedbackController.getFeedbackById);

// 删除反馈（管理员权限）
router.delete('/:id', adminAuth, anyAdmin, FeedbackController.deleteFeedback);

// 批量删除反馈（管理员权限）
router.post('/batch/delete', adminAuth, anyAdmin, validateBatchDelete, FeedbackController.batchDeleteFeedbacks);

module.exports = router;
