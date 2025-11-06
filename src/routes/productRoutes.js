/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\routes\productRoutes.js
 * @Description: 商品路由
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const ProductController = require('../controllers/productController');
const ProductExportController = require('../controllers/productExportController');
const { adminAuth, adminPermission, adminOrUserAuth } = require('../middleware/adminAuth');
const { validateUploadedFiles } = require('../utils/fileUploadHelper');

// 配置multer用于内存存储
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 100 // 最多100个文件
  },
  fileFilter: (req, file, cb) => {
    // 验证文件格式
    const ext = require('path').extname(file.originalname).toLowerCase();
    const supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    if (supportedFormats.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的图片格式: ${ext}，仅支持 ${supportedFormats.join(', ')}`), false);
    }
  }
});

// 文件验证中间件
const validateFiles = (req, res, next) => {
  // 处理文件上传的情况 - 支持单个或多个文件
  let files = [];
  
  if (req.file) {
    // 单个文件上传
    files = [req.file];
  } else if (req.files) {
    // 多个文件上传
    if (Array.isArray(req.files)) {
      files = req.files;
    } else {
      // 如果是对象形式（多个字段名），转换为数组
      files = Object.values(req.files).flat();
    }
  }
  
  const validation = validateUploadedFiles(files);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: '文件验证失败',
      errors: validation.errors
    });
  }
  req.validFiles = validation.validFiles;
  next();
};

// 批量创建专用的文件验证中间件 - 支持多个独立的images字段
const validateBatchFiles = (req, res, next) => {
  let files = [];
  
  if (req.files) {
    // upload.any() 返回的是数组，每个文件对象有 fieldname 属性
    if (Array.isArray(req.files)) {
      // 过滤出所有 fieldname 为 'images' 的文件
      // 支持多个独立的images字段，每个字段一个图片
      files = req.files.filter(file => file.fieldname === 'images');
    } else {
      // 如果是对象形式（upload.array的结果），提取所有名为'images'的文件
      if (req.files.images) {
        // 如果images是数组，直接使用
        if (Array.isArray(req.files.images)) {
          files = req.files.images;
        } else {
          // 如果images是单个文件，转换为数组
          files = [req.files.images];
        }
      } else {
        // 如果没有images字段，尝试从所有字段中提取
        files = Object.values(req.files).flat();
      }
    }
  } else if (req.file) {
    // 单个文件上传（fieldname必须是images）
    if (req.file.fieldname === 'images') {
      files = [req.file];
    }
  }
  
  if (files.length === 0) {
    return res.status(400).json({
      success: false,
      message: '至少需要上传一张图片，且字段名必须为images'
    });
  }
  
  const validation = validateUploadedFiles(files);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: '文件验证失败',
      errors: validation.errors
    });
  }
  req.validFiles = validation.validFiles;
  next();
};

// 商品路由 - 需要管理员权限（支持文件上传）
router.post('/', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  upload.array('images', 10), // 支持多个图片上传，最多10张
  validateFiles,
  ProductController.createProduct
);

// PDF导出路由 - 支持管理员和用户认证
// 导出全部商品PDF
router.get('/export/pdf/all', adminOrUserAuth, ProductExportController.exportAllProducts);

// 导出指定分类的商品PDF
router.get('/export/pdf/category/:category_id', adminOrUserAuth, ProductExportController.exportProductsByCategory);

// 导出搜索结果的商品PDF
router.get('/export/pdf/search', adminOrUserAuth, ProductExportController.exportProductsBySearch);

// 搜索商品 - 公开访问
router.get('/search', ProductController.searchProducts);

// 获取商品列表 - 公开访问（可用于前端展示）
router.get('/', ProductController.getProducts);

// 获取单个商品详情 - 公开访问
router.get('/:id', ProductController.getProduct);

// 更新商品 - 需要管理员权限
router.put('/:id', adminAuth, adminPermission(['super', 'admin']), ProductController.updateProduct);

// 删除商品 - 需要超级管理员权限
router.delete('/:id', adminAuth, adminPermission(['super']), ProductController.deleteProduct);

// 批量删除商品 - 需要超级管理员权限
router.post('/batch/delete', adminAuth, adminPermission(['super']), ProductController.batchDeleteProducts);

// 批量添加标签 - 需要管理员权限
router.post('/batch/tags', adminAuth, adminPermission(['super', 'admin']), ProductController.batchAddTags);

// 批量创建商品（根据图片文件自动命名）- 需要管理员权限
// 支持多个独立的images字段，每个字段一个图片
router.post('/batch/create', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  upload.any(), // 使用any()接收所有文件，支持多个独立的images字段
  validateBatchFiles,
  ProductController.batchCreateProductsFromFiles
);

module.exports = router;
