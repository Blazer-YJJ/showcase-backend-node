/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\models\Announcement.js
 * @Description: 公告信息数据模型
 */

const dbConnection = require('../config/dbConnection');

class Announcement {
  constructor(data) {
    this.announcement_id = data.announcement_id;
    this.content = data.content;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // 创建公告
  static async create(announcementData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      const { content, is_active = 1 } = announcementData;

      // 验证必填字段
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new Error('公告内容不能为空');
      }

      // 验证内容长度
      if (content.length > 10000) {
        throw new Error('公告内容不能超过10000个字符');
      }

      // 验证状态值
      if (is_active !== 0 && is_active !== 1) {
        throw new Error('启用状态只能是0或1');
      }

      // 创建公告
      const createQuery = `
        INSERT INTO announcements (content, is_active)
        VALUES (?, ?)
      `;

      const [result] = await connection.execute(createQuery, [
        content.trim(),
        is_active
      ]);

      const announcementId = result.insertId;
      await connection.commit();

      // 获取创建的公告信息
      return await this.findById(announcementId);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 根据ID获取公告
  static async findById(announcementId) {
    try {
      const query = `
        SELECT announcement_id, content, is_active, created_at, updated_at
        FROM announcements
        WHERE announcement_id = ?
      `;
      
      const result = await dbConnection.query(query, [announcementId]);
      
      if (result[0].length === 0) {
        return null;
      }

      return result[0][0];
    } catch (error) {
      throw error;
    }
  }

  // 获取公告列表（支持分页和筛选）
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        is_active = null
      } = options;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];

      // 构建WHERE条件
      if (is_active !== null) {
        whereConditions.push('is_active = ?');
        queryParams.push(is_active);
      }

      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM announcements
        ${whereClause}
      `;
      
      const countResult = await dbConnection.query(countQuery, queryParams);
      const total = countResult[0][0].total;

      // 获取公告列表
      const listQuery = `
        SELECT announcement_id, content, is_active, created_at, updated_at
        FROM announcements
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const announcements = await dbConnection.query(listQuery, [...queryParams, limit, offset]);
      const announcementsData = announcements[0];

      return {
        announcements: announcementsData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // 更新公告
  static async update(announcementId, updateData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      const { content, is_active } = updateData;

      // 检查公告是否存在
      const [existingAnnouncement] = await connection.execute(
        'SELECT * FROM announcements WHERE announcement_id = ?',
        [announcementId]
      );

      if (existingAnnouncement.length === 0) {
        throw new Error('公告不存在');
      }

      // 构建更新字段
      const updates = [];
      const values = [];

      if (content !== undefined) {
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
          throw new Error('公告内容不能为空');
        }
        if (content.length > 10000) {
          throw new Error('公告内容不能超过10000个字符');
        }
        updates.push('content = ?');
        values.push(content.trim());
      }

      if (is_active !== undefined) {
        if (is_active !== 0 && is_active !== 1) {
          throw new Error('启用状态只能是0或1');
        }
        updates.push('is_active = ?');
        values.push(is_active);
      }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(announcementId);

        const updateQuery = `
          UPDATE announcements
          SET ${updates.join(', ')}
          WHERE announcement_id = ?
        `;

        await connection.execute(updateQuery, values);
      }

      await connection.commit();

      // 获取更新后的公告信息
      return await this.findById(announcementId);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 删除公告
  static async delete(announcementId) {
    try {
      // 检查公告是否存在
      const announcement = await this.findById(announcementId);
      if (!announcement) {
        throw new Error('公告不存在');
      }

      const connection = await dbConnection.getConnection();
      try {
        await connection.beginTransaction();

        // 删除公告
        const deleteResult = await connection.execute(
          'DELETE FROM announcements WHERE announcement_id = ?',
          [announcementId]
        );

        if (deleteResult.affectedRows === 0) {
          throw new Error('删除公告失败');
        }

        await connection.commit();

        return {
          announcement_id: announcementId,
          message: '公告删除成功'
        };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      throw error;
    }
  }

  // 批量删除公告
  static async batchDelete(announcementIds) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 验证参数
      if (!Array.isArray(announcementIds) || announcementIds.length === 0) {
        throw new Error('公告ID数组不能为空');
      }

      // 验证所有ID都是有效数字
      const invalidIds = announcementIds.filter(id => !Number.isInteger(parseInt(id)));
      if (invalidIds.length > 0) {
        throw new Error(`无效的公告ID: ${invalidIds.join(', ')}`);
      }

      // 检查公告是否存在
      const placeholders = announcementIds.map(() => '?').join(',');
      const [existingAnnouncements] = await connection.execute(
        `SELECT announcement_id FROM announcements WHERE announcement_id IN (${placeholders})`,
        announcementIds
      );

      if (existingAnnouncements.length === 0) {
        throw new Error('没有找到要删除的公告');
      }

      if (existingAnnouncements.length !== announcementIds.length) {
        const existingIds = existingAnnouncements.map(a => a.announcement_id);
        const missingIds = announcementIds.filter(id => !existingIds.includes(parseInt(id)));
        throw new Error(`以下公告不存在: ${missingIds.join(', ')}`);
      }

      // 删除公告
      const deleteResult = await connection.execute(
        `DELETE FROM announcements WHERE announcement_id IN (${placeholders})`,
        announcementIds
      );

      await connection.commit();
      
      return {
        deletedCount: deleteResult.affectedRows,
        deletedIds: announcementIds
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 切换公告状态
  static async toggleStatus(announcementId, is_active) {
    try {
      // 验证状态值
      if (is_active !== 0 && is_active !== 1) {
        throw new Error('启用状态只能是0或1');
      }

      return await this.update(announcementId, { is_active });
    } catch (error) {
      throw error;
    }
  }

  // 获取公告统计信息
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_count
        FROM announcements
      `;
      
      const result = await dbConnection.query(query);
      return result[0][0];
    } catch (error) {
      throw error;
    }
  }

  // 获取安全的公告信息
  toSafeObject() {
    return {
      announcement_id: this.announcement_id,
      content: this.content,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Announcement;
