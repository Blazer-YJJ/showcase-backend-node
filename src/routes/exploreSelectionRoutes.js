/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-03 16:50:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-03 16:50:00
 * @FilePath: \showcase-backend-node\src\routes\exploreSelectionRoutes.js
 * @Description: 精选商品路由
 */

const express = require('express');
const router = express.Router();
const ExploreSelectionController = require('../controllers/exploreSelectionController');
const { adminAuth, adminPermission } = require('../middleware/adminAuth');

// 公开接口 - 获取精选商品列表
router.get('/', ExploreSelectionController.getSelections);

// 公开接口 - 获取单个精选商品详情
router.get('/:id', ExploreSelectionController.getSelection);

// 管理员接口 - 创建精选商品（支持单个和批量）
router.post('/', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  ExploreSelectionController.createSelection
);

// 管理员接口 - 更新精选商品排序
router.put('/:id', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  ExploreSelectionController.updateSelection
);

// 管理员接口 - 删除精选商品
router.delete('/:id', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  ExploreSelectionController.deleteSelection
);

// 管理员接口 - 批量更新精选商品排序
router.post('/batch/sort', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  ExploreSelectionController.batchUpdateSortOrder
);

// 管理员接口 - 获取精选商品统计信息
router.get('/admin/stats', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  ExploreSelectionController.getStats
);

module.exports = router;
