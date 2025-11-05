/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-11 18:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-11 18:30:00
 * @FilePath: \showcase-backend-node\src\routes\newArrivalAnnouncementRoutes.js
 * @Description: 上新公告路由
 */

const express = require('express');
const router = express.Router();

// 导入控制器
const NewArrivalAnnouncementController = require('../controllers/newArrivalAnnouncementController');

// 导入中间件
const { adminAuth, anyAdmin } = require('../middleware/adminAuth');

// 导入验证器
const {
  validateCreateAnnouncement,
  validateUpdateAnnouncement,
  validateToggleStatus,
  validateBatchDelete,
  validateQueryParams
} = require('../validators/newArrivalAnnouncementValidator');

// 公开接口（无需认证）
// 获取启用的上新公告列表
router.get('/', validateQueryParams, NewArrivalAnnouncementController.getAnnouncements);

// 获取单个上新公告详情（只返回启用的公告）
router.get('/:id', NewArrivalAnnouncementController.getAnnouncement);

// 获取启用的上新公告列表（公开接口，不包含分页）
router.get('/active', NewArrivalAnnouncementController.getActiveAnnouncements);

// 管理员接口（需要认证）
// 创建上新公告
router.post('/', 
  adminAuth, 
  anyAdmin, 
  validateCreateAnnouncement, 
  NewArrivalAnnouncementController.createAnnouncement
);

// 获取所有上新公告列表（包括未启用的）
router.get('/admin/list', 
  adminAuth, 
  anyAdmin, 
  validateQueryParams, 
  NewArrivalAnnouncementController.getAllAnnouncements
);

// 获取上新公告统计信息
router.get('/admin/stats', 
  adminAuth, 
  anyAdmin, 
  NewArrivalAnnouncementController.getStats
);

// 更新上新公告
router.put('/:id', 
  adminAuth, 
  anyAdmin, 
  validateUpdateAnnouncement, 
  NewArrivalAnnouncementController.updateAnnouncement
);

// 删除上新公告
router.delete('/:id', 
  adminAuth, 
  anyAdmin, 
  NewArrivalAnnouncementController.deleteAnnouncement
);

// 批量删除上新公告
router.post('/batch/delete', 
  adminAuth, 
  anyAdmin, 
  validateBatchDelete, 
  NewArrivalAnnouncementController.batchDeleteAnnouncements
);

// 切换上新公告状态
router.put('/:id/status', 
  adminAuth, 
  anyAdmin, 
  validateToggleStatus, 
  NewArrivalAnnouncementController.toggleAnnouncementStatus
);

module.exports = router;

