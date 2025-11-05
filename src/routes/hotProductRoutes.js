/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-03 16:50:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-03 16:50:00
 * @FilePath: \showcase-backend-node\src\routes\hotProductRoutes.js
 * @Description: 热门商品路由
 */

const express = require('express');
const router = express.Router();
const HotProductController = require('../controllers/hotProductController');
const { adminAuth, adminPermission } = require('../middleware/adminAuth');

// 公开接口 - 获取热门商品列表
router.get('/', HotProductController.getHotProducts);

// 公开接口 - 获取单个热门商品详情
router.get('/:id', HotProductController.getHotProduct);

// 管理员接口 - 创建热门商品（支持单个和批量）
router.post('/', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  HotProductController.createHotProduct
);

// 管理员接口 - 更新热门商品排序
router.put('/:id', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  HotProductController.updateHotProduct
);

// 管理员接口 - 批量删除热门商品
router.post('/batch/delete', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  HotProductController.batchDeleteHotProduct
);

// 管理员接口 - 批量更新热门商品排序
router.post('/batch/sort', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  HotProductController.batchUpdateSortOrder
);

// 管理员接口 - 获取热门商品统计信息
router.get('/admin/stats', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  HotProductController.getStats
);

module.exports = router;

