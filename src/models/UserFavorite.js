/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-11-07 10:50:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-11-07 10:50:00
 * @FilePath: \showcase-backend-node\src\models\UserFavorite.js
 * @Description: 用户商品收藏模型
 */

const dbConnection = require('../config/dbConnection');

class UserFavorite {
  constructor(data) {
    this.favorite_id = data.favorite_id;
    this.user_id = data.user_id;
    this.product_id = data.product_id;
    this.created_at = data.created_at;
  }

  // 添加收藏
  static async create(favoriteData) {
    try {
      const { user_id, product_id } = favoriteData;

      // 验证必填字段
      if (!user_id || isNaN(user_id)) {
        throw new Error('用户ID不能为空且必须是有效数字');
      }

      if (!product_id || isNaN(product_id)) {
        throw new Error('商品ID不能为空且必须是有效数字');
      }

      // 验证用户是否存在
      const userResult = await dbConnection.query(
        'SELECT user_id FROM users WHERE user_id = ?',
        [user_id]
      );
      if (userResult[0].length === 0) {
        throw new Error('用户不存在');
      }

      // 验证商品是否存在
      const productResult = await dbConnection.query(
        'SELECT product_id FROM products WHERE product_id = ?',
        [product_id]
      );
      if (productResult[0].length === 0) {
        throw new Error('商品不存在');
      }

      // 检查是否已经收藏
      const existingFavorite = await this.findByUserAndProduct(user_id, product_id);
      if (existingFavorite) {
        throw new Error('该商品已经收藏过了');
      }

      const query = `
        INSERT INTO user_favorites (user_id, product_id)
        VALUES (?, ?)
      `;
      
      const values = [user_id, product_id];
      const result = await dbConnection.query(query, values);

      // result[0] 是 ResultSetHeader，包含 insertId 属性
      const insertId = result[0]?.insertId || result[0];
      return await this.findById(insertId);
    } catch (error) {
      throw error;
    }
  }

  // 根据用户ID和商品ID查找收藏
  static async findByUserAndProduct(userId, productId) {
    try {
      if (!userId || isNaN(userId)) {
        throw new Error('用户ID不能为空且必须是有效数字');
      }

      if (!productId || isNaN(productId)) {
        throw new Error('商品ID不能为空且必须是有效数字');
      }

      const query = `
        SELECT favorite_id, user_id, product_id, created_at
        FROM user_favorites
        WHERE user_id = ? AND product_id = ?
      `;
      
      const result = await dbConnection.query(query, [userId, productId]);
      
      if (result[0].length === 0) {
        return null;
      }

      return new UserFavorite(result[0][0]);
    } catch (error) {
      throw error;
    }
  }

  // 根据ID获取收藏
  static async findById(favoriteId) {
    try {
      if (!favoriteId || isNaN(favoriteId)) {
        throw new Error('收藏ID不能为空且必须是有效数字');
      }

      const query = `
        SELECT favorite_id, user_id, product_id, created_at
        FROM user_favorites
        WHERE favorite_id = ?
      `;
      
      const result = await dbConnection.query(query, [favoriteId]);
      
      if (result[0].length === 0) {
        return null;
      }

      return new UserFavorite(result[0][0]);
    } catch (error) {
      throw error;
    }
  }

  // 获取用户的所有收藏（带商品信息）
  static async findByUserId(userId, options = {}) {
    try {
      if (!userId || isNaN(userId)) {
        throw new Error('用户ID不能为空且必须是有效数字');
      }

      const {
        page = 1,
        limit = 20,
        order_by = 'created_at',
        order = 'DESC'
      } = options;

      const offset = (page - 1) * limit;

      // 验证排序字段
      const validOrderFields = ['created_at', 'favorite_id'];
      const orderBy = validOrderFields.includes(order_by) ? order_by : 'created_at';
      const orderDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM user_favorites
        WHERE user_id = ?
      `;
      
      const countResult = await dbConnection.query(countQuery, [userId]);
      const total = countResult[0][0].total;

      // 获取收藏列表（包含商品信息）
      const query = `
        SELECT 
          f.favorite_id,
          f.user_id,
          f.product_id,
          f.created_at,
          p.name as product_name,
          p.description as product_description,
          p.price as product_price,
          p.category_id,
          c.name as category_name
        FROM user_favorites f
        INNER JOIN products p ON f.product_id = p.product_id
        LEFT JOIN categories c ON p.category_id = c.category_id
        WHERE f.user_id = ?
        ORDER BY f.${orderBy} ${orderDirection}
        LIMIT ? OFFSET ?
      `;
      
      const result = await dbConnection.query(query, [userId, limit, offset]);
      const favorites = result[0] || [];

      // 为每个收藏获取商品图片
      const favoritesWithImages = await Promise.all(
        favorites.map(async (favorite) => {
          const imagesQuery = `
            SELECT image_id, image_url, image_type, sort_order
            FROM product_images
            WHERE product_id = ?
            ORDER BY sort_order ASC, created_at ASC
            LIMIT 1
          `;
          
          const images = await dbConnection.query(imagesQuery, [favorite.product_id]);
          const mainImage = images[0] && images[0].length > 0 ? images[0][0] : null;
          
          return {
            favorite_id: favorite.favorite_id,
            user_id: favorite.user_id,
            product_id: favorite.product_id,
            created_at: favorite.created_at,
            product: {
              product_id: favorite.product_id,
              name: favorite.product_name,
              description: favorite.product_description,
              price: favorite.product_price,
              category_id: favorite.category_id,
              category_name: favorite.category_name,
              main_image: mainImage ? {
                image_id: mainImage.image_id,
                image_url: mainImage.image_url,
                image_type: mainImage.image_type
              } : null
            }
          };
        })
      );

      return {
        favorites: favoritesWithImages,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // 检查用户是否收藏了某个商品
  static async isFavorite(userId, productId) {
    try {
      const favorite = await this.findByUserAndProduct(userId, productId);
      return favorite !== null;
    } catch (error) {
      throw error;
    }
  }

  // 删除收藏
  static async delete(userId, productId) {
    try {
      if (!userId || isNaN(userId)) {
        throw new Error('用户ID不能为空且必须是有效数字');
      }

      if (!productId || isNaN(productId)) {
        throw new Error('商品ID不能为空且必须是有效数字');
      }

      // 检查收藏是否存在
      const favorite = await this.findByUserAndProduct(userId, productId);
      if (!favorite) {
        throw new Error('收藏不存在');
      }

      const query = 'DELETE FROM user_favorites WHERE user_id = ? AND product_id = ?';
      await dbConnection.query(query, [userId, productId]);

      return {
        favorite_id: favorite.favorite_id,
        message: '取消收藏成功'
      };
    } catch (error) {
      throw error;
    }
  }

  // 批量删除收藏
  static async batchDelete(userId, productIds) {
    try {
      if (!userId || isNaN(userId)) {
        throw new Error('用户ID不能为空且必须是有效数字');
      }

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        throw new Error('商品ID列表不能为空');
      }

      // 验证商品ID格式
      const validProductIds = productIds
        .map(id => parseInt(id))
        .filter(id => !isNaN(id) && id > 0);

      if (validProductIds.length === 0) {
        throw new Error('没有有效的商品ID');
      }

      // 构建占位符
      const placeholders = validProductIds.map(() => '?').join(',');

      const query = `
        DELETE FROM user_favorites 
        WHERE user_id = ? AND product_id IN (${placeholders})
      `;
      
      const result = await dbConnection.query(query, [userId, ...validProductIds]);

      return {
        deleted_count: result[0].affectedRows || 0,
        message: `成功取消收藏 ${result[0].affectedRows || 0} 个商品`
      };
    } catch (error) {
      throw error;
    }
  }

  // 转换为安全对象（用于API响应）
  toSafeObject() {
    return {
      favorite_id: this.favorite_id,
      user_id: this.user_id,
      product_id: this.product_id,
      created_at: this.created_at
    };
  }
}

module.exports = UserFavorite;

