/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-03 16:50:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-03 16:50:00
 * @FilePath: \showcase-backend-node\src\models\ExploreSelection.js
 * @Description: 精选商品模型
 */

const dbConnection = require('../config/dbConnection');

class ExploreSelection {
  constructor(data) {
    this.selection_id = data.selection_id;
    this.product_id = data.product_id;
    this.sort_order = data.sort_order || 0;
    this.created_at = data.created_at;
  }

  // 获取所有精选商品（包含商品详细信息）
  static async getAll() {
    try {
      const query = `
        SELECT 
          es.selection_id,
          es.product_id,
          es.sort_order,
          es.created_at,
          p.name as product_name,
          p.description as product_description,
          p.price as product_price,
          p.tags as product_tags,
          p.category_id,
          c.name as category_name,
          pi.image_url as main_image
        FROM explore_selections es
        LEFT JOIN products p ON es.product_id = p.product_id
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
        ORDER BY es.sort_order ASC, es.created_at DESC
      `;
      
      const [rows] = await dbConnection.query(query);
      return rows;
    } catch (error) {
      console.error('获取精选商品列表失败:', error);
      throw error;
    }
  }

  // 根据ID获取精选商品
  static async getById(selectionId) {
    try {
      const query = `
        SELECT 
          es.selection_id,
          es.product_id,
          es.sort_order,
          es.created_at,
          p.name as product_name,
          p.description as product_description,
          p.price as product_price,
          p.tags as product_tags,
          p.category_id,
          c.name as category_name,
          pi.image_url as main_image
        FROM explore_selections es
        LEFT JOIN products p ON es.product_id = p.product_id
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
        WHERE es.selection_id = ?
      `;
      
      const [rows] = await dbConnection.query(query, [selectionId]);
      return rows[0] || null;
    } catch (error) {
      console.error('获取精选商品详情失败:', error);
      throw error;
    }
  }

  // 检查商品是否已被精选
  static async isProductSelected(productId) {
    try {
      const query = 'SELECT selection_id FROM explore_selections WHERE product_id = ?';
      const [rows] = await dbConnection.query(query, [productId]);
      return rows.length > 0;
    } catch (error) {
      console.error('检查商品精选状态失败:', error);
      throw error;
    }
  }

  // 添加精选商品
  static async create(data) {
    try {
      const { product_id, sort_order = 0 } = data;
      
      // 检查商品是否存在
      const productQuery = 'SELECT product_id FROM products WHERE product_id = ?';
      const [productRows] = await dbConnection.query(productQuery, [product_id]);
      
      if (productRows.length === 0) {
        throw new Error('商品不存在');
      }

      // 检查是否已被精选
      const isSelected = await this.isProductSelected(product_id);
      if (isSelected) {
        throw new Error('该商品已被精选');
      }

      const query = `
        INSERT INTO explore_selections (product_id, sort_order) 
        VALUES (?, ?)
      `;
      
      const [result] = await dbConnection.query(query, [product_id, sort_order]);
      return result.insertId;
    } catch (error) {
      console.error('添加精选商品失败:', error);
      throw error;
    }
  }

  // 批量创建精选商品
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

            // 检查是否已被精选
            const isSelected = await this.isProductSelected(product_id);
            if (isSelected) {
              skipped.push({
                product_id,
                reason: '该商品已被精选'
              });
              continue;
            }

            // 创建精选商品
            const query = `
              INSERT INTO explore_selections (product_id, sort_order) 
              VALUES (?, ?)
            `;
            
            const [result] = await connection.query(query, [product_id, sort_order]);
            
            // 获取创建的商品详情
            const selectionDetail = await this.getById(result.insertId);
            created.push(selectionDetail);
            
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
      console.error('批量创建精选商品失败:', error);
      throw error;
    }
  }

  // 更新精选商品排序
  static async updateSortOrder(selectionId, sortOrder) {
    try {
      const query = 'UPDATE explore_selections SET sort_order = ? WHERE selection_id = ?';
      const [result] = await dbConnection.query(query, [sortOrder, selectionId]);
      
      if (result.affectedRows === 0) {
        throw new Error('精选商品不存在');
      }
      
      return true;
    } catch (error) {
      console.error('更新精选商品排序失败:', error);
      throw error;
    }
  }

  // 删除精选商品
  static async delete(selectionId) {
    try {
      const query = 'DELETE FROM explore_selections WHERE selection_id = ?';
      const [result] = await dbConnection.query(query, [selectionId]);
      
      if (result.affectedRows === 0) {
        throw new Error('精选商品不存在');
      }
      
      return true;
    } catch (error) {
      console.error('删除精选商品失败:', error);
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
          const query = 'UPDATE explore_selections SET sort_order = ? WHERE selection_id = ?';
          await connection.query(query, [update.sort_order, update.selection_id]);
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
      console.error('批量更新精选商品排序失败:', error);
      throw error;
    }
  }

  // 获取精选商品总数
  static async getCount() {
    try {
      const query = 'SELECT COUNT(*) as count FROM explore_selections';
      const [rows] = await dbConnection.query(query);
      return rows[0].count;
    } catch (error) {
      console.error('获取精选商品总数失败:', error);
      throw error;
    }
  }
}

module.exports = ExploreSelection;
