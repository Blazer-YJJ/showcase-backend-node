/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\models\Banner.js
 * @Description: 轮播图模型
 */

const dbConnection = require('../config/dbConnection');

class Banner {
  constructor(data) {
    this.banner_id = data.banner_id;
    this.title = data.title;
    this.description = data.description;
    this.image_url = data.image_url;
    this.sort_order = data.sort_order;
    this.is_active = data.is_active !== undefined ? data.is_active : true; // 默认启用
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // 创建轮播图
  static async create(bannerData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      const {
        title,
        description = null,
        image_url,
        sort_order = 0
      } = bannerData;

      // 验证必填字段
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        throw new Error('轮播图标题不能为空');
      }

      if (!image_url || typeof image_url !== 'string' || image_url.trim().length === 0) {
        throw new Error('轮播图图片路径不能为空');
      }

      // 验证排序权重
      const sortValue = parseInt(sort_order);
      if (isNaN(sortValue) || sortValue < 0) {
        throw new Error('排序权重必须是非负整数');
      }

      // 插入轮播图数据
      const [result] = await connection.execute(
        `INSERT INTO banners (title, description, image_url, sort_order) 
         VALUES (?, ?, ?, ?)`,
        [
          title.trim(),
          description ? description.trim() : null,
          image_url.trim(),
          sortValue
        ]
      );

      await connection.commit();

      return {
        banner_id: result.insertId,
        title: title.trim(),
        description: description ? description.trim() : null,
        image_url: image_url.trim(),
        sort_order: sortValue,
        is_active: true, // 新创建的轮播图默认启用
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 根据ID获取轮播图
  static async findById(bannerId) {
    const connection = await dbConnection.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT *, 1 as is_active FROM banners WHERE banner_id = ?',
        [bannerId]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取轮播图列表（分页）
  static async findAll(options = {}) {
    const connection = await dbConnection.getConnection();
    try {
      const {
        page = 1,
        limit = 10
      } = options;

      const offset = (page - 1) * limit;

      // 获取总数
      const [countRows] = await connection.execute(
        'SELECT COUNT(*) as total FROM banners'
      );
      const total = countRows[0].total;

      // 获取数据（添加默认的is_active字段）
      const [rows] = await connection.execute(
        `SELECT *, 1 as is_active FROM banners 
         ORDER BY sort_order ASC, created_at DESC 
         LIMIT ${parseInt(offset)}, ${parseInt(limit)}`
      );

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

  // 更新轮播图
  static async update(bannerId, updateData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 检查记录是否存在
      const existing = await this.findById(bannerId);
      if (!existing) {
        throw new Error('轮播图不存在');
      }

      const {
        title,
        description,
        image_url,
        sort_order
      } = updateData;

      // 构建更新字段
      const updateFields = [];
      const updateValues = [];

      if (title !== undefined) {
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
          throw new Error('轮播图标题不能为空');
        }
        updateFields.push('title = ?');
        updateValues.push(title.trim());
      }

      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description ? description.trim() : null);
      }

      if (image_url !== undefined) {
        if (!image_url || typeof image_url !== 'string' || image_url.trim().length === 0) {
          throw new Error('轮播图图片路径不能为空');
        }
        updateFields.push('image_url = ?');
        updateValues.push(image_url.trim());
      }

      if (sort_order !== undefined) {
        const sortValue = parseInt(sort_order);
        if (isNaN(sortValue) || sortValue < 0) {
          throw new Error('排序权重必须是非负整数');
        }
        updateFields.push('sort_order = ?');
        updateValues.push(sortValue);
      }

      if (updateFields.length === 0) {
        throw new Error('至少需要提供一个更新字段');
      }

      // 添加更新时间
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(bannerId);

      // 执行更新
      const [result] = await connection.execute(
        `UPDATE banners SET ${updateFields.join(', ')} WHERE banner_id = ?`,
        [...updateValues]
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

  // 更新轮播图排序
  static async updateSort(bannerId, sortOrder) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 检查记录是否存在
      const existing = await this.findById(bannerId);
      if (!existing) {
        throw new Error('轮播图不存在');
      }

      // 验证排序权重
      const sortValue = parseInt(sortOrder);
      if (isNaN(sortValue) || sortValue < 0) {
        throw new Error('排序权重必须是非负整数');
      }

      // 更新排序
      const [result] = await connection.execute(
        'UPDATE banners SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE banner_id = ?',
        [sortValue, bannerId]
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

  // 删除轮播图
  static async delete(bannerId) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 检查记录是否存在
      const existing = await this.findById(bannerId);
      if (!existing) {
        throw new Error('轮播图不存在');
      }

      // 删除记录
      const [result] = await connection.execute(
        'DELETE FROM banners WHERE banner_id = ?',
        [bannerId]
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

  // 批量删除轮播图
  static async batchDelete(bannerIds) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      if (!Array.isArray(bannerIds) || bannerIds.length === 0) {
        throw new Error('轮播图ID数组不能为空');
      }

      // 验证所有ID都是有效数字
      const invalidIds = bannerIds.filter(id => isNaN(id) || parseInt(id) <= 0);
      if (invalidIds.length > 0) {
        throw new Error(`无效的轮播图ID: ${invalidIds.join(', ')}`);
      }

      // 批量删除
      const placeholders = bannerIds.map(() => '?').join(',');
      const [result] = await connection.execute(
        `DELETE FROM banners WHERE banner_id IN (${placeholders})`,
        bannerIds
      );

      await connection.commit();

      return {
        deletedCount: result.affectedRows,
        requestedIds: bannerIds.length
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Banner;


