/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-01 00:25:46
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-02 16:11:03
 * @FilePath: \showcase-backend-node\src\controllers\adminController.js
 * @Description: 管理员控制器
 */

const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class AdminController {
  // 创建管理员
  static async createAdmin(req, res) {
    try {
      const { name, username, password, level = 'editor' } = req.body;

      // 验证必填字段
      if (!name || !username || !password) {
        return res.status(400).json({
          success: false,
          message: '姓名、用户名和密码为必填字段'
        });
      }

      // 验证用户名格式
      if (username.length < 3 || username.length > 50) {
        return res.status(400).json({
          success: false,
          message: '用户名长度必须在3-50个字符之间'
        });
      }

      // 验证密码强度
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: '密码长度至少6个字符'
        });
      }

      // 验证级别
      if (!['super', 'admin', 'editor'].includes(level)) {
        return res.status(400).json({
          success: false,
          message: '管理员级别必须是 super、admin 或 editor'
        });
      }

      // 检查用户名是否已存在
      const existingAdmin = await Admin.usernameExists(username);
      if (existingAdmin) {
        return res.status(409).json({
          success: false,
          message: '用户名已存在'
        });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建管理员
      const result = await Admin.create({
        name,
        username,
        password: hashedPassword,
        level
      });

      res.status(201).json({
        success: true,
        data: result,
        message: '管理员创建成功'
      });

    } catch (error) {
      console.error('创建管理员失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
      });
    }
  }

  // 获取管理员列表
  static async getAdmins(req, res) {
    try {
      const { page = 1, limit = 10, level } = req.query;

      // 验证分页参数
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: '分页参数无效'
        });
      }

      const result = await Admin.findAll(pageNum, limitNum, level);

      res.json({
        success: true,
        data: result.admins,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('获取管理员列表失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
      });
    }
  }

  // 根据ID获取管理员
  static async getAdminById(req, res) {
    try {
      const { id } = req.params;
      const adminId = parseInt(id);

      if (isNaN(adminId)) {
        return res.status(400).json({
          success: false,
          message: '无效的管理员ID'
        });
      }

      const admin = await Admin.findById(adminId);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: '管理员不存在'
        });
      }

      res.json({
        success: true,
        data: admin.toSafeObject()
      });

    } catch (error) {
      console.error('获取管理员失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
      });
    }
  }

  // 更新管理员
  static async updateAdmin(req, res) {
    try {
      const { id } = req.params;
      const adminId = parseInt(id);
      const { name, username, password, level } = req.body;

      if (isNaN(adminId)) {
        return res.status(400).json({
          success: false,
          message: '无效的管理员ID'
        });
      }

      // 检查管理员是否存在
      const existingAdmin = await Admin.findById(adminId);
      if (!existingAdmin) {
        return res.status(404).json({
          success: false,
          message: '管理员不存在'
        });
      }

      // 验证更新数据
      const updateData = {};

      if (name !== undefined) {
        if (!name.trim()) {
          return res.status(400).json({
            success: false,
            message: '姓名不能为空'
          });
        }
        updateData.name = name.trim();
      }

      if (username !== undefined) {
        if (!username.trim()) {
          return res.status(400).json({
            success: false,
            message: '用户名不能为空'
          });
        }
        if (username.length < 3 || username.length > 50) {
          return res.status(400).json({
            success: false,
            message: '用户名长度必须在3-50个字符之间'
          });
        }
        
        // 检查用户名是否已被其他管理员使用
        const usernameExists = await Admin.usernameExists(username, adminId);
        if (usernameExists) {
          return res.status(409).json({
            success: false,
            message: '用户名已被其他管理员使用'
          });
        }
        updateData.username = username.trim();
      }

      if (password !== undefined) {
        if (password.length < 6) {
          return res.status(400).json({
            success: false,
            message: '密码长度至少6个字符'
          });
        }
        updateData.password = await bcrypt.hash(password, 10);
      }

      if (level !== undefined) {
        if (!['super', 'admin', 'editor'].includes(level)) {
          return res.status(400).json({
            success: false,
            message: '管理员级别必须是 super、admin 或 editor'
          });
        }
        updateData.level = level;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有要更新的字段'
        });
      }

      const result = await Admin.update(adminId, updateData);

      res.json({
        success: true,
        data: result,
        message: '管理员更新成功'
      });

    } catch (error) {
      console.error('更新管理员失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
      });
    }
  }

  // 删除管理员
  static async deleteAdmin(req, res) {
    try {
      const { id } = req.params;
      const adminId = parseInt(id);

      if (isNaN(adminId)) {
        return res.status(400).json({
          success: false,
          message: '无效的管理员ID'
        });
      }

      // 检查管理员是否存在
      const existingAdmin = await Admin.findById(adminId);
      if (!existingAdmin) {
        return res.status(404).json({
          success: false,
          message: '管理员不存在'
        });
      }

      const result = await Admin.delete(adminId);

      res.json({
        success: true,
        data: result,
        message: '管理员删除成功'
      });

    } catch (error) {
      console.error('删除管理员失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: error.message
      });
    }
  }

  // 管理员登录
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // 验证必填字段
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: '用户名和密码为必填字段'
        });
      }

      // 查找管理员
      const admin = await Admin.findByUsername(username);
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      // 验证密码
      const isValidPassword = await admin.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      // 生成JWT token
      const token = jwt.sign(
        { 
          adminId: admin.admin_id,
          username: admin.username,
          level: admin.level
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          token,
          admin: admin.toSafeObject()
        },
        message: '登录成功'
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        success: false,
        message: '登录失败'
      });
    }
  }
}

module.exports = AdminController;




