/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-11 17:00:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-11 17:00:00
 * @FilePath: \showcase-backend-node\src\models\Order.js
 * @Description: 订单模型
 */

const dbConnection = require('../config/dbConnection');
const OrderItem = require('./OrderItem');

class Order {
  constructor(data) {
    this.order_id = data.order_id;
    this.user_id = data.user_id;
    this.address_id = data.address_id;
    this.order_status = data.order_status;
    this.product_id = data.product_id;
    this.item_note = data.item_note;
    this.order_note = data.order_note;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    // 关联数据
    this.user = data.user;
    this.address = data.address;
    this.product = data.product;
  }

  // 创建订单（支持多个商品）
  static async create(orderData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      const {
        user_id,
        address_id,
        items, // 商品数组：[{product_id, item_note?}]
        order_note = null,
        order_status = 'pending'
      } = orderData;

      // 验证必填字段
      if (!user_id || isNaN(user_id)) {
        throw new Error('用户ID不能为空且必须是有效数字');
      }

      if (!address_id || isNaN(address_id)) {
        throw new Error('地址ID不能为空且必须是有效数字');
      }

      // 验证商品数组
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('订单商品不能为空，至少需要一个商品');
      }

      // 验证每个商品项
      let totalQuantity = 0;
      for (const item of items) {
        if (!item.product_id || isNaN(item.product_id)) {
          throw new Error('商品ID不能为空且必须是有效数字');
        }
        
        // 验证商品数量（可选，默认为1）
        const quantity = item.quantity !== undefined && item.quantity !== null ? parseInt(item.quantity) : 1;
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error('商品数量必须是大于0的正整数');
        }
        if (quantity > 9999) {
          throw new Error('商品数量不能超过9999');
        }
        totalQuantity += quantity;
        
        if (item.item_note !== undefined && typeof item.item_note !== 'string') {
          throw new Error('商品备注必须是字符串类型');
        }
        if (item.item_note && item.item_note.length > 1000) {
          throw new Error('商品备注不能超过1000个字符');
        }
      }

      // 验证订单状态
      const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(order_status)) {
        throw new Error(`订单状态必须是以下之一: ${validStatuses.join(', ')}`);
      }

      // 验证用户是否存在
      const [userRows] = await connection.execute(
        'SELECT user_id FROM users WHERE user_id = ?',
        [user_id]
      );
      if (userRows.length === 0) {
        throw new Error('用户不存在');
      }

      // 验证地址是否存在且属于该用户
      const [addressRows] = await connection.execute(
        'SELECT address_id FROM user_addresses WHERE address_id = ? AND user_id = ?',
        [address_id, user_id]
      );
      if (addressRows.length === 0) {
        throw new Error('地址不存在或不属于该用户');
      }

      // 验证所有商品是否存在
      const productIds = items.map(item => item.product_id);
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

      // 插入订单主表数据（保留product_id和item_note字段以兼容旧数据，但使用第一个商品）
      const [result] = await connection.execute(
        `INSERT INTO user_orders (user_id, address_id, product_id, order_status, item_note, order_note, total_quantity) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, address_id, items[0].product_id, order_status, items[0].item_note || null, order_note, totalQuantity]
      );

      const orderId = result.insertId;

      // 创建订单项（使用OrderItem模型，传递connection以在同一个事务中执行）
      await OrderItem.createBatch(orderId, items, connection);

      await connection.commit();

      // 获取创建的订单详情
      const order = await this.findById(orderId);
      return order;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 根据ID获取订单（包含关联信息）
  static async findById(orderId, includeUser = false) {
    const connection = await dbConnection.getConnection();
    try {
      let sql = `
        SELECT 
          o.*,
          u.username, u.name as user_name,
          ua.name as address_name, ua.phone as address_phone, ua.address as address_detail
        FROM user_orders o
        LEFT JOIN users u ON o.user_id = u.user_id
        LEFT JOIN user_addresses ua ON o.address_id = ua.address_id
        WHERE o.order_id = ?
      `;

      const [rows] = await connection.execute(sql, [orderId]);

      if (rows.length === 0) {
        return null;
      }

      const order = rows[0];
      
      // 获取订单项（商品列表）
      let items = [];
      try {
        items = await OrderItem.findByOrderId(orderId);
      } catch (error) {
        // 如果order_items表不存在，items保持为空数组
        console.warn('获取订单项失败（可能表不存在）:', error.message);
      }

      // 如果没有订单项，尝试从旧数据获取（向后兼容）
      let items_data = items;
      if (items.length === 0 && order.product_id) {
        // 兼容旧数据：从订单主表获取商品信息（包含图片和分类）
        const [productRows] = await connection.execute(
          `SELECT 
            p.product_id, p.name, p.price, p.description, p.category_id,
            c.name as category_name, c.parent_id as category_parent_id, c.level as category_level,
            pi.image_url as product_image_url
          FROM products p
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
          WHERE p.product_id = ?`,
          [order.product_id]
        );
        if (productRows.length > 0) {
          const p = productRows[0];
          items_data = [{
            order_item_id: null,
            order_id: order.order_id,
            product_id: p.product_id,
            quantity: 1, // 旧数据默认为1
            item_note: order.item_note,
            created_at: order.created_at,
            updated_at: order.updated_at,
            product: {
              product_id: p.product_id,
              name: p.name,
              price: p.price,
              description: p.description,
              image_url: p.product_image_url || null,
              category: p.category_name ? {
                category_id: p.category_id,
                name: p.category_name,
                parent_id: p.category_parent_id,
                level: p.category_level
              } : null
            }
          }];
        }
      }
      
      // 格式化返回数据
      return {
        order_id: order.order_id,
        user_id: order.user_id,
        address_id: order.address_id,
        order_status: order.order_status,
        order_note: order.order_note,
        total_quantity: order.total_quantity || (items_data.length > 0 ? items_data.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0),
        created_at: order.created_at,
        updated_at: order.updated_at,
        user: includeUser ? {
          user_id: order.user_id,
          username: order.username,
          name: order.user_name
        } : undefined,
        address: {
          address_id: order.address_id,
          name: order.address_name,
          phone: order.address_phone,
          address: order.address_detail
        },
        items: items_data // 商品数组
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取订单列表（分页）
  static async findAll(options = {}) {
    const connection = await dbConnection.getConnection();
    try {
      const {
        page = 1,
        limit = 10,
        user_id = null,
        order_status = null
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = '';
      let params = [];

      // 构建查询条件
      if (user_id) {
        whereClause = 'WHERE o.user_id = ?';
        params.push(user_id);
      }

      if (order_status) {
        if (whereClause) {
          whereClause += ' AND o.order_status = ?';
        } else {
          whereClause = 'WHERE o.order_status = ?';
        }
        params.push(order_status);
      }

      // 获取总数
      const [countRows] = await connection.execute(
        `SELECT COUNT(*) as total FROM user_orders o ${whereClause}`,
        params
      );
      const total = countRows[0].total;

      // 获取数据
      const limitValue = parseInt(limit);
      const offsetValue = parseInt(offset);

      let sql = `
        SELECT 
          o.*,
          u.username, u.name as user_name,
          ua.name as address_name, ua.phone as address_phone, ua.address as address_detail
        FROM user_orders o
        LEFT JOIN users u ON o.user_id = u.user_id
        LEFT JOIN user_addresses ua ON o.address_id = ua.address_id
        ${whereClause}
        ORDER BY o.created_at DESC
        LIMIT ${limitValue} OFFSET ${offsetValue}
      `;

      const [rows] = await connection.execute(sql, params);

      // 格式化返回数据，为每个订单获取订单项
      const data = await Promise.all(rows.map(async (order) => {
        // 获取订单项（商品列表）
        let items = [];
        try {
          items = await OrderItem.findByOrderId(order.order_id);
        } catch (error) {
          // 如果order_items表不存在，items保持为空数组
          console.warn(`获取订单${order.order_id}的订单项失败（可能表不存在）:`, error.message);
        }

        // 如果没有订单项，尝试从旧数据获取（向后兼容）
        let items_data = items;
        if (items.length === 0 && order.product_id) {
          // 兼容旧数据：从订单主表获取商品信息（包含图片和分类）
          const [productRows] = await connection.execute(
            `SELECT 
              p.product_id, p.name, p.price, p.description, p.category_id,
              c.name as category_name, c.parent_id as category_parent_id, c.level as category_level,
              pi.image_url as product_image_url
            FROM products p
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
            WHERE p.product_id = ?`,
            [order.product_id]
          );
          if (productRows.length > 0) {
            const p = productRows[0];
            items_data = [{
              order_item_id: null,
              order_id: order.order_id,
              product_id: p.product_id,
              quantity: 1, // 旧数据默认为1
              item_note: order.item_note,
              created_at: order.created_at,
              updated_at: order.updated_at,
              product: {
                product_id: p.product_id,
                name: p.name,
                price: p.price,
                description: p.description,
                image_url: p.product_image_url || null,
                category: p.category_name ? {
                  category_id: p.category_id,
                  name: p.category_name,
                  parent_id: p.category_parent_id,
                  level: p.category_level
                } : null
              }
            }];
          }
        }

        return {
          order_id: order.order_id,
          user_id: order.user_id,
          address_id: order.address_id,
          order_status: order.order_status,
          order_note: order.order_note,
          total_quantity: order.total_quantity || (items_data.length > 0 ? items_data.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0),
          created_at: order.created_at,
          updated_at: order.updated_at,
          user: {
            user_id: order.user_id,
            username: order.username,
            name: order.user_name
          },
          address: {
            address_id: order.address_id,
            name: order.address_name,
            phone: order.address_phone,
            address: order.address_detail
          },
          items: items_data // 商品数组
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

  // 更新订单
  static async update(orderId, updateData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 检查订单是否存在
      const order = await this.findById(orderId);
      if (!order) {
        throw new Error('订单不存在');
      }

      const {
        address_id,
        items, // 商品数组：[{product_id, item_note?}]
        item_note, // 向后兼容：更新第一个订单项的备注
        order_note
      } = updateData;

      const updateFields = [];
      const updateValues = [];

      // 构建更新字段
      if (address_id !== undefined) {
        if (isNaN(address_id)) {
          throw new Error('地址ID必须是有效数字');
        }
        // 验证地址是否存在且属于该用户
        const [addressRows] = await connection.execute(
          'SELECT address_id FROM user_addresses WHERE address_id = ? AND user_id = ?',
          [address_id, order.user_id]
        );
        if (addressRows.length === 0) {
          throw new Error('地址不存在或不属于该用户');
        }
        updateFields.push('address_id = ?');
        updateValues.push(address_id);
      }

      if (order_note !== undefined) {
        updateFields.push('order_note = ?');
        updateValues.push(order_note);
      }

      // 处理订单项更新（items 数组优先级高于 item_note）
      if (items !== undefined) {
        // 验证商品数组
        if (!Array.isArray(items) || items.length === 0) {
          throw new Error('订单商品不能为空，至少需要一个商品');
        }

        // 验证每个商品项并计算总数量
        let totalQuantity = 0;
        for (const item of items) {
          if (!item.product_id || isNaN(item.product_id)) {
            throw new Error('商品ID不能为空且必须是有效数字');
          }
          
          // 验证商品数量（可选，默认为1）
          const quantity = item.quantity !== undefined && item.quantity !== null ? parseInt(item.quantity) : 1;
          if (isNaN(quantity) || quantity <= 0) {
            throw new Error('商品数量必须是大于0的正整数');
          }
          if (quantity > 9999) {
            throw new Error('商品数量不能超过9999');
          }
          totalQuantity += quantity;
          
          if (item.item_note !== undefined && typeof item.item_note !== 'string') {
            throw new Error('商品备注必须是字符串类型');
          }
          if (item.item_note && item.item_note.length > 1000) {
            throw new Error('商品备注不能超过1000个字符');
          }
        }

        // 验证所有商品是否存在
        const productIds = items.map(item => parseInt(item.product_id));
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

        // 检查订单是否有商品项（用于判断数据格式）
        const hasOrderItems = order.items && order.items.length > 0;
        const isOldDataFormat = hasOrderItems && order.items[0].order_item_id === null;

        if (isOldDataFormat) {
          // 旧数据格式：删除旧数据，创建新的订单项
          // 先删除旧的订单项（如果存在）
          try {
            await connection.execute(
              'DELETE FROM order_items WHERE order_id = ?',
              [orderId]
            );
          } catch (error) {
            // 如果表不存在，忽略错误
            console.warn('删除订单项失败（可能表不存在）:', error.message);
          }
        } else {
          // 新数据格式：删除所有现有订单项
          await connection.execute(
            'DELETE FROM order_items WHERE order_id = ?',
            [orderId]
          );
        }

        // 创建新的订单项
        await OrderItem.createBatch(orderId, items, connection);
        
        // 更新订单总数量
        updateFields.push('total_quantity = ?');
        updateValues.push(totalQuantity);
      } else if (item_note !== undefined) {
        // 向后兼容：更新第一个订单项的备注
        // 检查订单是否有商品项
        if (!order.items || order.items.length === 0) {
          throw new Error('订单中没有商品项');
        }

        // 检查是否是旧数据格式（order_item_id 为 null）
        const isOldDataFormat = order.items[0].order_item_id === null;
        
        if (isOldDataFormat) {
          // 旧数据格式：item_note 存储在 user_orders 表中
          updateFields.push('item_note = ?');
          updateValues.push(item_note);
        } else {
          // 新数据格式：item_note 存储在 order_items 表中
          // 获取第一个订单项的 order_item_id
          const firstOrderItemId = order.items[0].order_item_id;
          if (!firstOrderItemId) {
            throw new Error('订单项ID无效');
          }
          
          // 在同一个事务中更新订单项
          const [itemResult] = await connection.execute(
            'UPDATE order_items SET item_note = ? WHERE order_item_id = ?',
            [item_note, firstOrderItemId]
          );
          if (itemResult.affectedRows === 0) {
            throw new Error('更新订单项备注失败');
          }
        }
      }

      if (updateFields.length === 0 && items === undefined && item_note === undefined) {
        throw new Error('没有要更新的字段');
      }

      // 如果有需要更新order表的字段，执行更新
      if (updateFields.length > 0) {
        updateValues.push(orderId);
        const [result] = await connection.execute(
          `UPDATE user_orders SET ${updateFields.join(', ')} WHERE order_id = ?`,
          updateValues
        );

        if (result.affectedRows === 0 && items === undefined && item_note === undefined) {
          throw new Error('更新失败');
        }
      }

      // 提交事务
      await connection.commit();

      // 返回更新后的订单
      return await this.findById(orderId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 更新订单状态（管理员专用）
  static async updateStatus(orderId, orderStatus) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 验证订单状态
      const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(orderStatus)) {
        throw new Error(`订单状态必须是以下之一: ${validStatuses.join(', ')}`);
      }

      // 检查订单是否存在
      const order = await this.findById(orderId);
      if (!order) {
        throw new Error('订单不存在');
      }

      // 更新订单状态
      const [result] = await connection.execute(
        'UPDATE user_orders SET order_status = ? WHERE order_id = ?',
        [orderStatus, orderId]
      );

      await connection.commit();

      if (result.affectedRows === 0) {
        throw new Error('更新订单状态失败');
      }

      // 返回更新后的订单
      return await this.findById(orderId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 删除订单
  static async delete(orderId) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 检查订单是否存在
      const order = await this.findById(orderId);
      if (!order) {
        throw new Error('订单不存在');
      }

      // 删除订单
      const [result] = await connection.execute(
        'DELETE FROM user_orders WHERE order_id = ?',
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

  // 批量删除订单
  static async batchDelete(orderIds) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        throw new Error('订单ID数组不能为空');
      }

      // 验证所有ID都是有效数字
      const invalidIds = orderIds.filter(id => isNaN(id) || parseInt(id) <= 0);
      if (invalidIds.length > 0) {
        throw new Error(`无效的订单ID: ${invalidIds.join(', ')}`);
      }

      // 批量删除
      const placeholders = orderIds.map(() => '?').join(',');
      const [result] = await connection.execute(
        `DELETE FROM user_orders WHERE order_id IN (${placeholders})`,
        orderIds
      );

      await connection.commit();

      return {
        deletedCount: result.affectedRows,
        requestedIds: orderIds.length
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Order;

