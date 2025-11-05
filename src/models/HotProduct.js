/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-03 16:50:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-03 16:50:00
 * @FilePath: \showcase-backend-node\src\models\HotProduct.js
 * @Description: 热门商品模型
 */

const dbConnection = require('../config/dbConnection');

class HotProduct {
  constructor(data) {
    this.hot_id = data.hot_id;
    this.product_id = data.product_id;
    this.sort_order = data.sort_order || 0;
    this.created_at = data.created_at;
  }

  // 获取所有热门商品（包含商品详细信息）
  static async getAll() {
    try {
      const query = `
        SELECT 
          hp.hot_id,
          hp.product_id,
          hp.sort_order,
          hp.created_at,
          p.name as product_name,
          p.description as product_description,
          p.price as product_price,
          p.tags as product_tags,
          p.category_id,
          c.name as category_name,
          pi.image_url as main_image
        FROM hot_products hp
        LEFT JOIN products p ON hp.product_id = p.product_id
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
        ORDER BY hp.sort_order ASC, hp.created_at DESC
      `;
      
      const [rows] = await dbConnection.query(query);
      return rows;
    } catch (error) {
      console.error('获取热门商品列表失败:', error);
      throw error;
    }
  }

  // 根据ID获取热门商品
  static async getById(hotId) {
    try {
      const query = `
        SELECT 
          hp.hot_id,
          hp.product_id,
          hp.sort_order,
          hp.created_at,
          p.name as product_name,
          p.description as product_description,
          p.price as product_price,
          p.tags as product_tags,
          p.category_id,
          c.name as category_name,
          pi.image_url as main_image
        FROM hot_products hp
        LEFT JOIN products p ON hp.product_id = p.product_id
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
        WHERE hp.hot_id = ?
      `;
      
      const [rows] = await dbConnection.query(query, [hotId]);
      return rows[0] || null;
    } catch (error) {
      console.error('获取热门商品详情失败:', error);
      throw error;
    }
  }

  // 检查商品是否已被设为热门
  static async isProductHot(productId) {
    try {
      const query = 'SELECT hot_id FROM hot_products WHERE product_id = ?';
      const [rows] = await dbConnection.query(query, [productId]);
      return rows.length > 0;
    } catch (error) {
      console.error('检查商品热门状态失败:', error);
      throw error;
    }
  }

  // 添加热门商品
  static async create(data) {
    try {
      const { product_id, sort_order = 0 } = data;
      
      // 检查商品是否存在
      const productQuery = 'SELECT product_id FROM products WHERE product_id = ?';
      const [productRows] = await dbConnection.query(productQuery, [product_id]);
      
      if (productRows.length === 0) {
        throw new Error('商品不存在');
      }

      // 检查是否已被设为热门
      const isHot = await this.isProductHot(product_id);
      if (isHot) {
        throw new Error('该商品已是热门商品');
      }

      const query = `
        INSERT INTO hot_products (product_id, sort_order) 
        VALUES (?, ?)
      `;
      
      const [result] = await dbConnection.query(query, [product_id, sort_order]);
      return result.insertId;
    } catch (error) {
      console.error('添加热门商品失败:', error);
      throw error;
    }
  }

  // 批量创建热门商品
  static async batchCreate(data) {
    try {
      const { product_ids, sort_order_start = 0 } = data;
      
      if (!Array.isArray(product_ids) || product_ids.length === 0) {
        throw new Error('商品ID数组不能为空');
      }

      const connection = await dbConnection.getConnection();
      
      try {
        await connection.beginTransaction();
        
        const created = [];
        const skipped = [];
        const insertedIds = [];
        
        for (let i = 0; i < product_ids.length; i++) {
          const product_id = product_ids[i];
          const sort_order = sort_order_start + i;
          
          try {
            // 检查商品是否存在
            const productQuery = 'SELECT product_id FROM products WHERE product_id = ?';
            const [productRows] = await connection.query(productQuery, [product_id]);
            
            if (productRows.length === 0) {
              skipped.push({
                product_id,
                reason: '商品不存在'
              });
              continue;
            }

            // 检查是否已被设为热门（在事务中检查）
            const checkQuery = 'SELECT hot_id FROM hot_products WHERE product_id = ?';
            const [checkRows] = await connection.query(checkQuery, [product_id]);
            
            if (checkRows.length > 0) {
              skipped.push({
                product_id,
                reason: '该商品已是热门商品'
              });
              continue;
            }

            // 创建热门商品
            const query = `
              INSERT INTO hot_products (product_id, sort_order) 
              VALUES (?, ?)
            `;
            
            const [result] = await connection.query(query, [product_id, sort_order]);
            insertedIds.push(result.insertId);
            
          } catch (error) {
            skipped.push({
              product_id,
              reason: error.message
            });
          }
        }
        
        await connection.commit();
        
        // 提交事务后，使用全局连接查询完整信息
        for (const insertId of insertedIds) {
          const hotProductDetail = await this.getById(insertId);
          if (hotProductDetail) {
            created.push(hotProductDetail);
          }
        }
        
        return {
          created,
          skipped,
          total_requested: product_ids.length,
          total_created: created.length,
          total_skipped: skipped.length
        };
        
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('批量创建热门商品失败:', error);
      throw error;
    }
  }

  // 更新热门商品排序
  static async updateSortOrder(hotId, sortOrder) {
    try {
      const query = 'UPDATE hot_products SET sort_order = ? WHERE hot_id = ?';
      const [result] = await dbConnection.query(query, [sortOrder, hotId]);
      
      if (result.affectedRows === 0) {
        throw new Error('热门商品不存在');
      }
      
      return true;
    } catch (error) {
      console.error('更新热门商品排序失败:', error);
      throw error;
    }
  }

  // 删除热门商品
  static async delete(hotId) {
    try {
      const query = 'DELETE FROM hot_products WHERE hot_id = ?';
      const [result] = await dbConnection.query(query, [hotId]);
      
      if (result.affectedRows === 0) {
        throw new Error('热门商品不存在');
      }
      
      return true;
    } catch (error) {
      console.error('删除热门商品失败:', error);
      throw error;
    }
  }

  // 批量删除热门商品
  static async batchDelete(hotIds) {
    try {
      if (!Array.isArray(hotIds) || hotIds.length === 0) {
        throw new Error('热门商品ID数组不能为空');
      }

      // 验证所有ID都是有效的数字
      const validIds = hotIds
        .map(id => parseInt(id))
        .filter(id => !isNaN(id) && id > 0);

      if (validIds.length === 0) {
        throw new Error('没有有效的热门商品ID');
      }

      // 去重
      const uniqueIds = [...new Set(validIds)];

      const connection = await dbConnection.getConnection();
      
      try {
        await connection.beginTransaction();
        
        // 先查询要删除的记录，确认它们存在
        const placeholders = uniqueIds.map(() => '?').join(',');
        const checkQuery = `SELECT hot_id FROM hot_products WHERE hot_id IN (${placeholders})`;
        const [existingRows] = await connection.query(checkQuery, uniqueIds);
        
        const existingIds = existingRows.map(row => row.hot_id);
        const notFoundIds = uniqueIds.filter(id => !existingIds.includes(id));
        
        // 执行删除
        const deleteQuery = `DELETE FROM hot_products WHERE hot_id IN (${placeholders})`;
        const [result] = await connection.query(deleteQuery, uniqueIds);
        
        await connection.commit();
        
        return {
          deleted: existingIds,
          not_found: notFoundIds,
          total_requested: hotIds.length,
          total_deleted: result.affectedRows,
          total_not_found: notFoundIds.length
        };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('批量删除热门商品失败:', error);
      throw error;
    }
  }

  // 批量更新排序
  static async batchUpdateSortOrder(updates) {
    try {
      const connection = await dbConnection.getConnection();
      
      try {
        await connection.beginTransaction();
        
        for (const update of updates) {
          const query = 'UPDATE hot_products SET sort_order = ? WHERE hot_id = ?';
          await connection.query(query, [update.sort_order, update.hot_id]);
        }
        
        await connection.commit();
        return true;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('批量更新热门商品排序失败:', error);
      throw error;
    }
  }

  // 获取热门商品总数
  static async getCount() {
    try {
      const query = 'SELECT COUNT(*) as count FROM hot_products';
      const [rows] = await dbConnection.query(query);
      return rows[0].count;
    } catch (error) {
      console.error('获取热门商品总数失败:', error);
      throw error;
    }
  }
}

module.exports = HotProduct;

