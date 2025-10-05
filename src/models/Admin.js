/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-01 00:25:46
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-02 16:11:03
 * @FilePath: \showcase-backend-node\src\models\Admin.js
 * @Description: 管理员数据模型
 */

const dbConnection = require('../config/dbConnection');
const bcrypt = require('bcrypt');

class Admin {
  constructor(data) {
    this.admin_id = data.admin_id;
    this.name = data.name;
    this.username = data.username;
    this.password = data.password;
    this.level = data.level || 'editor';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // 创建管理员
  static async create(adminData) {
    try {
      const { name, username, password, level = 'editor' } = adminData;
      
      const query = `
        INSERT INTO admins (name, username, password, level) 
        VALUES (?, ?, ?, ?)
      `;
      
      const [result] = await dbConnection.query(query, [name, username, password, level]);
      
      return {
        admin_id: result.insertId,
        name,
        username,
        level,
        message: '管理员创建成功'
      };
    } catch (error) {
      throw error;
    }
  }

  // 根据ID获取管理员
  static async findById(adminId) {
    try {
      const query = 'SELECT * FROM admins WHERE admin_id = ?';
      const [rows] = await dbConnection.query(query, [adminId]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return new Admin(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // 根据用户名获取管理员
  static async findByUsername(username) {
    try {
      const query = 'SELECT * FROM admins WHERE username = ?';
      const [rows] = await dbConnection.query(query, [username]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return new Admin(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // 获取所有管理员（分页）
  static async findAll(page = 1, limit = 10, level = null) {
    try {
      // 确保参数是整数类型，处理undefined和null的情况
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const offset = (pageNum - 1) * limitNum;
      
      let query = 'SELECT admin_id, name, username, level, created_at, updated_at FROM admins';
      let countQuery = 'SELECT COUNT(*) as total FROM admins';
      const params = [];
      const countParams = [];

      if (level) {
        query += ' WHERE level = ?';
        countQuery += ' WHERE level = ?';
        params.push(level);
        countParams.push(level);
      }

      // 确保LIMIT和OFFSET参数是正数
      query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

      const rows = await dbConnection.query(query, params);
      const countResult = await dbConnection.query(countQuery, countParams);
      
      return {
        admins: rows[0],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: countResult[0][0].total,
          pages: Math.ceil(countResult[0][0].total / limitNum)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // 更新管理员
  static async update(adminId, updateData) {
    try {
      const { name, username, password, level } = updateData;
      const fields = [];
      const values = [];

      if (name !== undefined) {
        fields.push('name = ?');
        values.push(name);
      }
      if (username !== undefined) {
        fields.push('username = ?');
        values.push(username);
      }
      if (password !== undefined) {
        fields.push('password = ?');
        values.push(password);
      }
      if (level !== undefined) {
        fields.push('level = ?');
        values.push(level);
      }

      if (fields.length === 0) {
        throw new Error('没有要更新的字段');
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(adminId);

      const query = `UPDATE admins SET ${fields.join(', ')} WHERE admin_id = ?`;
      const [result] = await dbConnection.query(query, values);

      if (result.affectedRows === 0) {
        throw new Error('管理员不存在');
      }

      return {
        admin_id: adminId,
        message: '管理员更新成功'
      };
    } catch (error) {
      throw error;
    }
  }

  // 删除管理员
  static async delete(adminId) {
    try {
      const query = 'DELETE FROM admins WHERE admin_id = ?';
      const [result] = await dbConnection.query(query, [adminId]);

      if (result.affectedRows === 0) {
        throw new Error('管理员不存在');
      }

      return {
        admin_id: adminId,
        message: '管理员删除成功'
      };
    } catch (error) {
      throw error;
    }
  }

  // 检查用户名是否存在
  static async usernameExists(username, excludeId = null) {
    try {
      let query = 'SELECT COUNT(*) as count FROM admins WHERE username = ?';
      const params = [username];

      if (excludeId) {
        query += ' AND admin_id != ?';
        params.push(excludeId);
      }

      const [rows] = await dbConnection.query(query, params);
      return rows[0].count > 0;
    } catch (error) {
      throw error;
    }
  }

  // 验证密码
  async validatePassword(password) {
    try {
      return await bcrypt.compare(password, this.password);
    } catch (error) {
      throw error;
    }
  }

  // 获取管理员信息（不包含密码）
  toSafeObject() {
    return {
      admin_id: this.admin_id,
      name: this.name,
      username: this.username,
      level: this.level,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Admin;




