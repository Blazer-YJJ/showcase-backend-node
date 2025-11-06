/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-11-06 00:00:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-11-06 00:00:00
 * @FilePath: \showcase-backend-node\src\routes\statisticsRoutes.js
 * @Description: 数据统计路由
 */
const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { adminAuth, adminOrAbove } = require('../middleware/adminAuth');

// 数据统计路由（需要管理员权限）
router.use(adminAuth);

// GET /api/statistics - 获取数据统计
router.get('/', adminOrAbove, statisticsController.getStatistics);

module.exports = router;

