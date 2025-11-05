/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-11 18:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-11 18:30:00
 * @FilePath: \showcase-backend-node\src\models\NewArrivalAnnouncement.js
 * @Description: 上新公告模型
 */

const dbConnection = require('../config/dbConnection');

class NewArrivalAnnouncement {
  constructor(data) {
    this.announcement_id = data.announcement_id;
    this.content = data.content;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.products = data.products || []; // 关联的商品列表
  }

  // 创建上新公告
  static async create(announcementData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      const { content, is_active = 1, product_ids = [] } = announcementData;

      // 验证必填字段
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new Error('公告内容不能为空');
      }

      // 验证内容长度
      if (content.length > 10000) {
        throw new Error('公告内容不能超过10000个字符');
      }

      // 验证状态值并转换为整数
      const activeStatus = parseInt(is_active);
      if (activeStatus !== 0 && activeStatus !== 1) {
        throw new Error('启用状态只能是0或1');
      }

      // 创建公告
      const [result] = await connection.execute(
        `INSERT INTO new_arrival_announcements (content, is_active)
         VALUES (?, ?)`,
        [content.trim(), activeStatus]
      );

      const announcementId = result.insertId;

      // 如果有商品ID列表，创建关联关系
      if (Array.isArray(product_ids) && product_ids.length > 0) {
        // 验证商品ID并转换为整数
        const validProductIds = product_ids
          .map(id => parseInt(id))
          .filter(id => !isNaN(id) && id > 0);

        if (validProductIds.length > 0) {
          // 检查商品是否存在
          const placeholders = validProductIds.map(() => '?').join(',');
          const [existingProducts] = await connection.execute(
            `SELECT product_id FROM products WHERE product_id IN (${placeholders})`,
            validProductIds
          );

          const existingIds = existingProducts.map(p => p.product_id);
          const invalidIds = validProductIds.filter(id => !existingIds.includes(id));

          if (invalidIds.length > 0) {
            throw new Error(`商品ID不存在: ${invalidIds.join(', ')}`);
          }

          // 插入关联关系
          const insertPromises = existingIds.map(productId => {
            return connection.execute(
              'INSERT INTO new_arrival_products (announcement_id, product_id) VALUES (?, ?)',
              [announcementId, productId]
            );
          });

          await Promise.all(insertPromises);
        }
      }

      await connection.commit();

      // 获取创建后的完整数据（包含关联商品）
      const announcement = await this.findById(announcementId);

      return announcement;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 根据ID获取上新公告（包含关联商品）
  static async findById(announcementId) {
    const connection = await dbConnection.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM new_arrival_announcements WHERE announcement_id = ?',
        [announcementId]
      );

      if (rows.length === 0) {
        return null;
      }

      const announcement = rows[0];

      // 获取关联的商品
      const [productRows] = await connection.execute(
        `SELECT p.product_id, p.name, p.price, p.description, p.category_id, p.tags
         FROM new_arrival_products nap
         INNER JOIN products p ON nap.product_id = p.product_id
         WHERE nap.announcement_id = ?
         ORDER BY nap.id ASC`,
        [announcementId]
      );

      announcement.products = productRows;

      return announcement;
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取上新公告列表（支持分页和筛选）
  static async findAll(options = {}) {
    const connection = await dbConnection.getConnection();
    try {
      const {
        page = 1,
        limit = 10,
        is_active = null,
        include_products = false // 是否包含商品信息
      } = options;

      // 确保 page 和 limit 是整数
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
      const offset = Math.max(0, (pageNum - 1) * limitNum);
      
      let whereConditions = [];
      let queryParams = [];

      // 构建WHERE条件
      if (is_active !== null && is_active !== undefined) {
        whereConditions.push('is_active = ?');
        // 确保 is_active 是整数类型（0 或 1）
        const activeValue = parseInt(is_active);
        if (activeValue !== 0 && activeValue !== 1) {
          throw new Error('启用状态只能是0或1');
        }
        queryParams.push(activeValue);
      }

      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM new_arrival_announcements
        ${whereClause}
      `;
      
      const [countResult] = await connection.execute(countQuery, queryParams);
      const total = countResult[0].total;

      // 获取公告列表
      // 使用字符串拼接方式避免参数类型问题（参考 LimitedTimeActivity.js）
      const limitValue = parseInt(limitNum);
      const offsetValue = parseInt(offset);
      
      const listQuery = `
        SELECT announcement_id, content, is_active, created_at, updated_at
        FROM new_arrival_announcements
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${limitValue} OFFSET ${offsetValue}
      `;
      
      const [announcements] = await connection.execute(listQuery, queryParams);

      // 如果需要包含商品信息
      if (include_products) {
        const announcementsWithProducts = await Promise.all(
          announcements.map(async (announcement) => {
            const [productRows] = await connection.execute(
              `SELECT p.product_id, p.name, p.price, p.description, p.category_id, p.tags
               FROM new_arrival_products nap
               INNER JOIN products p ON nap.product_id = p.product_id
               WHERE nap.announcement_id = ?
               ORDER BY nap.id ASC`,
              [announcement.announcement_id]
            );
            announcement.products = productRows;
            return announcement;
          })
        );

        return {
          announcements: announcementsWithProducts,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        };
      }

      return {
        announcements,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // 更新上新公告
  static async update(announcementId, updateData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      const { content, is_active, product_ids } = updateData;

      // 检查公告是否存在
      const [existingAnnouncement] = await connection.execute(
        'SELECT * FROM new_arrival_announcements WHERE announcement_id = ?',
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
        // 验证状态值并转换为整数
        const activeStatus = parseInt(is_active);
        if (activeStatus !== 0 && activeStatus !== 1) {
          throw new Error('启用状态只能是0或1');
        }
        updates.push('is_active = ?');
        values.push(activeStatus);
      }

      // 更新公告基本信息
      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');

        const updateQuery = `
          UPDATE new_arrival_announcements
          SET ${updates.join(', ')}
          WHERE announcement_id = ?
        `;

        // 将 announcementId 添加到 values 数组末尾，用于 WHERE 子句
        values.push(announcementId);

        await connection.execute(updateQuery, values);
      }

      // 如果提供了product_ids，更新关联商品
      if (product_ids !== undefined && Array.isArray(product_ids)) {
        // 删除现有关联
        await connection.execute(
          'DELETE FROM new_arrival_products WHERE announcement_id = ?',
          [announcementId]
        );

        // 如果有新的商品ID，创建新的关联
        if (product_ids.length > 0) {
          // 验证商品ID并转换为整数
          const validProductIds = product_ids
            .map(id => parseInt(id))
            .filter(id => !isNaN(id) && id > 0);

          if (validProductIds.length > 0) {
            // 检查商品是否存在
            const placeholders = validProductIds.map(() => '?').join(',');
            const [existingProducts] = await connection.execute(
              `SELECT product_id FROM products WHERE product_id IN (${placeholders})`,
              validProductIds
            );

            const existingIds = existingProducts.map(p => p.product_id);
            const invalidIds = validProductIds.filter(id => !existingIds.includes(id));

            if (invalidIds.length > 0) {
              throw new Error(`商品ID不存在: ${invalidIds.join(', ')}`);
            }

            // 插入新的关联关系
            const insertPromises = existingIds.map(productId => {
              return connection.execute(
                'INSERT INTO new_arrival_products (announcement_id, product_id) VALUES (?, ?)',
                [announcementId, productId]
              );
            });

            await Promise.all(insertPromises);
          }
        }
      }

      await connection.commit();

      // 获取更新后的完整数据
      const updatedAnnouncement = await this.findById(announcementId);

      return updatedAnnouncement;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 删除上新公告
  static async delete(announcementId) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 检查公告是否存在
      const announcement = await this.findById(announcementId);
      if (!announcement) {
        throw new Error('公告不存在');
      }

      // 删除公告（会自动删除关联的商品记录，因为外键约束）
      const [deleteResult] = await connection.execute(
        'DELETE FROM new_arrival_announcements WHERE announcement_id = ?',
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
  }

  // 批量删除上新公告
  static async batchDelete(announcementIds) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 验证参数
      if (!Array.isArray(announcementIds) || announcementIds.length === 0) {
        throw new Error('公告ID数组不能为空');
      }

      // 验证所有ID都是有效数字，并转换为整数
      const validIds = announcementIds.map(id => {
        const numId = parseInt(id);
        if (isNaN(numId) || numId <= 0) {
          throw new Error(`无效的公告ID: ${id}`);
        }
        return numId;
      });

      // 检查公告是否存在
      const placeholders = validIds.map(() => '?').join(',');
      const [existingAnnouncements] = await connection.execute(
        `SELECT announcement_id FROM new_arrival_announcements WHERE announcement_id IN (${placeholders})`,
        validIds
      );

      if (existingAnnouncements.length === 0) {
        throw new Error('没有找到要删除的公告');
      }

      if (existingAnnouncements.length !== validIds.length) {
        const existingIds = existingAnnouncements.map(a => a.announcement_id);
        const missingIds = validIds.filter(id => !existingIds.includes(id));
        throw new Error(`以下公告不存在: ${missingIds.join(', ')}`);
      }

      // 删除公告
      const [deleteResult] = await connection.execute(
        `DELETE FROM new_arrival_announcements WHERE announcement_id IN (${placeholders})`,
        validIds
      );

      await connection.commit();
      
      return {
        deletedCount: deleteResult.affectedRows,
        deletedIds: validIds
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

  // 获取启用的公告列表（公开接口）
  static async findActive(options = {}) {
    const connection = await dbConnection.getConnection();
    try {
      const { include_products = true } = options;

      // 获取启用的公告
      const [rows] = await connection.execute(
        `SELECT * FROM new_arrival_announcements 
         WHERE is_active = 1 
         ORDER BY created_at DESC`
      );

      // 如果需要包含商品信息
      if (include_products) {
        const announcementsWithProducts = await Promise.all(
          rows.map(async (announcement) => {
            const [productRows] = await connection.execute(
              `SELECT p.product_id, p.name, p.price, p.description, p.category_id, p.tags
               FROM new_arrival_products nap
               INNER JOIN products p ON nap.product_id = p.product_id
               WHERE nap.announcement_id = ?
               ORDER BY nap.id ASC`,
              [announcement.announcement_id]
            );
            announcement.products = productRows;
            return announcement;
          })
        );

        return announcementsWithProducts;
      }

      return rows;
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取公告统计信息
  static async getStats() {
    const connection = await dbConnection.getConnection();
    try {
      const [result] = await connection.execute(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_count
         FROM new_arrival_announcements`
      );
      
      return result[0];
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取安全的公告信息
  toSafeObject() {
    return {
      announcement_id: this.announcement_id,
      content: this.content,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at,
      products: this.products || []
    };
  }
}

module.exports = NewArrivalAnnouncement;

