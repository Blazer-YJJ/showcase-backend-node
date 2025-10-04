/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-04 06:29:06
 * @FilePath: \showcase-backend-node\src\controllers\productController.js
 * @Description: 商品控制器
 */

const Product = require('../models/Product');

class ProductController {
  // 创建商品（支持文件上传）
  static async createProduct(req, res) {
    try {
      // 明确排除 product_id 字段，确保不会从请求体中获取
      const {
        product_id, // 不使用这个字段
        ...bodyData
      } = req.body;
      
      const {
        name,
        description,
        price,
        category_id,
        tags,
        params = []
      } = bodyData;

      // 获取上传的文件
      const files = req.validFiles || [];

      // 验证必填字段
      if (!name) {
        return res.status(400).json({
          success: false,
          message: '商品名称不能为空'
        });
      }

      // description 现在是可选字段，如果为空则使用默认值

      if (!price) {
        return res.status(400).json({
          success: false,
          message: '商品价格不能为空'
        });
      }

      if (!category_id) {
        return res.status(400).json({
          success: false,
          message: '分类ID不能为空'
        });
      }

      // 验证参数格式
      let processedParams = params;
      if (params) {
        // 如果params是字符串，尝试解析为JSON
        if (typeof params === 'string') {
          try {
            processedParams = JSON.parse(params);
          } catch (error) {
            return res.status(400).json({
              success: false,
              message: '参数格式错误，无法解析JSON'
            });
          }
        }
        
        // 验证是否为数组
        if (!Array.isArray(processedParams)) {
          return res.status(400).json({
            success: false,
            message: '参数必须是数组格式'
          });
        }
      }

      // 验证每个参数的格式
      if (processedParams && processedParams.length > 0) {
        for (const param of processedParams) {
          if (!param.param_key || !param.param_value) {
            return res.status(400).json({
              success: false,
              message: '每个参数必须包含param_key和param_value'
            });
          }
        }
      }

      // 处理上传的图片文件
      const images = [];
      if (files && files.length > 0) {
        for (const file of files) {
          // 生成文件路径
          const fileExtension = require('path').extname(file.originalname);
          const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
          const filePath = `/uploads/products/${fileName}`;
          
          // 保存文件到磁盘
          const fs = require('fs');
          const path = require('path');
          const uploadDir = path.join(__dirname, '../../uploads/products');
          
          // 确保目录存在
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          const fullPath = path.join(uploadDir, fileName);
          fs.writeFileSync(fullPath, file.buffer);
          
          // 添加到图片数组
          images.push({
            image_url: filePath,
            image_type: 'sub' // 默认为sub类型
          });
        }
      }

      const product = await Product.create({
        name,
        description: description || '暂无描述',
        price,
        category_id,
        tags,
        params: processedParams,
        images
      });

      res.status(201).json({
        success: true,
        message: '商品创建成功',
        data: product
      });
    } catch (error) {
      console.error('创建商品错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 获取商品列表
  static async getProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        category_id,
        name,
        price_min,
        price_max,
        tags
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

      const result = await Product.findAll({
        page: pageNum,
        limit: limitNum,
        category_id: category_id ? parseInt(category_id) : null,
        name: name || null,
        price_min: price_min ? parseFloat(price_min) : null,
        price_max: price_max ? parseFloat(price_max) : null,
        tags: tags || null
      });

      res.json({
        success: true,
        message: '获取商品列表成功',
        data: result
      });
    } catch (error) {
      console.error('获取商品列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 获取单个商品详情
  static async getProduct(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '商品ID必须是有效数字'
        });
      }

      const product = await Product.findById(parseInt(id));

      if (!product) {
        return res.status(404).json({
          success: false,
          message: '商品不存在'
        });
      }

      res.json({
        success: true,
        message: '获取商品详情成功',
        data: product
      });
    } catch (error) {
      console.error('获取商品详情错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 更新商品（支持文件上传）
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        price,
        category_id,
        tags,
        params
      } = req.body;

      // 获取上传的文件
      const files = req.validFiles || [];

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '商品ID必须是有效数字'
        });
      }

      // 验证参数格式（如果有提供）
      let processedParams = params;
      if (params) {
        // 如果params是字符串，尝试解析为JSON
        if (typeof params === 'string') {
          try {
            processedParams = JSON.parse(params);
          } catch (error) {
            return res.status(400).json({
              success: false,
              message: '参数格式错误，无法解析JSON'
            });
          }
        }
        
        // 验证是否为数组
        if (!Array.isArray(processedParams)) {
          return res.status(400).json({
            success: false,
            message: '参数必须是数组格式'
          });
        }
      }

      // 验证每个参数的格式
      if (processedParams && processedParams.length > 0) {
        for (const param of processedParams) {
          if (!param.param_key || !param.param_value) {
            return res.status(400).json({
              success: false,
              message: '每个参数必须包含param_key和param_value'
            });
          }
        }
      }

      // 处理上传的图片文件
      const images = [];
      if (files && files.length > 0) {
        for (const file of files) {
          // 生成文件路径
          const fileExtension = require('path').extname(file.originalname);
          const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
          const filePath = `/uploads/products/${fileName}`;
          
          // 保存文件到磁盘
          const fs = require('fs');
          const path = require('path');
          const uploadDir = path.join(__dirname, '../../uploads/products');
          
          // 确保目录存在
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          const fullPath = path.join(uploadDir, fileName);
          fs.writeFileSync(fullPath, file.buffer);
          
          // 添加到图片数组
          images.push({
            image_url: filePath,
            image_type: 'sub' // 默认为sub类型
          });
        }
      }

      const product = await Product.update(parseInt(id), {
        name,
        description,
        price,
        category_id,
        tags,
        params: processedParams,
        images: images.length > 0 ? images : undefined
      });

      res.json({
        success: true,
        message: '商品更新成功',
        data: product
      });
    } catch (error) {
      console.error('更新商品错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 删除商品
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '商品ID必须是有效数字'
        });
      }

      const result = await Product.delete(parseInt(id));

      res.json({
        success: true,
        message: '商品删除成功',
        data: result
      });
    } catch (error) {
      console.error('删除商品错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 批量删除商品
  static async batchDeleteProducts(req, res) {
    try {
      const { productIds } = req.body;

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: '商品ID数组不能为空'
        });
      }

      // 验证所有ID都是数字
      const invalidIds = productIds.filter(id => isNaN(id) || parseInt(id) <= 0);
      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: `无效的商品ID: ${invalidIds.join(', ')}`
        });
      }

      const result = await Product.batchDelete(productIds.map(id => parseInt(id)));

      res.json({
        success: true,
        message: `成功删除 ${result.deletedCount} 个商品`,
        data: {
          deletedCount: result.deletedCount,
          deletedIds: result.deletedIds
        }
      });
    } catch (error) {
      console.error('批量删除商品错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 批量创建商品（根据图片名自动命名）
  static async batchCreateProducts(req, res) {
    try {
      const { category_id, images, tags } = req.body;

      // 验证必填字段
      if (!category_id) {
        return res.status(400).json({
          success: false,
          message: '分类ID不能为空'
        });
      }

      if (!images || !Array.isArray(images)) {
        return res.status(400).json({
          success: false,
          message: '图片数组不能为空'
        });
      }

      if (images.length === 0) {
        return res.status(400).json({
          success: false,
          message: '图片数组不能为空'
        });
      }

      if (images.length > 100) {
        return res.status(400).json({
          success: false,
          message: '单次最多上传100张图片'
        });
      }

      // 验证分类ID格式
      if (isNaN(category_id) || parseInt(category_id) <= 0) {
        return res.status(400).json({
          success: false,
          message: '分类ID必须是有效的正数'
        });
      }

      // 验证图片格式
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        if (!image.image_url || typeof image.image_url !== 'string') {
          return res.status(400).json({
            success: false,
            message: `第 ${i + 1} 张图片的image_url不能为空`
          });
        }


        if (image.params && !Array.isArray(image.params)) {
          return res.status(400).json({
            success: false,
            message: `第 ${i + 1} 张图片的params必须是数组格式`
          });
        }

        if (image.additional_images && !Array.isArray(image.additional_images)) {
          return res.status(400).json({
            success: false,
            message: `第 ${i + 1} 张图片的additional_images必须是数组格式`
          });
        }

        // 验证参数数组内元素格式
        if (image.params && image.params.length > 0) {
          for (const param of image.params) {
            if (!param.param_key || !param.param_value) {
              return res.status(400).json({
                success: false,
                message: '图片参数必须包含param_key和param_value'
              });
            }
          }
        }
      }

      // 验证可选字段
      if (tags !== undefined && typeof tags !== 'string') {
        return res.status(400).json({
          success: false,
          message: '标签必须是字符串格式'
        });
      }


      const result = await Product.batchCreateFromImages({
        category_id: parseInt(category_id),
        images,
        tags: tags || ''
      });

      res.status(201).json({
        success: true,
        message: `批量创建商品完成！成功创建 ${result.successfulCreates}/${result.totalImages} 个商品`,
        data: {
          summary: {
            totalImages: result.totalImages,
            successfulCreates: result.successfulCreates,
            failedCreates: result.failedCreates,
            successRate: `${result.successfulCreates}/${result.totalImages}`,
            categoryName: result.categories
          },
          createdProducts: result.createdProducts.map(item => ({
            productId: item.productId,
            productName: item.productName,
            imageUrl: item.imageUrl,
            productData: {
              product_id: item.product.product_id,
              name: item.product.name,
              tags: item.product.tags,
              category_name: item.product.category_name,
              images_count: item.product.images ? item.product.images.length : 0
            }
          })),
          errors: result.errors.map(error => ({
            index: error.index + 1,
            imageUrl: error.imageUrl,
            errorMessage: error.error
          }))
        }
      });
    } catch (error) {
      console.error('批量创建商品错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 批量给多个商品添加标签
  static async batchAddTags(req, res) {
    try {
      const { productIds, tags } = req.body;

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: '商品ID数组不能为空'
        });
      }

      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({
          success: false,
          message: '标签数组不能为空'
        });
      } 

      // 验证所有商品ID是否都是数字
      const invalidIds = productIds.filter(id => isNaN(id) || parseInt(id) <= 0);
      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: `无效的商品ID: ${invalidIds.join(', ')}`
        });
      }

      // 验证标签格式
      const invalidTags = tags.filter(tag => typeof tag !== 'string' || tag.trim().length === 0);
      if (invalidTags.length > 0) {
        return res.status(400).json({
          success: false,
          message: '标签不能为空字符串'
        });
      }

      const result = await Product.batchAddTags(
        productIds.map(id => parseInt(id)), 
        tags.map(tag => tag.trim())
      );

      res.json({
        success: true,
        message: `成功为 ${result.processedCount} 个商品添加标签，总共新添加了 ${result.totalAddedTags} 个标签`,
        data: {
          processedCount: result.processedCount,
          totalAddedTags: result.totalAddedTags,
          tagDetails: result.results.map(r => ({
            productId: r.productId,
            addedTags: r.addedTags,
            allTagsCount: r.totalTagsCount,
            newTags: r.allTags.slice(-r.addedTags.length)
          })),
          summary: {
            tagsAdded: [...new Set(tags)], // 去重后的标签列表
            productsProcessed: productIds.map(id => parseInt(id)),
            successRate: `${result.processedCount}/${productIds.length}`
          }
        }
      });
    } catch (error) {
      console.error('批量添加标签错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }
  // 批量创建商品（从上传的文件）- 支持文件上传
  static async batchCreateProductsFromFiles(req, res) {
    try {
      const { category_id, tags } = req.body;
      const files = req.validFiles || [];

      // 验证必填字段
      if (!category_id) {
        return res.status(400).json({
          success: false,
          message: '分类ID不能为空'
        });
      }

      if (files.length === 0) {
        return res.status(400).json({
          success: false,
          message: '至少需要上传一张图片'
        });
      }

      // 验证分类是否存在
      const categoryExists = await Product.validateCategoryExists(category_id);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: '指定的分类不存在'
        });
      }

      // 验证标签参数格式
      const isValidTagsFormat = Product.validateTagsFormat(tags);
      if (!isValidTagsFormat.valid) {
        return res.status(400).json({
          success: false,
          message: isValidTagsFormat.message
        });
      }

      const batchResults = await Product.batchCreateProductsFromFiles({
        category_id,
        tags,
        files
      });

      return res.status(200).json({
        success: true,
        message: `批量创建商品完成！成功创建 ${batchResults.successfulCreates}/${batchResults.totalFiles} 个商品`,
        data: batchResults
      });

    } catch (error) {
      console.error('批量创建商品失败:', error);
      return res.status(500).json({
        success: false,
        message: '批量创建商品失败',
        error: error.message
      });
    }
  }

}

module.exports = ProductController;
