/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\routes\customerServiceRoutes.js
 * @Description: 客服联系信息路由
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 导入控制器
const CustomerServiceController = require('../controllers/customerServiceController');

// 导入中间件
const { adminAuth } = require('../middleware/adminAuth');

// 导入验证器
const {
  validateQueryParams,
  validateCreateCustomerService,
  validateUpdateCustomerService,
  validateServiceId
} = require('../validators/customerServiceValidator');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads/customer-service');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer用于磁盘存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：时间戳_随机数.扩展名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 9);
    const ext = path.extname(file.originalname);
    const filename = `wechat_qr_${timestamp}_${randomString}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 // 只允许一个文件
  },
  fileFilter: (req, file, cb) => {
    // 验证文件格式
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的图片格式，仅支持 JPG、PNG、GIF 格式'), false);
    }
  }
});

// 错误处理中间件
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '图片文件大小不能超过5MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '只能上传一个图片文件'
      });
    }
    return res.status(400).json({
      success: false,
      message: '文件上传错误: ' + error.message
    });
  }
  
  if (error.message.includes('不支持的图片格式')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// 公开接口（无需认证）
// 获取客服联系信息列表
router.get('/', validateQueryParams, CustomerServiceController.getCustomerServices);

// 管理员接口（需要认证）
// 创建客服联系信息
router.post('/', 
  adminAuth, 
  upload.single('wechat_image'), 
  handleMulterError,
  validateCreateCustomerService, 
  CustomerServiceController.createCustomerService
);

// 获取客服联系信息详情
router.get('/:id', 
  adminAuth, 
  validateServiceId, 
  CustomerServiceController.getCustomerServiceById
);

// 更新客服联系信息
router.put('/:id', 
  adminAuth, 
  upload.single('wechat_image'), 
  handleMulterError,
  validateServiceId,
  validateUpdateCustomerService, 
  CustomerServiceController.updateCustomerService
);

// 删除客服联系信息
router.delete('/:id', 
  adminAuth, 
  validateServiceId, 
  CustomerServiceController.deleteCustomerService
);

module.exports = router;






