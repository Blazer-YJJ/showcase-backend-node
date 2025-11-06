/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\routes\pdfConfigRoutes.js
 * @Description: PDF配置路由
 */

const express = require('express');
const router = express.Router();
const PdfConfigController = require('../controllers/pdfConfigController');
const { adminAuth, anyAdmin } = require('../middleware/adminAuth');
const { uploadPdfBackgroundImage, handleUploadError } = require('../middleware/uploadMiddleware');

// 获取PDF配置（管理员权限）
router.get('/', adminAuth, anyAdmin, PdfConfigController.getPdfConfig);

// 创建/设置PDF配置（管理员权限）- 支持form-data格式
router.post('/', adminAuth, anyAdmin, uploadPdfBackgroundImage, handleUploadError, PdfConfigController.createPdfConfig);

// 获取所有PDF配置（管理员权限）
router.get('/all', adminAuth, anyAdmin, PdfConfigController.getAllPdfConfig);

// 获取单个PDF配置详情（管理员权限）
router.get('/:id', adminAuth, anyAdmin, PdfConfigController.getPdfConfigById);

// 更新PDF配置（管理员权限）- 支持form-data格式
router.put('/:id', adminAuth, anyAdmin, uploadPdfBackgroundImage, handleUploadError, PdfConfigController.updatePdfConfig);

// 删除PDF配置（管理员权限）
router.delete('/:id', adminAuth, anyAdmin, PdfConfigController.deletePdfConfig);

module.exports = router;

