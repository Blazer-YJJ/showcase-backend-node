/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-11 17:00:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-11 17:00:00
 * @FilePath: \showcase-backend-node\src\models\OrderItem.js
 * @Description: 订单项模型（订单中的商品项）
 */

const dbConnection = require('../config/dbConnection');

class OrderItem {
  constructor(data) {
    this.order_item_id = data.order_item_id;
    this.order_id = data.order_id;
    this.product_id = data.product_id;
    this.quantity = data.quantity || 1;
    this.item_note = data.item_note;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    // 关联数据
    this.product = data.product;
  }

  // 批量创建订单项
  // connection: 可选，如果提供则使用提供的连接（用于事务），否则创建新连接
  static async createBatch(orderId, items, connection = null) {
    const shouldReleaseConnection = !connection;
    if (!connection) {
      connection = await dbConnection.getConnection();
    }
    
    try {
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('订单项不能为空');
      }

      // 验证所有商品是否存在
      const productIds = items.map(item => item.product_id);
      const productPlaceholders = productIds.map(() => '?').join(',');
      const [productRows] = await connection.execute(
        `SELECT product_id FROM products WHERE product_id IN (${productPlaceholders})`,
        productIds
      );

      if (productRows.length !== productIds.length) {
        const existingIds = productRows.map(row => row.product_id);
        const missingIds = productIds.filter(id => !existingIds.includes(id));
        throw new Error(`商品不存在: ${missingIds.join(', ')}`);
      }

      // 批量插入订单项
      const insertPlaceholders = items.map(() => '(?, ?, ?, ?)').join(',');
      const insertValues = [];
      items.forEach(item => {
        const quantity = item.quantity !== undefined && item.quantity !== null ? parseInt(item.quantity) : 1;
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error('商品数量必须是大于0的正整数');
        }
        insertValues.push(orderId, item.product_id, quantity, item.item_note || null);
      });

      const [result] = await connection.execute(
        `INSERT INTO order_items (order_id, product_id, quantity, item_note) VALUES ${insertPlaceholders}`,
        insertValues
      );

      // 返回创建的订单项ID列表
      const insertedIds = [];
      for (let i = 0; i < items.length; i++) {
        insertedIds.push(result.insertId + i);
      }

      return insertedIds;
    } catch (error) {
      throw error;
    } finally {
      if (shouldReleaseConnection) {
        connection.release();
      }
    }
  }

  // 根据订单ID获取所有订单项
  static async findByOrderId(orderId) {
    const connection = await dbConnection.getConnection();
    try {
      const sql = `
        SELECT 
          oi.*,
          p.name as product_name, 
          p.price as product_price, 
          p.description as product_description,
          p.category_id as product_category_id,
          c.name as category_name,
          c.parent_id as category_parent_id,
          c.level as category_level,
          pi.image_url as product_image_url
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.product_id
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
        WHERE oi.order_id = ?
        ORDER BY oi.order_item_id ASC
      `;

      const [rows] = await connection.execute(sql, [orderId]);

      return rows.map(item => ({
        order_item_id: item.order_item_id,
        order_id: item.order_id,
        product_id: item.product_id,
        quantity: item.quantity || 1,
        item_note: item.item_note,
        created_at: item.created_at,
        updated_at: item.updated_at,
        product: {
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
        }
      }));
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // 根据订单ID删除所有订单项
  static async deleteByOrderId(orderId) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        'DELETE FROM order_items WHERE order_id = ?',
        [orderId]
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

  // 更新订单项
  static async update(orderItemId, updateData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      const { quantity, item_note } = updateData;
      const updateFields = [];
      const updateValues = [];

      if (quantity !== undefined && quantity !== null) {
        const qty = parseInt(quantity);
        if (isNaN(qty) || qty <= 0) {
          throw new Error('商品数量必须是大于0的正整数');
        }
        updateFields.push('quantity = ?');
        updateValues.push(qty);
      }

      if (item_note !== undefined) {
        updateFields.push('item_note = ?');
        updateValues.push(item_note);
      }

      if (updateFields.length === 0) {
        throw new Error('没有要更新的字段');
      }

      updateValues.push(orderItemId);

      const [result] = await connection.execute(
        `UPDATE order_items SET ${updateFields.join(', ')} WHERE order_item_id = ?`,
        updateValues
      );

      await connection.commit();

      if (result.affectedRows === 0) {
        throw new Error('更新失败');
      }

      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = OrderItem;

