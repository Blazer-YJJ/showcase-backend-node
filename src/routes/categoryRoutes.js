const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { adminAuth, adminOrAbove } = require('../middleware/adminAuth');

// GET /api/categories/all - 获取所有分类（不分页，用于下拉选择等）
router.get('/all', categoryController.getAllCategories);

// GET /api/categories/tree - 获取分类树结构（无需认证）
router.get('/tree', categoryController.getCategoryTree);

// 分类管理路由（需要管理员认证）
router.use(adminAuth);

// POST /api/categories - 创建分类
router.post('/', adminOrAbove, categoryController.createCategory);

// PUT /api/categories/:id - 更新分类
router.put('/:id', adminOrAbove, categoryController.updateCategory);

// DELETE /api/categories/:id - 删除分类
router.delete('/:id', adminOrAbove, categoryController.deleteCategory);

module.exports = router;
