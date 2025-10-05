/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-03 16:50:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-03 16:50:00
 * @FilePath: \showcase-backend-node\src\routes\mainPromotionRoutes.js
 * @Description: 主推款式路由
 */

const express = require('express');
const router = express.Router();
const MainPromotionController = require('../controllers/mainPromotionController');
const { adminAuth, adminPermission } = require('../middleware/adminAuth');

// 公开接口 - 获取主推款式列表
router.get('/', MainPromotionController.getPromotions);

// 公开接口 - 获取单个主推款式详情
router.get('/:id', MainPromotionController.getPromotion);

// 管理员接口 - 创建主推款式（支持单个和批量）
router.post('/', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  MainPromotionController.createPromotion
);

// 管理员接口 - 更新主推款式排序
router.put('/:id', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  MainPromotionController.updatePromotion
);

// 管理员接口 - 删除主推款式
router.delete('/:id', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  MainPromotionController.deletePromotion
);

// 管理员接口 - 批量更新主推款式排序
router.post('/batch/sort', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  MainPromotionController.batchUpdateSortOrder
);

// 管理员接口 - 获取主推款式统计信息
router.get('/admin/stats', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  MainPromotionController.getStats
);

module.exports = router;
