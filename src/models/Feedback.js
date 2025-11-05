/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\models\Feedback.js
 * @Description: 意见反馈模型
 */

const dbConnection = require('../config/dbConnection');

class Feedback {
  constructor(data) {
    this.feedback_id = data.feedback_id;
    this.user_id = data.user_id;
    this.title = data.title;
    this.content = data.content;
    this.feedback_image = data.feedback_image;
    this.feedback_time = data.feedback_time;
    this.created_at = data.created_at;
  }

  // 创建反馈
  static async create(feedbackData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      const {
        user_id,
        title,
        content,
        feedback_image = null
      } = feedbackData;

      // 验证必填字段
      if (!user_id || isNaN(user_id)) {
        throw new Error('用户ID不能为空且必须是有效数字');
      }

      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        throw new Error('反馈标题不能为空');
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new Error('反馈内容不能为空');
      }

      // 验证用户是否存在
      const [userRows] = await connection.execute(
        'SELECT user_id FROM users WHERE user_id = ?',
        [user_id]
      );

      if (userRows.length === 0) {
        throw new Error('用户不存在');
      }

      // 插入反馈数据
      const [result] = await connection.execute(
        `INSERT INTO feedback (user_id, title, content, feedback_image) 
         VALUES (?, ?, ?, ?)`,
        [user_id, title.trim(), content.trim(), feedback_image]
      );

      await connection.commit();

      return {
        feedback_id: result.insertId,
        user_id,
        title: title.trim(),
        content: content.trim(),
        feedback_image,
        feedback_time: new Date(),
        created_at: new Date()
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 根据ID获取反馈
  static async findById(feedbackId) {
    const connection = await dbConnection.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT f.*, u.username, u.name 
         FROM feedback f 
         LEFT JOIN users u ON f.user_id = u.user_id 
         WHERE f.feedback_id = ?`,
        [feedbackId]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取反馈列表（分页）
  static async findAll(options = {}) {
    const connection = await dbConnection.getConnection();
    try {
      const {
        page = 1,
        limit = 10,
        user_id = null
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = '';
      let params = [];

      // 构建查询条件
      if (user_id) {
        whereClause = 'WHERE f.user_id = ?';
        params.push(user_id);
      }

      // 获取总数
      const [countRows] = await connection.execute(
        `SELECT COUNT(*) as total FROM feedback f ${whereClause}`,
        params
      );
      const total = countRows[0].total;

      // 获取数据 - 确保参数类型正确
      const limitValue = parseInt(limit);
      const offsetValue = parseInt(offset);
      
      // 构建完整的查询参数数组
      const queryParams = [...params, limitValue, offsetValue];
      
      // 构建SQL查询 - 使用字符串拼接而不是占位符
      let sql = `SELECT f.*, u.username, u.name 
                 FROM feedback f 
                 LEFT JOIN users u ON f.user_id = u.user_id 
                 ${whereClause}
                 ORDER BY f.feedback_time DESC 
                 LIMIT ${limitValue} OFFSET ${offsetValue}`;
      
      console.log('SQL查询:', sql);
      console.log('查询参数:', queryParams);
      
      const [rows] = await connection.execute(sql, params);

      return {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // 删除反馈
  static async delete(feedbackId) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 检查反馈是否存在
      const feedback = await this.findById(feedbackId);
      if (!feedback) {
        throw new Error('反馈不存在');
      }

      // 删除反馈
      const [result] = await connection.execute(
        'DELETE FROM feedback WHERE feedback_id = ?',
        [feedbackId]
      );

      await connection.commit();

      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 批量删除反馈
  static async batchDelete(feedbackIds) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      if (!Array.isArray(feedbackIds) || feedbackIds.length === 0) {
        throw new Error('反馈ID数组不能为空');
      }

      // 验证所有ID都是有效数字
      const invalidIds = feedbackIds.filter(id => isNaN(id) || parseInt(id) <= 0);
      if (invalidIds.length > 0) {
        throw new Error(`无效的反馈ID: ${invalidIds.join(', ')}`);
      }

      // 批量删除
      const placeholders = feedbackIds.map(() => '?').join(',');
      const [result] = await connection.execute(
        `DELETE FROM feedback WHERE feedback_id IN (${placeholders})`,
        feedbackIds
        );

      await connection.commit();

      return {
        deletedCount: result.affectedRows,
        requestedIds: feedbackIds.length
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Feedback;


