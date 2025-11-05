const dbConnection = require('../config/dbConnection');
const path = require('path');
const fs = require('fs');

class Product {
  constructor(data) {
    this.product_id = data.product_id;
    this.category_id = data.category_id;
    this.name = data.name;
    this.description = data.description;
    this.price = data.price;
    this.tags = data.tags;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // 创建商品（包含图片和参数）
  static async create(productData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 明确排除 product_id 字段，确保不会意外使用
      const { 
        product_id, // 不使用这个字段，product_id 由数据库自动生成
        name, 
        description, 
        price, 
        category_id, 
        tags, 
        params = [], 
        images = [] 
      } = productData;

      // 验证必填字段
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('商品名称不能为空');
      }

      if (!description || typeof description !== 'string' || description.trim().length === 0) {
        throw new Error('商品简介不能为空');
      }

      if (!price || isNaN(price) || parseFloat(price) < 0) {
        throw new Error('商品价格必须是有效的正数');
      }

      if (!category_id || isNaN(category_id)) {
        throw new Error('分类ID不能为空且必须是有效数字');
      }

      // 验证分类是否存在
      const [categoryCheck] = await connection.execute(
        'SELECT category_id FROM categories WHERE category_id = ?',
        [category_id]
      );

      if (categoryCheck.length === 0) {
        throw new Error('指定的分类不存在');
      }

      // 验证商品名称长度
      if (name.length > 200) {
        throw new Error('商品名称不能超过200个字符');
      }

      // 创建商品主记录
      const createProductQuery = `
        INSERT INTO products (category_id, name, description, price, tags)
        VALUES (?, ?, ?, ?, ?)
      `;

      const [productResult] = await connection.execute(createProductQuery, [
        category_id,
        name.trim(),
        description.trim(),
        parseFloat(price),
        tags ? tags.trim() : null
      ]);

      const productId = productResult.insertId;

      // 添加参数
      if (params && params.length > 0) {
        for (const param of params) {
          if (param.param_key && param.param_value) {
            await connection.execute(
              'INSERT INTO product_params (product_id, param_key, param_value) VALUES (?, ?, ?)',
              [productId, param.param_key.trim(), param.param_value.trim()]
            );
          }
        }
      }

      // 添加图片
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          const imageType = image.image_type || 'sub';
          const sortOrder = image.sort_order || i;
          
          await connection.execute(
            'INSERT INTO product_images (product_id, image_url, image_type, sort_order) VALUES (?, ?, ?, ?)',
            [productId, image.image_url.trim(), imageType, sortOrder]
          );
        }
      }

      await connection.commit();

      // 获取完整的商品信息
      return await this.findById(productId);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 根据ID获取商品（包含图片和参数）
  static async findById(productId) {
    try {
      // 获取商品基本信息（包含分类路径）
      const productQuery = `
        SELECT p.*, 
               c.name as category_name,
               c.level as category_level,
               CASE 
                 WHEN c.parent_id IS NULL THEN c.name
                 WHEN c.parent_id IN (
                   SELECT category_id FROM categories WHERE parent_id IS NULL
                 ) THEN CONCAT(parent.name, ' > ', c.name)
                 ELSE CONCAT(grandparent.name, ' > ', parent.name, ' > ', c.name)
               END as category_path
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN categories parent ON c.parent_id = parent.category_id
        LEFT JOIN categories grandparent ON parent.parent_id = grandparent.category_id
        WHERE p.product_id = ?
      `;
      
      const products = await dbConnection.query(productQuery, [productId]);
      
      if (products[0].length === 0) {
        return null;
      }

      const product = products[0][0];

      // 获取商品参数
      const paramsQuery = `
        SELECT param_key, param_value
        FROM product_params
        WHERE product_id = ?
        ORDER BY param_id ASC
      `;
      
      const params = await dbConnection.query(paramsQuery, [productId]);
      const paramsData = params[0];

      // 获取商品图片
      const imagesQuery = `
        SELECT image_id, image_url, image_type, sort_order
        FROM product_images
        WHERE product_id = ?
        ORDER BY sort_order ASC, image_id ASC
      `;
      
      const images = await dbConnection.query(imagesQuery, [productId]);
      const imagesData = images[0];

      return {
        ...product,
        params: paramsData.map(param => ({
          param_key: param.param_key,
          param_value: param.param_value
        })),
        images: imagesData.map(image => ({
          image_id: image.image_id,
          image_url: image.image_url,
          image_type: image.image_type,
          sort_order: image.sort_order
        }))
      };
    } catch (error) {
      throw error;
    }
  }

  // 获取商品列表（分页、筛选）
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        category_id = null,
        name = null,
        price_min = null,
        price_max = null,
        tags = null
      } = options;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];

      // 构建WHERE条件
      if (category_id) {
        whereConditions.push('p.category_id = ?');
        queryParams.push(category_id);
      }

      if (name) {
        whereConditions.push('p.name LIKE ?');
        queryParams.push(`%${name}%`);
      }

      if (price_min !== null) {
        whereConditions.push('p.price >= ?');
        queryParams.push(parseFloat(price_min));
      }

      if (price_max !== null) {
        whereConditions.push('p.price <= ?');
        queryParams.push(parseFloat(price_max));
      }

      if (tags) {
        whereConditions.push('p.tags LIKE ?');
        queryParams.push(`%${tags}%`);
      }

      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        ${whereClause}
      `;
      
      const countResult = await dbConnection.query(countQuery, queryParams);
      const total = countResult[0][0].total;

      // 获取商品列表（包含分类路径）
      const listQuery = `
        SELECT p.product_id, p.category_id, p.name, p.description, p.price, p.tags,
               p.created_at, p.updated_at, 
               c.name as category_name,
               c.level as category_level,
               CASE 
                 WHEN c.parent_id IS NULL THEN c.name
                 WHEN c.parent_id IN (
                   SELECT category_id FROM categories WHERE parent_id IS NULL
                 ) THEN CONCAT(parent.name, ' > ', c.name)
                 ELSE CONCAT(grandparent.name, ' > ', parent.name, ' > ', c.name)
               END as category_path
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN categories parent ON c.parent_id = parent.category_id
        LEFT JOIN categories grandparent ON parent.parent_id = grandparent.category_id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const products = await dbConnection.query(listQuery, [...queryParams, limit, offset]);
      const productsData = products[0];

      // 为每个商品获取图片信息
      const productsWithImages = await Promise.all(
        productsData.map(async (product) => {
          const imagesQuery = `
            SELECT image_id, image_url, image_type, sort_order, created_at
            FROM product_images
            WHERE product_id = ?
            ORDER BY sort_order ASC, created_at ASC
          `;
          
          const images = await dbConnection.query(imagesQuery, [product.product_id]);
          const imagesData = images[0];
          
          return {
            product_id: product.product_id,
            category_id: product.category_id,
            name: product.name,
            description: product.description,
            price: product.price,
            tags: product.tags,
            category_name: product.category_name,
            category_level: product.category_level,
            category_path: product.category_path,
            images: imagesData.map(image => ({
              image_id: image.image_id,
              image_url: image.image_url,
              image_type: image.image_type,
              sort_order: image.sort_order,
              created_at: image.created_at
            })),
            created_at: product.created_at,
            updated_at: product.updated_at
          };
        })
      );

      return {
        products: productsWithImages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // 更新商品
  static async update(productId, updateData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      const {
        name,
        description,
        price,
        category_id,
        tags,
        params,
        images
      } = updateData;

      // 检查商品是否存在
      const [existingProduct] = await connection.execute(
        'SELECT * FROM products WHERE product_id = ?',
        [productId]
      );

      if (existingProduct.length === 0) {
        throw new Error('商品不存在');
      }

      // 构建更新字段
      const updates = [];
      const values = [];

      if (name !== undefined) {
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
          throw new Error('商品名称不能为空');
        }
        if (name.length > 200) {
          throw new Error('商品名称不能超过200个字符');
        }
        updates.push('name = ?');
        values.push(name.trim());
      }

      if (description !== undefined) {
        if (!description || typeof description !== 'string' || description.trim().length === 0) {
          throw new Error('商品简介不能为空');
        }
        updates.push('description = ?');
        values.push(description.trim());
      }

      if (price !== undefined) {
        if (isNaN(price) || parseFloat(price) < 0) {
          throw new Error('商品价格必须是有效的正数');
        }
        updates.push('price = ?');
        values.push(parseFloat(price));
      }

      if (category_id !== undefined) {
        if (!category_id || isNaN(category_id)) {
          throw new Error('分类ID不能为空且必须是有效数字');
        }
        // 验证分类是否存在
        const [categoryCheck] = await connection.execute(
          'SELECT category_id FROM categories WHERE category_id = ?',
          [category_id]
        );
        if (categoryCheck.length === 0) {
          throw new Error('指定的分类不存在');
        }
        updates.push('category_id = ?');
        values.push(category_id);
      }

      if (tags !== undefined) {
        updates.push('tags = ?');
        values.push(tags ? tags.trim() : null);
      }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(productId);

        const updateQuery = `
          UPDATE products
          SET ${updates.join(', ')}
          WHERE product_id = ?
        `;

        await connection.execute(updateQuery, values);
      }

      // 更新参数（重新插入）
      if (params !== undefined) {
        // 删除原有参数
        await connection.execute('DELETE FROM product_params WHERE product_id = ?', [productId]);
        
        // 插入新参数
        if (params && params.length > 0) {
          for (const param of params) {
            if (param.param_key && param.param_value) {
              await connection.execute(
                'INSERT INTO product_params (product_id, param_key, param_value) VALUES (?, ?, ?)',
                [productId, param.param_key.trim(), param.param_value.trim()]
              );
            }
          }
        }
      }

      // 更新图片（重新插入）
      if (images !== undefined) {
        // 删除原有图片
        await connection.execute('DELETE FROM product_images WHERE product_id = ?', [productId]);
        
        // 插入新图片
        if (images && images.length > 0) {
          for (let i = 0; i < images.length; i++) {
            const image = images[i];
            const imageType = image.image_type || 'sub';
            const sortOrder = image.sort_order || i;
            
            await connection.execute(
              'INSERT INTO product_images (product_id, image_url, image_type, sort_order) VALUES (?, ?, ?, ?)',
              [productId, image.image_url.trim(), imageType, sortOrder]
            );
          }
        }
      }

      await connection.commit();

      // 获取更新后的完整商品信息
      return await this.findById(productId);
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 删除商品
  static async delete(productId) {
    try {
      // 检查商品是否存在
      const product = await this.findById(productId);
      if (!product) {
        throw new Error('商品不存在');
      }

      const connection = await dbConnection.getConnection();
      try {
        await connection.beginTransaction();

        // 删除相关表的数据（外键约束会自动处理）
        // 1. 删除商品参数
        await connection.execute('DELETE FROM product_params WHERE product_id = ?', [productId]);
        
        // 2. 删除商品图片
        await connection.execute('DELETE FROM product_images WHERE product_id = ?', [productId]);
        
        // 3. 删除相关推荐表的记录
        await connection.execute('DELETE FROM featured_products WHERE product_id = ?', [productId]);
        await connection.execute('DELETE FROM hot_products WHERE product_id = ?', [productId]);
        await connection.execute('DELETE FROM explore_selections WHERE product_id = ?', [productId]);
        await connection.execute('DELETE FROM main_promotions WHERE product_id = ?', [productId]);
        await connection.execute('DELETE FROM activity_products WHERE product_id = ?', [productId]);
        await connection.execute('DELETE FROM new_arrival_products WHERE product_id = ?', [productId]);
        
        // 4. 删除用户相关记录
        await connection.execute('DELETE FROM user_cart WHERE product_id = ?', [productId]);
        await connection.execute('DELETE FROM user_favorites WHERE product_id = ?', [productId]);
        await connection.execute('DELETE FROM user_orders WHERE product_id = ?', [productId]);
        
        // 5. 最后删除商品主记录
        await connection.execute('DELETE FROM products WHERE product_id = ?', [productId]);

        await connection.commit();

        return {
          product_id: productId,
          message: '商品删除成功'
        };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      throw error;
    }
  }

  // 获取安全的商品信息（不包含敏感内容）
  toSafeObject() {
    return {
      product_id: this.product_id,
      category_id: this.category_id,
      name: this.name,
      description: this.description,
      price: this.price,
      tags: this.tags,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // 批量删除商品
  static async batchDelete(productIds) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 验证参数
      if (!Array.isArray(productIds) || productIds.length === 0) {
        throw new Error('商品ID数组不能为空');
      }

      // 验证所有ID都是有效数字
      const invalidIds = productIds.filter(id => !Number.isInteger(parseInt(id)));
      if (invalidIds.length > 0) {
        throw new Error(`无效的商品ID: ${invalidIds.join(', ')}`);
      }

      // 检查商品是否存在
      const placeholders = productIds.map(() => '?').join(',');
      const [existingProducts] = await connection.execute(
        `SELECT product_id FROM products WHERE product_id IN (${placeholders})`,
        productIds
      );

      if (existingProducts.length === 0) {
        throw new Error('没有找到要删除的商品');
      }

      if (existingProducts.length !== productIds.length) {
        const existingIds = existingProducts.map(p => p.product_id);
        const missingIds = productIds.filter(id => !existingIds.includes(parseInt(id)));
        throw new Error(`以下商品不存在: ${missingIds.join(', ')}`);
      }

      // 删除商品参数
      await connection.execute(
        `DELETE FROM product_params WHERE product_id IN (${placeholders})`,
        productIds
      );

      // 删除商品图片
      await connection.execute(
        `DELETE FROM product_images WHERE product_id IN (${placeholders})`,
        productIds
      );

      // 删除商品
      const deleteResult = await connection.execute(
        `DELETE FROM products WHERE product_id IN (${placeholders})`,
        productIds
      );

      await connection.commit();
      
      return {
        deletedCount: deleteResult.affectedRows,
        deletedIds: productIds
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 批量创建商品（根据图片名自动命名）
  static async batchCreateFromImages(batchData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      const { category_id, images, tags = '' } = batchData;

      // 验证必填参数
      if (!category_id || isNaN(category_id)) {
        throw new Error('分类ID不能为空且必须是有效数字');
      }

      if (!images || !Array.isArray(images) || images.length === 0) {
        throw new Error('图片数组不能为空');
      }

      if (images.length > 100) {
        throw new Error('单次最多上传100张图片');
      }

      // 验证分类是否存在
      const [categoryCheck] = await connection.execute(
        'SELECT category_id, name as category_name FROM categories WHERE category_id = ?',
        [category_id]
      );

      if (categoryCheck.length === 0) {
        throw new Error('指定的分类不存在');
      }

      const categoryName = categoryCheck[0].category_name;

      // 处理图片并创建商品
      const createdProducts = [];
      const errors = [];

      for (let i = 0; i < images.length; i++) {
        try {
          const image = images[i];
          
          // 从图片文件名中提取商品名称（去掉扩展名和不必要的字符）
          const fileName = image.image_url.split('/').pop() || `image_${i + 1}`;
          const productName = fileName.split('.')[0]
            .replace(/[-_]/g, ' ')  // 将连字符和下划线替换为空格
            .replace(/\d+/g, ' ')   // 移除数字
            .trim()                 // 去除首尾空格
            || `商品_${i + 1}`;      // 如果处理后的名称为空，使用默认名称

          // 创建商品主记录（不包含价格和描述）
          const createProductQuery = `
            INSERT INTO products (category_id, name, tags)
            VALUES (?, ?, ?)
          `;

          const productResult = await connection.execute(createProductQuery, [
            category_id,
            productName,
            tags ? tags.trim() : null
          ]);

          const productId = productResult.insertId;

          // 添加图片（将当前图片设为主图）
          await connection.execute(
            'INSERT INTO product_images (product_id, image_url, image_type, sort_order) VALUES (?, ?, ?, ?)',
            [productId, image.image_url.trim(), 'main', 0]
          );

          // 添加其他图片（如果有的话）
          if (image.additional_images && Array.isArray(image.additional_images)) {
            for (let j = 0; j < image.additional_images.length; j++) {
              const additionalImage = image.additional_images[j];
              await connection.execute(
                'INSERT INTO product_images (product_id, image_url, image_type, sort_order) VALUES (?, ?, ?, ?)',
                [productId, additionalImage.trim(), 'sub', j + 1]
              );
            }
          }

          // 添加自定义参数（如果有的话）
          if (image.params && Array.isArray(image.params)) {
            for (const param of image.params) {
              if (param.param_key && param.param_value) {
                await connection.execute(
                  'INSERT INTO product_params (product_id, param_key, param_value) VALUES (?, ?, ?)',
                  [productId, param.param_key.trim(), param.param_value.trim()]
                );
              }
            }
          }

          // 获取创建的商品信息
          const createdProduct = await this.findById(productId);
          createdProducts.push({
            success: true,
            productId: productId,
            productName: productName,
            imageUrl: image.image_url,
            product: createdProduct
          });

        } catch (error) {
          errors.push({
            index: i,
            imageUrl: images[i].image_url,
            error: error.message
          });
        }
      }

      if (createdProducts.length === 0) {
        throw new Error('没有成功创建任何商品');
      }

      await connection.commit();

      return {
        success: true,
        totalImages: images.length,
        successfulCreates: createdProducts.length,
        failedCreates: errors.length,
        categories: categoryName,
        createdProducts: createdProducts,
        errors: errors
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 批量给多个商品添加标签
  static async batchAddTags(productIds, tagsToAdd) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 验证参数
      if (!Array.isArray(productIds) || productIds.length === 0) {
        throw new Error('商品ID数组不能为空');
      }

      if (!Array.isArray(tagsToAdd) || tagsToAdd.length === 0) {
        throw new Error('标签数组不能为空');
      }

      // 验证所有商品ID都是有效数字
      const invalidIds = productIds.filter(id => !Number.isInteger(parseInt(id)));
      if (invalidIds.length > 0) {
        throw new Error(`无效的商品ID: ${invalidIds.join(', ')}`);
      }

      // 验证标签格式
      const invalidTags = tagsToAdd.filter(tag => typeof tag !== 'string' || tag.trim().length === 0);
      if (invalidTags.length > 0) {
        throw new Error('标签不能为空字符串');
      }

      // 检查所有商品是否存在
      const placeholders = productIds.map(() => '?').join(',');
      const [existingProducts] = await connection.execute(
        `SELECT product_id, tags FROM products WHERE product_id IN (${placeholders})`,
        productIds
      );

      if (existingProducts.length === 0) {
        throw new Error('没有找到要更新的商品');
      }

      if (existingProducts.length !== productIds.length) {
        const existingIds = existingProducts.map(p => p.product_id);
        const missingIds = productIds.filter(id => !existingIds.includes(parseInt(id)));
        throw new Error(`以下商品不存在: ${missingIds.join(', ')}`);
      }

      const tagsToAddTrimmed = tagsToAdd.map(tag => tag.trim());
      const results = [];

      // 批量处理每个商品的标签
      for (const product of existingProducts) {
        const currentTags = product.tags || '';
        const currentTagArray = currentTags ? currentTags.split(',').map(tag => tag.trim()) : [];
        
        // 合并标签，去重
        const combinedTags = [...new Set([...currentTagArray, ...tagsToAddTrimmed])];
        const finalTagsString = combinedTags.join(',');

        // 更新商品标签
        const updateResult = await connection.execute(
          'UPDATE products SET tags = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?',
          [finalTagsString, product.product_id]
        );

        if (updateResult.affectedRows === 0) {
          throw new Error(`更新商品 ${product.product_id} 的标签失败`);
        }

        results.push({
          productId: product.product_id,
          addedTags: tagsToAddTrimmed.filter(tag => !currentTagArray.includes(tag)),
          allTags: combinedTags,
          totalTagsCount: combinedTags.length
        });
      }

      await connection.commit();
      
      return {
        success: true,
        processedCount: productIds.length,
        totalAddedTags: results.reduce((sum, r) => sum + r.addedTags.length, 0),
        results
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 批量创建商品（从上传的文件）
  static async batchCreateProductsFromFiles({ category_id, tags, files }) {
    const connection = await dbConnection.getConnection();
    
    try {
      // 开始事务
      await connection.beginTransaction();
      
      // 获取分类名称
      const categoryQuery = 'SELECT name FROM categories WHERE category_id = ?';
      const [categoryResult] = await connection.execute(categoryQuery, [category_id]);
      const categoryName = categoryResult.length > 0 ? categoryResult[0].name : '未知分类';
      
      const createdProducts = [];
      const errors = [];
      let successfulCreates = 0;
      
      // 处理多个上传的文件
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // 获取文件扩展名
          const ext = path.extname(file.originalname).toLowerCase();
          
          // 生成唯一的文件名（使用时间戳+随机数+索引，避免冲突）
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 10000);
          const uniqueFilename = `product_${timestamp}_${random}_${i}${ext}`;
          
          // 构建完整的图片URL
          const imageUrl = `/uploads/products/${uniqueFilename}`;
          
          // 从文件名提取商品名称
          const productName = this.extractProductNameFromFilename(file.originalname);
          
          // 创建商品（不包含价格和描述）
          const insertProductQuery = `
            INSERT INTO products (name, category_id, tags, created_at, updated_at)
            VALUES (?, ?, ?, NOW(), NOW())
          `;
          
          const [result] = await connection.execute(insertProductQuery, [
            productName,
            category_id,
            tags || ''
          ]);
          
          const productId = result.insertId;

          // 添加图片到product_images表
          const insertImageQuery = `
            INSERT INTO product_images (product_id, image_url, image_type, sort_order)
            VALUES (?, ?, 'main', 0)
          `;
          
          await connection.execute(insertImageQuery, [
            productId,
            imageUrl
          ]);

          // 保存文件到磁盘
          const uploadDir = path.join(__dirname, '../../uploads/products');
          const filePath = path.join(uploadDir, uniqueFilename);
          
          // 确保目录存在
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          // 保存文件
          fs.writeFileSync(filePath, file.buffer);

          createdProducts.push({
            productId: productId,
            productName: productName,
            imageUrl: imageUrl,
            productData: {
              product_id: productId,
              name: productName,
              tags: tags || '',
              category_name: categoryName,
              images_count: 1
            }
          });
          
          successfulCreates++;
          
        } catch (error) {
          console.error(`处理文件 ${file.originalname} 失败:`, error);
          errors.push({
            file: file.originalname,
            error: error.message
          });
        }
      }
      
      // 提交事务
      await connection.commit();
      
      return {
        summary: {
          totalFiles: files.length,
          successfulCreates: successfulCreates,
          failedCreates: errors.length,
          successRate: `${successfulCreates}/${files.length}`,
          categoryName: categoryName
        },
        createdProducts: createdProducts,
        errors: errors
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 从文件名提取商品名称
  static extractProductNameFromFilename(originalName) {
    if (!originalName) return '商品';
    
    // 移除文件扩展名
    let name = path.parse(originalName).name;
    
    // 移除常见的前缀和数字
    name = name.replace(/^(?:image|img|photo|picture|product|goods)?[_\-\.]?\d*[_\-\.]/, '');
    
    // 移除后缀中的数字
    name = name.replace(/[_\-\.]\d+$/, '');
    
    // 替换连字符、下划线和点号为空格
    name = name.replace(/[_\-\.]+/g, ' ');
    
    // 移除多余空格并转为小写
    name = name.trim().replace(/\s+/g, ' ').toLowerCase();
    
    // 如果处理后的名称为空，使用默认值
    if (!name) {
      name = `商品_${Date.now()}`;
    }
    
    return name;
  }

  // 验证分类是否存在
  static async validateCategoryExists(category_id) {
    try {
      const connection = await dbConnection.getConnection();
      try {
        const [result] = await connection.execute(
          'SELECT category_id FROM categories WHERE category_id = ?',
          [category_id]
        );
        return result.length > 0;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('验证分类失败:', error);
      return false;
    }
  }

  // 验证标签格式
  static validateTagsFormat(tags) {
    // tags可以为空或null
    if (!tags || tags.trim() === '') {
      return { valid: true };
    }

    // tags必须是字符串
    if (typeof tags !== 'string') {
      return {
        valid: false,
        message: '标签必须是字符串格式'
      };
    }

    // 验证标签长度（单个标签不超过50字符，总长度不超过500字符）
    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    
    if (tags.length > 500) {
      return {
        valid: false,
        message: '标签总长度不能超过500个字符'
      };
    }

    for (const tag of tagArray) {
      if (tag.length > 50) {
        return {
          valid: false,
          message: `标签 "${tag}" 长度不能超过50个字符`
        };
      }
    }

    return { valid: true };
  }

  // 搜索商品（支持商品名称、分类名称、标签搜索）
  static async search(options = {}) {
    try {
      const {
        keyword = '',
        page = 1,
        limit = 10,
        sort = 'created_at',
        order = 'desc'
      } = options;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let queryParams = [];

      // 构建搜索条件
      if (keyword && keyword.trim()) {
        const searchKeyword = `%${keyword.trim()}%`;
        whereConditions.push('(p.name LIKE ? OR c.name LIKE ? OR p.tags LIKE ?)');
        queryParams.push(searchKeyword, searchKeyword, searchKeyword);
      }

      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      // 验证排序字段和方向
      const allowedSortFields = ['created_at', 'price', 'name'];
      const allowedOrders = ['asc', 'desc'];
      const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
      const sortOrder = allowedOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';

      // 获取总数
      const countQuery = `
        SELECT COUNT(*) as total
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        ${whereClause}
      `;
      
      const countResult = await dbConnection.query(countQuery, queryParams);
      const total = countResult[0][0].total;

      // 获取商品列表（包含分类信息）
      const listQuery = `
        SELECT p.product_id, p.category_id, p.name, p.description, p.price, p.tags,
               p.created_at, p.updated_at, 
               c.name as category_name,
               c.category_id
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.category_id
        ${whereClause}
        ORDER BY p.${sortField} ${sortOrder}
        LIMIT ? OFFSET ?
      `;

      const products = await dbConnection.query(listQuery, [...queryParams, limit, offset]);
      const productsData = products[0];

      // 为每个商品获取图片和参数信息
      const productsWithDetails = await Promise.all(
        productsData.map(async (product) => {
          // 获取图片
          const imagesQuery = `
            SELECT image_id, image_url, image_type, sort_order, created_at
            FROM product_images
            WHERE product_id = ?
            ORDER BY sort_order ASC, created_at ASC
          `;
          
          const images = await dbConnection.query(imagesQuery, [product.product_id]);
          const imagesData = images[0];

          // 获取参数
          const paramsQuery = `
            SELECT param_id, param_key, param_value, created_at
            FROM product_params
            WHERE product_id = ?
            ORDER BY param_id ASC
          `;
          
          const params = await dbConnection.query(paramsQuery, [product.product_id]);
          const paramsData = params[0];
          
          return {
            product_id: product.product_id,
            category_id: product.category_id,
            name: product.name,
            description: product.description,
            price: product.price,
            tags: product.tags,
            created_at: product.created_at,
            updated_at: product.updated_at,
            category: {
              category_id: product.category_id,
              name: product.category_name
            },
            images: imagesData.map(img => ({
              image_id: img.image_id,
              image_url: img.image_url,
              image_type: img.image_type,
              sort_order: img.sort_order,
              created_at: img.created_at
            })),
            params: paramsData.map(param => ({
              param_id: param.param_id,
              param_key: param.param_key,
              param_value: param.param_value,
              created_at: param.created_at
            }))
          };
        })
      );

      // 计算分页信息
      const totalPages = Math.ceil(total / limit);
      const pagination = {
        current_page: page,
        total_pages: totalPages,
        total_count: total,
        per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1
      };

      return {
        products: productsWithDetails,
        pagination,
        search_info: {
          keyword: keyword.trim(),
          total_found: total
        }
      };

    } catch (error) {
      console.error('搜索商品错误:', error);
      throw error;
    }
  }
}

module.exports = Product;