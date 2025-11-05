/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-11 18:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-11 18:30:00
 * @FilePath: \showcase-backend-node\src\models\LimitedTimeActivity.js
 * @Description: 限时活动模型
 */

const dbConnection = require('../config/dbConnection');

class LimitedTimeActivity {
  constructor(data) {
    this.activity_id = data.activity_id;
    this.title = data.title;
    this.description = data.description;
    this.start_time = data.start_time;
    this.end_time = data.end_time;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.products = data.products || []; // 关联的商品列表
  }

  // 将ISO 8601日期格式转换为MySQL日期格式 (YYYY-MM-DD HH:MM:SS)
  static formatDateForMySQL(dateString) {
    if (!dateString) {
      return null;
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    // 转换为 MySQL 格式: YYYY-MM-DD HH:MM:SS
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  // 创建限时活动
  static async create(activityData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      const {
        title,
        description = null,
        start_time = null,
        end_time = null,
        is_active = 1,
        product_ids = []
      } = activityData;

      // 验证必填字段
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        throw new Error('活动标题不能为空');
      }

      if (title.length > 200) {
        throw new Error('活动标题不能超过200个字符');
      }

      // 验证时间范围
      if (start_time && end_time) {
        const start = new Date(start_time);
        const end = new Date(end_time);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error('活动时间格式无效');
        }
        if (start >= end) {
          throw new Error('活动开始时间必须早于结束时间');
        }
      }

      // 插入活动数据
      const [result] = await connection.execute(
        `INSERT INTO limited_time_activities (title, description, start_time, end_time, is_active) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          title.trim(),
          description ? description.trim() : null,
          this.formatDateForMySQL(start_time),
          this.formatDateForMySQL(end_time),
          is_active ? 1 : 0
        ]
      );

      const activityId = result.insertId;

      // 如果有商品ID列表，创建关联关系
      if (Array.isArray(product_ids) && product_ids.length > 0) {
        // 验证商品ID
        const validProductIds = product_ids.filter(id => {
          const numId = parseInt(id);
          return !isNaN(numId) && numId > 0;
        });

        if (validProductIds.length > 0) {
          // 检查商品是否存在
          const placeholders = validProductIds.map(() => '?').join(',');
          const [existingProducts] = await connection.execute(
            `SELECT product_id FROM products WHERE product_id IN (${placeholders})`,
            validProductIds
          );

          const existingIds = existingProducts.map(p => p.product_id);
          const invalidIds = validProductIds.filter(id => !existingIds.includes(parseInt(id)));

          if (invalidIds.length > 0) {
            throw new Error(`商品ID不存在: ${invalidIds.join(', ')}`);
          }

          // 插入关联关系
          const insertPromises = existingIds.map(productId => {
            return connection.execute(
              'INSERT INTO activity_products (activity_id, product_id) VALUES (?, ?)',
              [activityId, productId]
            );
          });

          await Promise.all(insertPromises);
        }
      }

      await connection.commit();

      // 获取创建后的完整数据（包含关联商品）
      const activity = await this.findById(activityId);

      return activity;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 根据ID获取限时活动（包含关联商品）
  static async findById(activityId) {
    const connection = await dbConnection.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM limited_time_activities WHERE activity_id = ?',
        [activityId]
      );

      if (rows.length === 0) {
        return null;
      }

      const activity = rows[0];

      // 获取关联的商品
      const [productRows] = await connection.execute(
        `SELECT p.product_id, p.name, p.price, p.description, p.category_id, p.tags
         FROM activity_products ap
         INNER JOIN products p ON ap.product_id = p.product_id
         WHERE ap.activity_id = ?
         ORDER BY ap.id ASC`,
        [activityId]
      );

      activity.products = productRows;

      return activity;
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取限时活动列表（分页，包含关联商品）
  static async findAll(options = {}) {
    const connection = await dbConnection.getConnection();
    try {
      const {
        page = 1,
        limit = 10,
        is_active = null // 可选：按启用状态筛选
      } = options;

      const offset = (page - 1) * limit;

      // 构建查询条件
      let whereClause = '';
      const queryParams = [];

      if (is_active !== null) {
        whereClause = 'WHERE is_active = ?';
        queryParams.push(is_active ? 1 : 0);
      }

      // 获取总数
      const [countRows] = await connection.execute(
        `SELECT COUNT(*) as total FROM limited_time_activities ${whereClause}`,
        queryParams
      );
      const total = countRows[0].total;

      // 获取数据
      const [rows] = await connection.execute(
        `SELECT * FROM limited_time_activities 
         ${whereClause}
         ORDER BY created_at DESC 
         LIMIT ${parseInt(offset)}, ${parseInt(limit)}`,
        queryParams
      );

      // 为每个活动获取关联的商品
      const activitiesWithProducts = await Promise.all(
        rows.map(async (activity) => {
          const [productRows] = await connection.execute(
            `SELECT p.product_id, p.name, p.price, p.description, p.category_id, p.tags
             FROM activity_products ap
             INNER JOIN products p ON ap.product_id = p.product_id
             WHERE ap.activity_id = ?
             ORDER BY ap.id ASC`,
            [activity.activity_id]
          );
          activity.products = productRows;
          return activity;
        })
      );

      return {
        data: activitiesWithProducts,
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

  // 更新限时活动
  static async update(activityId, updateData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 检查记录是否存在
      const existing = await this.findById(activityId);
      if (!existing) {
        throw new Error('限时活动不存在');
      }

      const {
        title,
        description,
        start_time,
        end_time,
        is_active,
        product_ids // 可选：更新关联商品
      } = updateData;

      // 构建更新字段
      const updateFields = [];
      const updateValues = [];

      if (title !== undefined) {
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
          throw new Error('活动标题不能为空');
        }
        if (title.length > 200) {
          throw new Error('活动标题不能超过200个字符');
        }
        updateFields.push('title = ?');
        updateValues.push(title.trim());
      }

      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description ? description.trim() : null);
      }

      if (start_time !== undefined) {
        updateFields.push('start_time = ?');
        updateValues.push(this.formatDateForMySQL(start_time));
      }

      if (end_time !== undefined) {
        updateFields.push('end_time = ?');
        updateValues.push(this.formatDateForMySQL(end_time));
      }

      if (is_active !== undefined) {
        updateFields.push('is_active = ?');
        updateValues.push(is_active ? 1 : 0);
      }

      // 验证时间范围
      const finalStartTime = start_time !== undefined ? start_time : existing.start_time;
      const finalEndTime = end_time !== undefined ? end_time : existing.end_time;
      
      if (finalStartTime && finalEndTime) {
        const start = new Date(finalStartTime);
        const end = new Date(finalEndTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error('活动时间格式无效');
        }
        if (start >= end) {
          throw new Error('活动开始时间必须早于结束时间');
        }
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(activityId);

        // 执行更新
        const [result] = await connection.execute(
          `UPDATE limited_time_activities SET ${updateFields.join(', ')} WHERE activity_id = ?`,
          updateValues
        );

        if (result.affectedRows === 0) {
          throw new Error('更新失败');
        }
      }

      // 如果提供了product_ids，更新关联商品
      if (product_ids !== undefined && Array.isArray(product_ids)) {
        // 删除现有关联
        await connection.execute(
          'DELETE FROM activity_products WHERE activity_id = ?',
          [activityId]
        );

        // 如果有新的商品ID，创建新的关联
        if (product_ids.length > 0) {
          const validProductIds = product_ids.filter(id => {
            const numId = parseInt(id);
            return !isNaN(numId) && numId > 0;
          });

          if (validProductIds.length > 0) {
            // 检查商品是否存在
            const placeholders = validProductIds.map(() => '?').join(',');
            const [existingProducts] = await connection.execute(
              `SELECT product_id FROM products WHERE product_id IN (${placeholders})`,
              validProductIds
            );

            const existingIds = existingProducts.map(p => p.product_id);
            const invalidIds = validProductIds.filter(id => !existingIds.includes(parseInt(id)));

            if (invalidIds.length > 0) {
              throw new Error(`商品ID不存在: ${invalidIds.join(', ')}`);
            }

            // 插入新的关联关系
            const insertPromises = existingIds.map(productId => {
              return connection.execute(
                'INSERT INTO activity_products (activity_id, product_id) VALUES (?, ?)',
                [activityId, productId]
              );
            });

            await Promise.all(insertPromises);
          }
        }
      }

      await connection.commit();

      // 获取更新后的完整数据
      const updatedActivity = await this.findById(activityId);

      return updatedActivity;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 删除限时活动（会自动删除关联的商品记录，因为外键约束）
  static async delete(activityId) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 检查记录是否存在
      const existing = await this.findById(activityId);
      if (!existing) {
        throw new Error('限时活动不存在');
      }

      // 删除关联的商品记录（外键会自动处理，但显式删除更清晰）
      await connection.execute(
        'DELETE FROM activity_products WHERE activity_id = ?',
        [activityId]
      );

      // 删除活动记录
      const [result] = await connection.execute(
        'DELETE FROM limited_time_activities WHERE activity_id = ?',
        [activityId]
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

  // 批量删除限时活动
  static async batchDelete(activityIds) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      if (!Array.isArray(activityIds) || activityIds.length === 0) {
        throw new Error('活动ID数组不能为空');
      }

      // 验证所有ID都是有效数字
      const invalidIds = activityIds.filter(id => isNaN(id) || parseInt(id) <= 0);
      if (invalidIds.length > 0) {
        throw new Error(`无效的活动ID: ${invalidIds.join(', ')}`);
      }

      // 批量删除关联商品
      const placeholders = activityIds.map(() => '?').join(',');
      await connection.execute(
        `DELETE FROM activity_products WHERE activity_id IN (${placeholders})`,
        activityIds
      );

      // 批量删除活动
      const [result] = await connection.execute(
        `DELETE FROM limited_time_activities WHERE activity_id IN (${placeholders})`,
        activityIds
      );

      await connection.commit();

      return {
        deletedCount: result.affectedRows,
        requestedIds: activityIds.length
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取启用的活动列表（公开接口）
  static async findActive() {
    const connection = await dbConnection.getConnection();
    try {
      const now = new Date();

      // 获取启用且在时间范围内的活动
      const [rows] = await connection.execute(
        `SELECT * FROM limited_time_activities 
         WHERE is_active = 1 
         AND (start_time IS NULL OR start_time <= ?)
         AND (end_time IS NULL OR end_time >= ?)
         ORDER BY created_at DESC`,
        [now, now]
      );

      // 为每个活动获取关联的商品
      const activitiesWithProducts = await Promise.all(
        rows.map(async (activity) => {
          const [productRows] = await connection.execute(
            `SELECT p.product_id, p.name, p.price, p.description, p.category_id, p.tags
             FROM activity_products ap
             INNER JOIN products p ON ap.product_id = p.product_id
             WHERE ap.activity_id = ?
             ORDER BY ap.id ASC`,
            [activity.activity_id]
          );
          activity.products = productRows;
          return activity;
        })
      );

      return activitiesWithProducts;
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = LimitedTimeActivity;

