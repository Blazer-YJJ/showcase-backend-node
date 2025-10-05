/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-03 16:50:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-03 16:50:00
 * @FilePath: \showcase-backend-node\src\models\MainPromotion.js
 * @Description: 主推款式模型
 */

const dbConnection = require('../config/dbConnection');

class MainPromotion {
  constructor(data) {
    this.promotion_id = data.promotion_id;
    this.product_id = data.product_id;
    this.sort_order = data.sort_order || 0;
    this.created_at = data.created_at;
  }

  // 获取所有主推款式（包含商品详细信息）
  static async getAll() {
    try {
      const query = `
        SELECT 
          mp.promotion_id,
          mp.product_id,
          mp.sort_order,
          mp.created_at,
          p.name as product_name,
          p.description as product_description,
          p.price as product_price,
          p.tags as product_tags,
          p.category_id,
          c.name as category_name,
          pi.image_url as main_image
        FROM main_promotions mp
        LEFT JOIN products p ON mp.product_id = p.product_id
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
        ORDER BY mp.sort_order ASC, mp.created_at DESC
      `;
      
      const [rows] = await dbConnection.query(query);
      return rows;
    } catch (error) {
      console.error('获取主推款式列表失败:', error);
      throw error;
    }
  }

  // 根据ID获取主推款式
  static async getById(promotionId) {
    try {
      const query = `
        SELECT 
          mp.promotion_id,
          mp.product_id,
          mp.sort_order,
          mp.created_at,
          p.name as product_name,
          p.description as product_description,
          p.price as product_price,
          p.tags as product_tags,
          p.category_id,
          c.name as category_name,
          pi.image_url as main_image
        FROM main_promotions mp
        LEFT JOIN products p ON mp.product_id = p.product_id
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
        WHERE mp.promotion_id = ?
      `;
      
      const [rows] = await dbConnection.query(query, [promotionId]);
      return rows[0] || null;
    } catch (error) {
      console.error('获取主推款式详情失败:', error);
      throw error;
    }
  }

  // 检查商品是否已被主推
  static async isProductPromoted(productId) {
    try {
      const query = 'SELECT promotion_id FROM main_promotions WHERE product_id = ?';
      const [rows] = await dbConnection.query(query, [productId]);
      return rows.length > 0;
    } catch (error) {
      console.error('检查商品主推状态失败:', error);
      throw error;
    }
  }

  // 添加主推款式
  static async create(data) {
    try {
      const { product_id, sort_order = 0 } = data;
      
      // 检查商品是否存在
      const productQuery = 'SELECT product_id FROM products WHERE product_id = ?';
      const [productRows] = await dbConnection.query(productQuery, [product_id]);
      
      if (productRows.length === 0) {
        throw new Error('商品不存在');
      }

      // 检查是否已被主推
      const isPromoted = await this.isProductPromoted(product_id);
      if (isPromoted) {
        throw new Error('该商品已被主推');
      }

      const query = `
        INSERT INTO main_promotions (product_id, sort_order) 
        VALUES (?, ?)
      `;
      
      const [result] = await dbConnection.query(query, [product_id, sort_order]);
      return result.insertId;
    } catch (error) {
      console.error('添加主推款式失败:', error);
      throw error;
    }
  }

  // 批量创建主推款式
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

            // 检查是否已被主推
            const isPromoted = await this.isProductPromoted(product_id);
            if (isPromoted) {
              skipped.push({
                product_id,
                reason: '该商品已被主推'
              });
              continue;
            }

            // 创建主推款式
            const query = `
              INSERT INTO main_promotions (product_id, sort_order) 
              VALUES (?, ?)
            `;
            
            const [result] = await connection.query(query, [product_id, sort_order]);
            
            // 获取创建的商品详情
            const promotionDetail = await this.getById(result.insertId);
            created.push(promotionDetail);
            
          } catch (error) {
            skipped.push({
              product_id,
              reason: error.message
            });
          }
        }
        
        await connection.commit();
        
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
      console.error('批量创建主推款式失败:', error);
      throw error;
    }
  }

  // 更新主推款式排序
  static async updateSortOrder(promotionId, sortOrder) {
    try {
      const query = 'UPDATE main_promotions SET sort_order = ? WHERE promotion_id = ?';
      const [result] = await dbConnection.query(query, [sortOrder, promotionId]);
      
      if (result.affectedRows === 0) {
        throw new Error('主推款式不存在');
      }
      
      return true;
    } catch (error) {
      console.error('更新主推款式排序失败:', error);
      throw error;
    }
  }

  // 删除主推款式
  static async delete(promotionId) {
    try {
      const query = 'DELETE FROM main_promotions WHERE promotion_id = ?';
      const [result] = await dbConnection.query(query, [promotionId]);
      
      if (result.affectedRows === 0) {
        throw new Error('主推款式不存在');
      }
      
      return true;
    } catch (error) {
      console.error('删除主推款式失败:', error);
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
          const query = 'UPDATE main_promotions SET sort_order = ? WHERE promotion_id = ?';
          await connection.query(query, [update.sort_order, update.promotion_id]);
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
      console.error('批量更新主推款式排序失败:', error);
      throw error;
    }
  }

  // 获取主推款式总数
  static async getCount() {
    try {
      const query = 'SELECT COUNT(*) as count FROM main_promotions';
      const [rows] = await dbConnection.query(query);
      return rows[0].count;
    } catch (error) {
      console.error('获取主推款式总数失败:', error);
      throw error;
    }
  }
}

module.exports = MainPromotion;
