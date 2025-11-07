/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\routes\imageSearchRoutes.js
 * @Description: 图像搜索路由
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const ImageSearchController = require('../controllers/imageSearchController');
const { adminAuth, adminPermission } = require('../middleware/adminAuth');

// 配置multer用于内存存储（图片搜索接口）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1 // 只允许一个文件
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

// 错误处理中间件
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '图片文件大小不能超过10MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '一次只能上传一个图片文件'
      });
    }
    return res.status(400).json({
      success: false,
      message: '文件上传错误: ' + error.message
    });
  }
  
  if (error.message && error.message.includes('不支持的图片格式')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// 批量添加商品到百度图库（管理员权限）
router.post('/batch-add', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  ImageSearchController.batchAddProducts
);

// 图片搜索接口（公开接口，无需认证）
router.post('/search', 
  upload.single('image'),
  handleMulterError,
  ImageSearchController.searchByImage
);

// 批量从百度图库删除商品（管理员权限）
router.post('/batch-delete', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  ImageSearchController.batchDeleteProducts
);

// 获取商品的百度图库状态（管理员权限）
router.get('/status/:product_id', 
  adminAuth, 
  adminPermission(['super', 'admin']), 
  ImageSearchController.getProductStatus
);

// 禁用 ETag 的中间件（防止返回 304）
const disableETag = (req, res, next) => {
  res.set('ETag', '');
  next();
};

// 获取未入库商品列表（管理员权限）
router.get('/not-indexed', 
  adminAuth, 
  adminPermission(['super', 'admin']),
  disableETag,
  ImageSearchController.getNotIndexedProducts
);

// 获取已入库商品列表（管理员权限）
router.get('/indexed', 
  adminAuth, 
  adminPermission(['super', 'admin']),
  disableETag,
  ImageSearchController.getIndexedProducts
);

module.exports = router;

