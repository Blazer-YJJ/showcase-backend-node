/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-03 08:07:02
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-03 15:21:54
 * @FilePath: \showcase-backend-node\src\middleware\userAuth.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-03 09:13:50
 * @FilePath: \showcase-backend-node\src\middleware\userAuth.js
 * @Description: 用户认证中间件
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 用户认证中间件
const userAuth = async (req, res, next) => {
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
    
    // 检查用户是否存在
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，用户不存在'
      });
    }

    // 将用户信息添加到请求对象
    req.user = user.toSafeObject();
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
      console.error('User auth error:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
};

// 可选：获取当前用户信息（如果登录则返回用户信息，否则跳过）
const optionalUserAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          const user = await User.findById(decoded.userId);
          if (user) {
            req.user = user.toSafeObject();
          }
        } catch (error) {
          // token无效时静默跳过，不报错
        }
      }
    }
    
    next();
  } catch (error) {
    next(); // 出错时也跳过
  }
};

module.exports = {
  userAuth,
  optionalUserAuth
};
