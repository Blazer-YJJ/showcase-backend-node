/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\controllers\imageSearchController.js
 * @Description: 图像搜索控制器
 */

const imageSearchService = require('../services/imageSearchService');
const dbConnection = require('../config/dbConnection');
const path = require('path');
const fs = require('fs');

class ImageSearchController {
  /**
   * 批量添加商品到百度图库（入库）
   * POST /api/image-search/batch-add
   * Body: { product_ids: [1, 2, 3] }
   */
  static async batchAddProducts(req, res) {
    try {
      const { product_ids } = req.body;

      // 验证参数
      if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '商品ID数组不能为空'
        });
      }

      const connection = await dbConnection.getConnection();
      const results = {
        success: [],
        failed: []
      };

      // 遍历每个商品ID
      for (const productId of product_ids) {
        try {
          // 查询商品信息
          const [products] = await connection.execute(
            'SELECT product_id, name FROM products WHERE product_id = ?',
            [productId]
          );

          if (products.length === 0) {
            results.failed.push({
              product_id: productId,
              reason: '商品不存在'
            });
            continue;
          }

          // 查询商品主图
          const [images] = await connection.execute(
            `SELECT image_url FROM product_images 
             WHERE product_id = ? AND image_type = 'main' 
             ORDER BY sort_order ASC, image_id ASC 
             LIMIT 1`,
            [productId]
          );

          if (images.length === 0) {
            results.failed.push({
              product_id: productId,
              reason: '商品没有主图'
            });
            continue;
          }

          const imageUrl = images[0].image_url;

          // 调用百度API入库
          const addResult = await imageSearchService.addImage(
            imageUrl,
            productId.toString() // 使用商品ID作为brief，便于检索结果匹配
          );

          // 更新数据库中的百度图库信息
          await connection.execute(
            `UPDATE products 
             SET baidu_cont_sign = ?, 
                 baidu_image_search_status = 1, 
                 baidu_image_search_time = NOW() 
             WHERE product_id = ?`,
            [addResult.cont_sign, productId]
          );

          results.success.push({
            product_id: productId,
            cont_sign: addResult.cont_sign
          });
        } catch (error) {
          results.failed.push({
            product_id: productId,
            reason: error.message
          });
        }
      }

      return res.json({
        success: true,
        message: `成功入库 ${results.success.length} 个商品，失败 ${results.failed.length} 个`,
        data: {
          success_count: results.success.length,
          failed_count: results.failed.length,
          success: results.success,
          failed: results.failed
        }
      });
    } catch (error) {
      console.error('批量添加商品到图库失败:', error);
      return res.status(500).json({
        success: false,
        message: '批量添加商品到图库失败: ' + error.message
      });
    }
  }

  /**
   * 图片搜索接口
   * POST /api/image-search/search
   * Body: FormData with 'image' field
   */
  static async searchByImage(req, res) {
    try {
      // 获取上传的图片文件
      const imageFile = req.file;

      if (!imageFile) {
        return res.status(400).json({
          success: false,
          message: '请上传图片文件'
        });
      }

      // 验证文件类型
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
      if (!allowedMimeTypes.includes(imageFile.mimetype)) {
        return res.status(400).json({
          success: false,
          message: '不支持的图片格式，仅支持 JPG、PNG、GIF、WEBP、BMP 格式'
        });
      }

      // 调用百度API搜索相似图片
      const searchResult = await imageSearchService.searchSimilarImages(
        imageFile.buffer, // 使用内存中的图片Buffer
        0, // 页码
        10 // 每页数量（最多10条）
      );

      if (!searchResult.success || !searchResult.results || searchResult.results.length === 0) {
        return res.json({
          success: true,
          message: '未找到相似商品',
          data: {
            results: [],
            total: 0
          }
        });
      }

      const connection = await dbConnection.getConnection();
      const productResults = [];

      // 遍历搜索结果，根据brief（商品ID）匹配商品信息
      for (const item of searchResult.results) {
        try {
          // brief字段存储的是商品ID
          const productId = parseInt(item.brief);
          
          if (!productId || isNaN(productId)) {
            continue;
          }

          // 查询商品信息
          const [products] = await connection.execute(
            `SELECT p.product_id, p.category_id, p.name, p.description, p.price, p.tags,
                    p.baidu_cont_sign, p.baidu_image_search_status, p.baidu_image_search_time
             FROM products p
             WHERE p.product_id = ?`,
            [productId]
          );

          if (products.length === 0) {
            continue;
          }

          const product = products[0];

          // 查询商品主图
          const [images] = await connection.execute(
            `SELECT image_id, image_url, image_type, sort_order
             FROM product_images
             WHERE product_id = ? AND image_type = 'main'
             ORDER BY sort_order ASC, image_id ASC
             LIMIT 1`,
            [productId]
          );

          // 查询商品所有图片
          const [allImages] = await connection.execute(
            `SELECT image_id, image_url, image_type, sort_order
             FROM product_images
             WHERE product_id = ?
             ORDER BY 
               CASE WHEN image_type = 'main' THEN 0 ELSE 1 END,
               sort_order ASC, image_id ASC`,
            [productId]
          );

          // 查询商品参数
          const [params] = await connection.execute(
            `SELECT param_id, param_key, param_value
             FROM product_params
             WHERE product_id = ?
             ORDER BY param_id ASC`,
            [productId]
          );

          productResults.push({
            product_id: product.product_id,
            category_id: product.category_id,
            name: product.name,
            description: product.description,
            price: parseFloat(product.price),
            tags: product.tags,
            main_image: images.length > 0 ? images[0].image_url : null,
            images: allImages.map(img => ({
              image_id: img.image_id,
              image_url: img.image_url,
              image_type: img.image_type,
              sort_order: img.sort_order
            })),
            params: params.map(param => ({
              param_key: param.param_key,
              param_value: param.param_value
            })),
            similarity: item.score || 0, // 相似度分数
            cont_sign: item.cont_sign || null
          });
        } catch (error) {
          console.error(`处理搜索结果项失败 (brief: ${item.brief}):`, error);
          // 继续处理下一个结果
          continue;
        }
      }

      // 按相似度降序排序
      productResults.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

      return res.json({
        success: true,
        message: `找到 ${productResults.length} 个相似商品`,
        data: {
          results: productResults,
          total: productResults.length
        }
      });
    } catch (error) {
      console.error('图片搜索失败:', error);
      return res.status(500).json({
        success: false,
        message: '图片搜索失败: ' + error.message
      });
    }
  }

  /**
   * 批量从百度图库删除商品图片
   * POST /api/image-search/batch-delete
   * Body: { product_ids: [1, 2, 3] }
   */
  static async batchDeleteProducts(req, res) {
    try {
      const { product_ids } = req.body;

      // 验证参数
      if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '商品ID数组不能为空'
        });
      }

      const connection = await dbConnection.getConnection();
      const results = {
        success: [],
        failed: []
      };

      // 遍历每个商品ID
      for (const productId of product_ids) {
        try {
          // 查询商品的百度图库签名
          const [products] = await connection.execute(
            'SELECT baidu_cont_sign, baidu_image_search_status FROM products WHERE product_id = ?',
            [productId]
          );

          if (products.length === 0) {
            results.failed.push({
              product_id: productId,
              reason: '商品不存在'
            });
            continue;
          }

          const product = products[0];

          if (!product.baidu_cont_sign) {
            results.failed.push({
              product_id: productId,
              reason: '该商品未入库到百度图库'
            });
            continue;
          }

          // 调用百度API删除图片
          await imageSearchService.deleteImage(product.baidu_cont_sign);

          // 更新数据库状态
          await connection.execute(
            `UPDATE products 
             SET baidu_cont_sign = NULL, 
                 baidu_image_search_status = 0, 
                 baidu_image_search_time = NULL 
             WHERE product_id = ?`,
            [productId]
          );

          results.success.push({
            product_id: productId
          });
        } catch (error) {
          results.failed.push({
            product_id: productId,
            reason: error.message
          });
        }
      }

      return res.json({
        success: true,
        message: `成功删除 ${results.success.length} 个商品，失败 ${results.failed.length} 个`,
        data: {
          success_count: results.success.length,
          failed_count: results.failed.length,
          success: results.success,
          failed: results.failed
        }
      });
    } catch (error) {
      console.error('批量删除商品失败:', error);
      return res.status(500).json({
        success: false,
        message: '批量删除商品失败: ' + error.message
      });
    }
  }

  /**
   * 获取商品的百度图库状态
   * GET /api/image-search/status/:product_id
   */
  static async getProductStatus(req, res) {
    try {
      const { product_id } = req.params;

      if (!product_id) {
        return res.status(400).json({
          success: false,
          message: '商品ID不能为空'
        });
      }

      const connection = await dbConnection.getConnection();

      const [products] = await connection.execute(
        `SELECT product_id, name, baidu_cont_sign, baidu_image_search_status, baidu_image_search_time
         FROM products 
         WHERE product_id = ?`,
        [product_id]
      );

      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: '商品不存在'
        });
      }

      const product = products[0];

      return res.json({
        success: true,
        data: {
          product_id: product.product_id,
          name: product.name,
          baidu_cont_sign: product.baidu_cont_sign,
          baidu_image_search_status: product.baidu_image_search_status,
          baidu_image_search_time: product.baidu_image_search_time,
          status_text: product.baidu_image_search_status === 1 ? '已入库' : 
                      product.baidu_image_search_status === 2 ? '入库失败' : '未入库'
        }
      });
    } catch (error) {
      console.error('获取商品状态失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取商品状态失败: ' + error.message
      });
    }
  }

  /**
   * 获取未入库商品列表
   * GET /api/image-search/not-indexed
   * Query: page, limit, name, category_id
   */
  static async getNotIndexedProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        name,
        category_id
      } = req.query;

      // 验证分页参数
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
          success: false,
          message: '页码必须是大于0的数字'
        });
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: '每页数量必须是1-100之间的数字'
        });
      }

      const connection = await dbConnection.getConnection();
      const offset = (pageNum - 1) * limitNum;

      try {
        // 构建查询条件
        let whereConditions = ['p.baidu_cont_sign IS NULL'];
        const queryParams = [];

        if (name) {
          whereConditions.push('p.name LIKE ?');
          queryParams.push(`%${name}%`);
        }

        if (category_id) {
          const categoryIdNum = parseInt(category_id);
          if (!isNaN(categoryIdNum)) {
            whereConditions.push('p.category_id = ?');
            queryParams.push(categoryIdNum);
          }
        }

        const whereClause = whereConditions.join(' AND ');

        // 查询总数
        const [countResult] = await connection.execute(
          `SELECT COUNT(*) as total
           FROM products p
           WHERE ${whereClause}`,
          queryParams
        );
        const total = countResult[0].total;

        // 查询商品列表
        const [products] = await connection.execute(
          `SELECT p.product_id, p.category_id, p.name, p.description, p.price, p.tags,
                  p.baidu_cont_sign, p.baidu_image_search_status, p.baidu_image_search_time,
                  c.name as category_name
           FROM products p
           LEFT JOIN categories c ON p.category_id = c.category_id
           WHERE ${whereClause}
           ORDER BY p.product_id DESC
           LIMIT ${limitNum} OFFSET ${offset}`,
          queryParams
        );

        // 为每个商品获取主图
        const productsWithImages = await Promise.all(
          products.map(async (product) => {
            const [images] = await connection.execute(
              `SELECT image_id, image_url, image_type, sort_order
               FROM product_images
               WHERE product_id = ? AND image_type = 'main'
               ORDER BY sort_order ASC, image_id ASC
               LIMIT 1`,
              [product.product_id]
            );

            return {
              product_id: product.product_id,
              category_id: product.category_id,
              category_name: product.category_name,
              name: product.name,
              description: product.description,
              price: parseFloat(product.price),
              tags: product.tags,
              baidu_cont_sign: product.baidu_cont_sign,
              baidu_image_search_status: product.baidu_image_search_status,
              baidu_image_search_time: product.baidu_image_search_time,
              main_image: images.length > 0 ? images[0].image_url : null
            };
          })
        );

        // 计算分页信息
        const totalPages = Math.ceil(total / limitNum);

        // 禁用缓存，确保每次都能获取最新数据
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });

        return res.json({
          success: true,
          message: '获取未入库商品列表成功',
          data: {
            products: productsWithImages,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: total,
              total_pages: totalPages
            }
          }
        });
      } finally {
        // 确保连接被释放
        connection.release();
      }
    } catch (error) {
      console.error('获取未入库商品列表失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取未入库商品列表失败: ' + error.message
      });
    }
  }

  /**
   * 获取已入库商品列表
   * GET /api/image-search/indexed
   * Query: page, limit, name, category_id
   */
  static async getIndexedProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        name,
        category_id
      } = req.query;

      // 验证分页参数
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
          success: false,
          message: '页码必须是大于0的数字'
        });
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: '每页数量必须是1-100之间的数字'
        });
      }

      const connection = await dbConnection.getConnection();
      const offset = (pageNum - 1) * limitNum;

      try {
        // 构建查询条件
        let whereConditions = ['p.baidu_cont_sign IS NOT NULL'];
        const queryParams = [];

        if (name) {
          whereConditions.push('p.name LIKE ?');
          queryParams.push(`%${name}%`);
        }

        if (category_id) {
          const categoryIdNum = parseInt(category_id);
          if (!isNaN(categoryIdNum)) {
            whereConditions.push('p.category_id = ?');
            queryParams.push(categoryIdNum);
          }
        }

        const whereClause = whereConditions.join(' AND ');

        // 查询总数
        const [countResult] = await connection.execute(
          `SELECT COUNT(*) as total
           FROM products p
           WHERE ${whereClause}`,
          queryParams
        );
        const total = countResult[0].total;

        // 查询商品列表
        const [products] = await connection.execute(
          `SELECT p.product_id, p.category_id, p.name, p.description, p.price, p.tags,
                  p.baidu_cont_sign, p.baidu_image_search_status, p.baidu_image_search_time,
                  c.name as category_name
           FROM products p
           LEFT JOIN categories c ON p.category_id = c.category_id
           WHERE ${whereClause}
           ORDER BY p.baidu_image_search_time DESC, p.product_id DESC
           LIMIT ${limitNum} OFFSET ${offset}`,
          queryParams
        );

        // 为每个商品获取主图
        const productsWithImages = await Promise.all(
          products.map(async (product) => {
            const [images] = await connection.execute(
              `SELECT image_id, image_url, image_type, sort_order
               FROM product_images
               WHERE product_id = ? AND image_type = 'main'
               ORDER BY sort_order ASC, image_id ASC
               LIMIT 1`,
              [product.product_id]
            );

            return {
              product_id: product.product_id,
              category_id: product.category_id,
              category_name: product.category_name,
              name: product.name,
              description: product.description,
              price: parseFloat(product.price),
              tags: product.tags,
              baidu_cont_sign: product.baidu_cont_sign,
              baidu_image_search_status: product.baidu_image_search_status,
              baidu_image_search_time: product.baidu_image_search_time,
              main_image: images.length > 0 ? images[0].image_url : null
            };
          })
        );

        // 计算分页信息
        const totalPages = Math.ceil(total / limitNum);

        // 禁用缓存，确保每次都能获取最新数据
        res.set({
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });

        return res.json({
          success: true,
          message: '获取已入库商品列表成功',
          data: {
            products: productsWithImages,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total: total,
              total_pages: totalPages
            }
          }
        });
      } finally {
        // 确保连接被释放
        connection.release();
      }
    } catch (error) {
      console.error('获取已入库商品列表失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取已入库商品列表失败: ' + error.message
      });
    }
  }
}

module.exports = ImageSearchController;

