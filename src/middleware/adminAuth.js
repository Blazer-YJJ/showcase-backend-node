const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// 管理员认证中间件
const adminAuth = async (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，未提供认证token'
      });
    }

    // 检查token格式
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，token格式错误'
      });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 检查管理员是否存在
    const admin = await Admin.findById(decoded.adminId);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，管理员不存在'
      });
    }

    // 将管理员信息添加到请求对象
    req.admin = admin.toSafeObject();
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，无效的token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，token已过期'
      });
    } else {
      console.error('Admin auth error:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
};

// 管理员权限检查中间件
const adminPermission = (requiredLevels = ['super', 'admin', 'editor']) => {
  return (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: '访问被拒绝，未认证'
        });
      }

      // 检查管理员级别
      if (!requiredLevels.includes(req.admin.level)) {
        return res.status(403).json({
          success: false,
          message: '访问被拒绝，权限不足'
        });
      }

      next();
    } catch (error) {
      console.error('Admin permission error:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  };
};

// 超级管理员权限检查
const superAdminOnly = adminPermission(['super']);

// 管理员及以上权限检查
const adminOrAbove = adminPermission(['super', 'admin']);

// 所有管理员权限检查
const anyAdmin = adminPermission(['super', 'admin', 'editor']);

module.exports = {
  adminAuth,
  adminPermission,
  superAdminOnly,
  adminOrAbove,
  anyAdmin
};

