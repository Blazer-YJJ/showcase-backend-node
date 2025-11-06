const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

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
    console.log('Admin auth success:', req.admin);
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
      console.log('Checking admin level:', req.admin.level, 'Required levels:', requiredLevels);
      if (!requiredLevels.includes(req.admin.level)) {
        console.log('Permission denied: admin level not in required levels');
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

// 同时支持管理员和用户认证的中间件
const adminOrUserAuth = async (req, res, next) => {
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
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
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
        throw error;
      }
    }

    // 优先尝试管理员认证
    if (decoded.adminId) {
      try {
        const admin = await Admin.findById(decoded.adminId);
        if (admin) {
          req.admin = admin.toSafeObject();
          console.log('Admin auth success:', req.admin);
          return next();
        }
      } catch (error) {
        console.error('Admin auth error:', error);
        // 如果管理员认证失败，继续尝试用户认证
      }
    }

    // 尝试用户认证
    if (decoded.userId) {
      try {
        const user = await User.findById(decoded.userId);
        if (user) {
          req.user = user.toSafeObject();
          console.log('User auth success:', req.user);
          return next();
        }
      } catch (error) {
        console.error('User auth error:', error);
      }
    }

    // 如果都失败了
    return res.status(401).json({
      success: false,
      message: '访问被拒绝，无效的认证token'
    });
  } catch (error) {
    console.error('Admin or User auth error:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

module.exports = {
  adminAuth,
  adminPermission,
  superAdminOnly,
  adminOrAbove,
  anyAdmin,
  adminOrUserAuth
};

