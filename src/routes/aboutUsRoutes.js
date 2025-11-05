/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\routes\aboutUsRoutes.js
 * @Description: 关于我们路由
 */

const express = require('express');
const router = express.Router();
const AboutUsController = require('../controllers/aboutUsController');
const { adminAuth, anyAdmin } = require('../middleware/adminAuth');
const { validateCreateAboutUs, validateUpdateAboutUs, validateQueryParams } = require('../validators/aboutUsValidator');

// 获取关于我们信息（管理员权限）
router.get('/', adminAuth, anyAdmin, AboutUsController.getAboutUs);

// 创建关于我们信息（管理员权限）
router.post('/', adminAuth, anyAdmin, validateCreateAboutUs, AboutUsController.createAboutUs);

// 获取所有关于我们信息（管理员权限）
router.get('/all', adminAuth, anyAdmin, validateQueryParams, AboutUsController.getAllAboutUs);

// 获取单个关于我们信息详情（管理员权限）
router.get('/:id', adminAuth, anyAdmin, AboutUsController.getAboutUsById);

// 更新关于我们信息（管理员权限）
router.put('/:id', adminAuth, anyAdmin, validateUpdateAboutUs, AboutUsController.updateAboutUs);

// 删除关于我们信息（管理员权限）
router.delete('/:id', adminAuth, anyAdmin, AboutUsController.deleteAboutUs);

module.exports = router;


