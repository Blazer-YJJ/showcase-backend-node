/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-11-07 10:50:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-11-07 10:50:00
 * @FilePath: \showcase-backend-node\src\routes\favoriteRoutes.js
 * @Description: 商品收藏路由
 */

const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { userAuth } = require('../middleware/userAuth');

// 所有收藏路由都需要用户认证
router.use(userAuth);

// POST /api/favorites - 添加收藏（用户权限）
router.post('/', favoriteController.addFavorite);

// DELETE /api/favorites - 取消收藏（用户权限）
router.delete('/', favoriteController.removeFavorite);

// GET /api/favorites - 获取当前用户的收藏列表（用户权限）
router.get('/', favoriteController.getMyFavorites);

// GET /api/favorites/check/:product_id - 检查商品是否已收藏（用户权限）
router.get('/check/:product_id', favoriteController.checkFavorite);

// POST /api/favorites/batch/delete - 批量取消收藏（用户权限）
router.post('/batch/delete', favoriteController.batchRemoveFavorites);

module.exports = router;

