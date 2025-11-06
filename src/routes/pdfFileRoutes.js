/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\routes\pdfFileRoutes.js
 * @Description: PDF文件管理路由
 */

const express = require('express');
const router = express.Router();
const PdfFileController = require('../controllers/pdfFileController');
const { adminAuth, anyAdmin } = require('../middleware/adminAuth');

// 获取所有PDF文件列表（管理员权限）
router.get('/', adminAuth, anyAdmin, PdfFileController.getAllPdfFiles);

// 批量删除PDF文件（管理员权限）
router.post('/batch/delete', adminAuth, anyAdmin, PdfFileController.batchDeletePdfFiles);

module.exports = router;

