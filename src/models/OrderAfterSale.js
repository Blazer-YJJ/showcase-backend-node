/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-11-06 00:00:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-11-06 00:00:00
 * @FilePath: \showcase-backend-node\src\models\OrderAfterSale.js
 * @Description: 订单售后模型
 */

const dbConnection = require('../config/dbConnection');

class OrderAfterSale {
  constructor(data) {
    this.after_sale_id = data.after_sale_id;
    this.order_id = data.order_id;
    this.reason = data.reason;
    this.content = data.content;
    this.status = data.status;
    this.start_time = data.start_time;
    this.end_time = data.end_time;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    // 关联数据
    this.order = data.order;
    this.products = data.products || [];
  }

  // 创建售后
  static async create(afterSaleData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      const {
        order_id,
        product_ids, // 商品ID数组
        reason,
        content = null,
        status = 'pending'
      } = afterSaleData;

      // 验证必填字段
      if (!order_id || isNaN(order_id)) {
        throw new Error('订单ID不能为空且必须是有效数字');
      }

      if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        throw new Error('售后原因不能为空');
      }

      if (reason.length > 200) {
        throw new Error('售后原因不能超过200个字符');
      }

      if (content && typeof content !== 'string') {
        throw new Error('售后具体内容必须是字符串类型');
      }

      // 验证售后状态
      const validStatuses = ['pending', 'processing', 'approved', 'rejected', 'completed'];
      if (!validStatuses.includes(status)) {
        throw new Error(`售后状态必须是以下之一: ${validStatuses.join(', ')}`);
      }

      // 验证订单是否存在
      const [orderRows] = await connection.execute(
        'SELECT order_id, user_id FROM user_orders WHERE order_id = ?',
        [order_id]
      );
      if (orderRows.length === 0) {
        throw new Error('订单不存在');
      }

      // 验证商品ID数组
      if (!Array.isArray(product_ids) || product_ids.length === 0) {
        throw new Error('售后商品不能为空，至少需要一个商品');
      }

      // 验证所有商品是否存在
      const productIds = product_ids.map(id => parseInt(id));
      const invalidIds = productIds.filter(id => isNaN(id) || id <= 0);
      if (invalidIds.length > 0) {
        throw new Error(`无效的商品ID: ${invalidIds.join(', ')}`);
      }

      const placeholders = productIds.map(() => '?').join(',');
      const [productRows] = await connection.execute(
        `SELECT product_id FROM products WHERE product_id IN (${placeholders})`,
        productIds
      );

      if (productRows.length !== productIds.length) {
        const existingIds = productRows.map(row => row.product_id);
        const missingIds = productIds.filter(id => !existingIds.includes(id));
        throw new Error(`商品不存在: ${missingIds.join(', ')}`);
      }

      // 插入售后主表数据
      const [result] = await connection.execute(
        `INSERT INTO order_after_sales (order_id, reason, content, status, start_time) 
         VALUES (?, ?, ?, ?, NOW())`,
        [order_id, reason.trim(), content ? content.trim() : null, status]
      );

      const afterSaleId = result.insertId;

      // 批量插入售后商品关联数据
      const itemPlaceholders = productIds.map(() => '(?, ?)').join(',');
      const itemValues = [];
      productIds.forEach(productId => {
        itemValues.push(afterSaleId, productId);
      });

      await connection.execute(
        `INSERT INTO order_after_sale_items (after_sale_id, product_id) VALUES ${itemPlaceholders}`,
        itemValues
      );

      await connection.commit();

      // 获取创建的售后详情
      const afterSale = await this.findById(afterSaleId);
      return afterSale;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 根据ID获取售后（包含关联信息）
  static async findById(afterSaleId, includeOrder = false) {
    const connection = await dbConnection.getConnection();
    try {
      let sql = `
        SELECT 
          a.*,
          o.user_id, o.order_status, o.order_note
        FROM order_after_sales a
        LEFT JOIN user_orders o ON a.order_id = o.order_id
        WHERE a.after_sale_id = ?
      `;

      const [rows] = await connection.execute(sql, [afterSaleId]);

      if (rows.length === 0) {
        return null;
      }

      const afterSale = rows[0];

      // 获取售后商品列表
      const [itemRows] = await connection.execute(
        `SELECT 
          ai.product_id,
          p.name as product_name,
          p.price as product_price,
          p.description as product_description,
          p.category_id as product_category_id,
          c.name as category_name,
          c.parent_id as category_parent_id,
          c.level as category_level,
          pi.image_url as product_image_url
        FROM order_after_sale_items ai
        LEFT JOIN products p ON ai.product_id = p.product_id
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN (
          SELECT product_id, image_url, 
                 ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY 
                   CASE WHEN image_type = 'main' THEN 0 ELSE 1 END,
                   sort_order ASC, 
                   image_id ASC
                 ) as rn
          FROM product_images 
        ) pi ON p.product_id = pi.product_id AND pi.rn = 1
        WHERE ai.after_sale_id = ?
        ORDER BY ai.id ASC`,
        [afterSaleId]
      );

      const products = itemRows.map(item => ({
        product_id: item.product_id,
        name: item.product_name,
        price: item.product_price,
        description: item.product_description,
        image_url: item.product_image_url || null,
        category: item.category_name ? {
          category_id: item.product_category_id,
          name: item.category_name,
          parent_id: item.category_parent_id,
          level: item.category_level
        } : null
      }));

      // 格式化返回数据
      return {
        after_sale_id: afterSale.after_sale_id,
        order_id: afterSale.order_id,
        reason: afterSale.reason,
        content: afterSale.content,
        status: afterSale.status,
        start_time: afterSale.start_time,
        end_time: afterSale.end_time,
        created_at: afterSale.created_at,
        updated_at: afterSale.updated_at,
        order: includeOrder ? {
          order_id: afterSale.order_id,
          user_id: afterSale.user_id,
          order_status: afterSale.order_status,
          order_note: afterSale.order_note
        } : undefined,
        products: products
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取售后列表（分页）
  static async findAll(options = {}) {
    const connection = await dbConnection.getConnection();
    try {
      const {
        page = 1,
        limit = 10,
        user_id = null,
        order_id = null,
        status = null
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = '';
      let params = [];

      // 构建查询条件
      if (user_id) {
        whereClause = 'WHERE o.user_id = ?';
        params.push(user_id);
      }

      if (order_id) {
        if (whereClause) {
          whereClause += ' AND a.order_id = ?';
        } else {
          whereClause = 'WHERE a.order_id = ?';
        }
        params.push(order_id);
      }

      if (status) {
        if (whereClause) {
          whereClause += ' AND a.status = ?';
        } else {
          whereClause = 'WHERE a.status = ?';
        }
        params.push(status);
      }

      // 获取总数
      const [countRows] = await connection.execute(
        `SELECT COUNT(*) as total 
         FROM order_after_sales a
         LEFT JOIN user_orders o ON a.order_id = o.order_id
         ${whereClause}`,
        params
      );
      const total = countRows[0].total;

      // 获取数据
      const limitValue = parseInt(limit);
      const offsetValue = parseInt(offset);

      let sql = `
        SELECT 
          a.*,
          o.user_id, o.order_status, o.order_note
        FROM order_after_sales a
        LEFT JOIN user_orders o ON a.order_id = o.order_id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT ${limitValue} OFFSET ${offsetValue}
      `;

      const [rows] = await connection.execute(sql, params);

      // 格式化返回数据，为每个售后获取商品列表
      const data = await Promise.all(rows.map(async (afterSale) => {
        // 获取售后商品列表
        const [itemRows] = await connection.execute(
          `SELECT 
            ai.product_id,
            p.name as product_name,
            p.price as product_price,
            p.description as product_description,
            p.category_id as product_category_id,
            c.name as category_name,
            c.parent_id as category_parent_id,
            c.level as category_level,
            pi.image_url as product_image_url
          FROM order_after_sale_items ai
          LEFT JOIN products p ON ai.product_id = p.product_id
          LEFT JOIN categories c ON p.category_id = c.category_id
          LEFT JOIN (
            SELECT product_id, image_url, 
                   ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY 
                     CASE WHEN image_type = 'main' THEN 0 ELSE 1 END,
                     sort_order ASC, 
                     image_id ASC
                   ) as rn
            FROM product_images 
          ) pi ON p.product_id = pi.product_id AND pi.rn = 1
          WHERE ai.after_sale_id = ?
          ORDER BY ai.id ASC`,
          [afterSale.after_sale_id]
        );

        const products = itemRows.map(item => ({
          product_id: item.product_id,
          name: item.product_name,
          price: item.product_price,
          description: item.product_description,
          image_url: item.product_image_url || null,
          category: item.category_name ? {
            category_id: item.product_category_id,
            name: item.category_name,
            parent_id: item.category_parent_id,
            level: item.category_level
          } : null
        }));

        return {
          after_sale_id: afterSale.after_sale_id,
          order_id: afterSale.order_id,
          reason: afterSale.reason,
          content: afterSale.content,
          status: afterSale.status,
          start_time: afterSale.start_time,
          end_time: afterSale.end_time,
          created_at: afterSale.created_at,
          updated_at: afterSale.updated_at,
          order: {
            order_id: afterSale.order_id,
            user_id: afterSale.user_id,
            order_status: afterSale.order_status,
            order_note: afterSale.order_note
          },
          products: products
        };
      }));

      return {
        data,
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

  // 更新售后
  static async update(afterSaleId, updateData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 检查售后是否存在
      const afterSale = await this.findById(afterSaleId);
      if (!afterSale) {
        throw new Error('售后不存在');
      }

      const {
        reason,
        content,
        status,
        product_ids,
        end_time
      } = updateData;

      const updateFields = [];
      const updateValues = [];

      // 构建更新字段
      if (reason !== undefined) {
        if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
          throw new Error('售后原因不能为空');
        }
        if (reason.length > 200) {
          throw new Error('售后原因不能超过200个字符');
        }
        updateFields.push('reason = ?');
        updateValues.push(reason.trim());
      }

      if (content !== undefined) {
        if (content !== null && typeof content !== 'string') {
          throw new Error('售后具体内容必须是字符串类型');
        }
        updateFields.push('content = ?');
        updateValues.push(content ? content.trim() : null);
      }

      if (status !== undefined) {
        const validStatuses = ['pending', 'processing', 'approved', 'rejected', 'completed'];
        if (!validStatuses.includes(status)) {
          throw new Error(`售后状态必须是以下之一: ${validStatuses.join(', ')}`);
        }
        updateFields.push('status = ?');
        updateValues.push(status);

        // 如果状态变为 completed 或 rejected，自动设置结束时间
        if ((status === 'completed' || status === 'rejected') && !end_time) {
          updateFields.push('end_time = NOW()');
        }
      }

      if (end_time !== undefined) {
        if (end_time !== null && !(end_time instanceof Date) && typeof end_time !== 'string') {
          throw new Error('结束时间格式不正确');
        }
        updateFields.push('end_time = ?');
        updateValues.push(end_time);
      }

      // 处理商品更新
      if (product_ids !== undefined) {
        if (!Array.isArray(product_ids) || product_ids.length === 0) {
          throw new Error('售后商品不能为空，至少需要一个商品');
        }

        // 验证所有商品是否存在
        const productIds = product_ids.map(id => parseInt(id));
        const invalidIds = productIds.filter(id => isNaN(id) || id <= 0);
        if (invalidIds.length > 0) {
          throw new Error(`无效的商品ID: ${invalidIds.join(', ')}`);
        }

        const placeholders = productIds.map(() => '?').join(',');
        const [productRows] = await connection.execute(
          `SELECT product_id FROM products WHERE product_id IN (${placeholders})`,
          productIds
        );

        if (productRows.length !== productIds.length) {
          const existingIds = productRows.map(row => row.product_id);
          const missingIds = productIds.filter(id => !existingIds.includes(id));
          throw new Error(`商品不存在: ${missingIds.join(', ')}`);
        }

        // 删除旧的商品关联
        await connection.execute(
          'DELETE FROM order_after_sale_items WHERE after_sale_id = ?',
          [afterSaleId]
        );

        // 插入新的商品关联
        const itemPlaceholders = productIds.map(() => '(?, ?)').join(',');
        const itemValues = [];
        productIds.forEach(productId => {
          itemValues.push(afterSaleId, productId);
        });

        await connection.execute(
          `INSERT INTO order_after_sale_items (after_sale_id, product_id) VALUES ${itemPlaceholders}`,
          itemValues
        );
      }

      if (updateFields.length === 0 && product_ids === undefined) {
        throw new Error('没有要更新的字段');
      }

      // 如果有需要更新主表的字段，执行更新
      if (updateFields.length > 0) {
        updateValues.push(afterSaleId);
        const [result] = await connection.execute(
          `UPDATE order_after_sales SET ${updateFields.join(', ')} WHERE after_sale_id = ?`,
          updateValues
        );

        if (result.affectedRows === 0 && product_ids === undefined) {
          throw new Error('更新失败');
        }
      }

      // 提交事务
      await connection.commit();

      // 返回更新后的售后
      return await this.findById(afterSaleId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 更新售后状态（管理员专用）
  static async updateStatus(afterSaleId, afterSaleStatus) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 验证售后状态
      const validStatuses = ['pending', 'processing', 'approved', 'rejected', 'completed'];
      if (!validStatuses.includes(afterSaleStatus)) {
        throw new Error(`售后状态必须是以下之一: ${validStatuses.join(', ')}`);
      }

      // 检查售后是否存在
      const afterSale = await this.findById(afterSaleId);
      if (!afterSale) {
        throw new Error('售后不存在');
      }

      // 更新售后状态
      const updateFields = ['status = ?'];
      const updateValues = [afterSaleStatus];

      // 如果状态变为 completed 或 rejected，自动设置结束时间
      if (afterSaleStatus === 'completed' || afterSaleStatus === 'rejected') {
        updateFields.push('end_time = NOW()');
      }

      updateValues.push(afterSaleId);
      const [result] = await connection.execute(
        `UPDATE order_after_sales SET ${updateFields.join(', ')} WHERE after_sale_id = ?`,
        updateValues
      );

      await connection.commit();

      if (result.affectedRows === 0) {
        throw new Error('更新售后状态失败');
      }

      // 返回更新后的售后
      return await this.findById(afterSaleId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 删除售后
  static async delete(afterSaleId) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 检查售后是否存在
      const afterSale = await this.findById(afterSaleId);
      if (!afterSale) {
        throw new Error('售后不存在');
      }

      // 删除售后（级联删除会自动删除关联的商品）
      const [result] = await connection.execute(
        'DELETE FROM order_after_sales WHERE after_sale_id = ?',
        [afterSaleId]
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

  // 批量删除售后
  static async batchDelete(afterSaleIds) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      if (!Array.isArray(afterSaleIds) || afterSaleIds.length === 0) {
        throw new Error('售后ID数组不能为空');
      }

      // 验证所有ID都是有效数字
      const invalidIds = afterSaleIds.filter(id => isNaN(id) || parseInt(id) <= 0);
      if (invalidIds.length > 0) {
        throw new Error(`无效的售后ID: ${invalidIds.join(', ')}`);
      }

      // 批量删除
      const placeholders = afterSaleIds.map(() => '?').join(',');
      const [result] = await connection.execute(
        `DELETE FROM order_after_sales WHERE after_sale_id IN (${placeholders})`,
        afterSaleIds
      );

      await connection.commit();

      return {
        deletedCount: result.affectedRows,
        requestedIds: afterSaleIds.length
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = OrderAfterSale;

