const dbConnection = require('../config/dbConnection');
const bcrypt = require('bcrypt');

class User {
  constructor(data) {
    this.user_id = data.user_id;
    this.name = data.name;
    this.username = data.username;
    this.password = data.password;
    this.member_type = data.member_type || 'normal';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // 创建用户
  static async create(userData) {
    try {
      const { name, username, password, member_type = 'normal' } = userData;

      // 验证必填字段
      if (!name || !username || !password) {
        throw new Error('姓名、用户名和密码为必填字段');
      }

      // 验证用户名长度
      if (username.length < 3 || username.length > 50) {
        throw new Error('用户名长度必须在3-50个字符之间');
      }

      // 验证密码长度
      if (password.length < 6) {
        throw new Error('密码长度至少6个字符');
      }

      // 验证会员类型
      const validMemberTypes = ['normal', 'vip', 'svip'];
      if (member_type && !validMemberTypes.includes(member_type)) {
        throw new Error('会员类型必须是normal、vip或svip');
      }

      // 检查用户名是否已存在
      const existingUser = await this.findByUsername(username);
      if (existingUser) {
        throw new Error('用户名已存在');
      }

      // 加密密码
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const query = `
        INSERT INTO users (name, username, password, member_type)
        VALUES (?, ?, ?, ?)
      `;
      
      const values = [name.trim(), username.trim(), hashedPassword, member_type];
      const result = await dbConnection.query(query, values);

      return {
        user_id: result.insertId,
        name: name.trim(),
        username: username.trim(),
        member_type,
        message: '用户创建成功'
      };
    } catch (error) {
      throw error;
    }
  }

  // 获取所有用户（分页）
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, member_type } = options;
      // 确保参数是整数类型
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      // 构建查询条件
      let whereClause = '';
      let queryParams = [];

      if (member_type) {
        whereClause = 'WHERE member_type = ?';
        queryParams.push(member_type);
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const countResult = await dbConnection.query(countQuery, queryParams);
      const total = countResult[0].total;

      // 获取用户列表
      const query = `
        SELECT user_id, name, username, member_type, created_at, updated_at
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      // 为LIMIT和OFFSET添加参数
      const listParams = [...queryParams, limitNum, offset];
      const users = await dbConnection.query(query, listParams);

      return {
        users: users.map(user => new User(user)),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // 根据ID获取用户
  static async findById(userId) {
    try {
      const query = `
        SELECT user_id, name, username, member_type, created_at, updated_at
        FROM users
        WHERE user_id = ?
      `;
      
      const result = await dbConnection.query(query, [userId]);
      
      if (result.length === 0) {
        return null;
      }

      return new User(result[0]);
    } catch (error) {
      throw error;
    }
  }

  // 根据用户名获取用户
  static async findByUsername(username) {
    try {
      const query = `
        SELECT user_id, name, username, password, member_type, created_at, updated_at
        FROM users
        WHERE username = ?
      `;
      
      const result = await dbConnection.query(query, [username]);
      
      if (result.length === 0) {
        return null;
      }

      return new User(result[0]);
    } catch (error) {
      throw error;
    }
  }

  // 更新用户
  async update(updateData) {
    try {
      const { name, username, password, member_type } = updateData;
      const updates = [];
      const values = [];

      // 构建更新字段
      if (name !== undefined) {
        if (!name || name.trim() === '') {
          throw new Error('姓名不能为空');
        }
        updates.push('name = ?');
        values.push(name.trim());
      }

      if (username !== undefined) {
        if (!username || username.trim() === '') {
          throw new Error('用户名不能为空');
        }
        if (username.length < 3 || username.length > 50) {
          throw new Error('用户名长度必须在3-50个字符之间');
        }
        
        // 检查用户名是否被其他用户使用
        const existingUser = await User.findByUsername(username);
        if (existingUser && existingUser.user_id !== this.user_id) {
          throw new Error('用户名已被其他用户使用');
        }
        
        updates.push('username = ?');
        values.push(username.trim());
      }

      if (password !== undefined) {
        if (!password || password === '') {
          throw new Error('密码不能为空');
        }
        if (password.length < 6) {
          throw new Error('密码长度至少6个字符');
        }
        
        // 加密新密码
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        updates.push('password = ?');
        values.push(hashedPassword);
      }

      if (member_type !== undefined) {
        const validMemberTypes = ['normal', 'vip', 'svip'];
        if (!validMemberTypes.includes(member_type)) {
          throw new Error('会员类型必须是normal、vip或svip');
        }
        updates.push('member_type = ?');
        values.push(member_type);
      }

      if (updates.length === 0) {
        throw new Error('没有提供要更新的字段');
      }

      // 添加更新时间
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(this.user_id);

      const query = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE user_id = ?
      `;

      await dbConnection.query(query, values);

      return {
        user_id: this.user_id,
        message: '用户更新成功'
      };
    } catch (error) {
      throw error;
    }
  }

  // 删除用户
  static async delete(userId) {
    try {
      // 检查用户是否存在
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      const query = 'DELETE FROM users WHERE user_id = ?';
      await dbConnection.query(query, [userId]);

      return {
        user_id: userId,
        message: '用户删除成功'
      };
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

  // 获取安全的用户信息（不包含密码）
  toSafeObject() {
    return {
      user_id: this.user_id,
      name: this.name,
      username: this.username,
      member_type: this.member_type,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = User;
