/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\routes\announcementRoutes.js
 * @Description: 公告信息路由
 */

const express = require('express');
const router = express.Router();

// 导入控制器
const AnnouncementController = require('../controllers/announcementController');

// 导入中间件
const { adminAuth, anyAdmin } = require('../middleware/adminAuth');

// 导入验证器
const {
  validateCreateAnnouncement,
  validateUpdateAnnouncement,
  validateToggleStatus,
  validateBatchDelete,
  validateQueryParams
} = require('../validators/announcementValidator');

// 公开接口（无需认证）
// 获取启用的公告列表
router.get('/', validateQueryParams, AnnouncementController.getAnnouncements);

// 获取单个公告详情（只返回启用的公告）
router.get('/:id', AnnouncementController.getAnnouncement);

// 管理员接口（需要认证）
// 创建公告
router.post('/', 
  adminAuth, 
  anyAdmin, 
  validateCreateAnnouncement, 
  AnnouncementController.createAnnouncement
);

// 获取所有公告列表（包括未启用的）
router.get('/admin/list', 
  adminAuth, 
  anyAdmin, 
  validateQueryParams, 
  AnnouncementController.getAllAnnouncements
);

// 更新公告
router.put('/:id', 
  adminAuth, 
  anyAdmin, 
  validateUpdateAnnouncement, 
  AnnouncementController.updateAnnouncement
);

// 删除公告
router.delete('/:id', 
  adminAuth, 
  anyAdmin, 
  AnnouncementController.deleteAnnouncement
);

// 批量删除公告
router.delete('/batch/delete', 
  adminAuth, 
  anyAdmin, 
  validateBatchDelete, 
  AnnouncementController.batchDeleteAnnouncements
);

// 切换公告状态
router.put('/:id/status', 
  adminAuth, 
  anyAdmin, 
  validateToggleStatus, 
  AnnouncementController.toggleAnnouncementStatus
);

// 获取启用的公告列表（公开接口）
router.get('/active', 
  validateQueryParams, 
  AnnouncementController.getActiveAnnouncements
);

module.exports = router;
