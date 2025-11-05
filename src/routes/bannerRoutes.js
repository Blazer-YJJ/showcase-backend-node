/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-11 18:19:30
 * @FilePath: \showcase-backend-node\src\routes\bannerRoutes.js
 * @Description: 轮播图路由
 */

const express = require('express');
const router = express.Router();
const BannerController = require('../controllers/bannerController');
const { adminAuth, anyAdmin } = require('../middleware/adminAuth');
const { validateCreateBanner, validateUpdateBanner, validateUpdateSort, validateQueryParams, validateBatchDelete } = require('../validators/bannerValidator');
const { uploadBannerImage, handleUploadError } = require('../middleware/uploadMiddleware');

// 获取轮播图列表（公开接口）
router.get('/', validateQueryParams, BannerController.getBanners);

// 创建轮播图（管理员权限，支持文件上传）
router.post('/', adminAuth, anyAdmin, uploadBannerImage, handleUploadError, validateCreateBanner, BannerController.createBanner);

// 获取单个轮播图详情（管理员权限）
router.get('/:id', adminAuth, anyAdmin, BannerController.getBannerById);

// 更新轮播图（管理员权限）
router.put('/:id', adminAuth, anyAdmin, validateUpdateBanner, BannerController.updateBanner);

// 更新轮播图排序（管理员权限）
router.put('/:id/sort', adminAuth, anyAdmin, validateUpdateSort, BannerController.updateBannerSort);

// 删除轮播图（管理员权限）
router.delete('/:id', adminAuth, anyAdmin, BannerController.deleteBanner);

// 批量删除轮播图（管理员权限）
router.post('/batch/delete', adminAuth, anyAdmin, validateBatchDelete, BannerController.batchDeleteBanners);

module.exports = router;
