/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-11-06 00:00:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-11-06 00:00:00
 * @FilePath: \showcase-backend-node\src\validators\orderAfterSaleValidator.js
 * @Description: 订单售后验证器
 */

// 验证创建售后的数据
const validateCreateAfterSale = (req, res, next) => {
  try {
    const { order_id, product_ids, reason, content } = req.body;

    // 验证必填字段
    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: '订单ID不能为空'
      });
    }

    // 验证订单ID类型和格式
    if (typeof order_id !== 'number' && typeof order_id !== 'string') {
      return res.status(400).json({
        success: false,
        message: '订单ID必须是数字类型'
      });
    }

    const orderId = parseInt(order_id);
    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: '订单ID必须是有效的正整数'
      });
    }

    // 验证商品ID数组
    if (!product_ids) {
      return res.status(400).json({
        success: false,
        message: '售后商品不能为空'
      });
    }

    if (!Array.isArray(product_ids)) {
      return res.status(400).json({
        success: false,
        message: '售后商品必须是数组类型'
      });
    }

    if (product_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '售后商品不能为空，至少需要一个商品'
      });
    }

    // 验证每个商品ID
    for (let i = 0; i < product_ids.length; i++) {
      const productId = product_ids[i];
      
      if (typeof productId !== 'number' && typeof productId !== 'string') {
        return res.status(400).json({
          success: false,
          message: `第${i + 1}个商品的商品ID必须是数字类型`
        });
      }

      const productIdNum = parseInt(productId);
      if (isNaN(productIdNum) || productIdNum <= 0) {
        return res.status(400).json({
          success: false,
          message: `第${i + 1}个商品的商品ID必须是有效的正整数`
        });
      }
    }

    // 验证售后原因
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: '售后原因不能为空'
      });
    }

    if (typeof reason !== 'string') {
      return res.status(400).json({
        success: false,
        message: '售后原因必须是字符串类型'
      });
    }

    if (reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '售后原因不能为空'
      });
    }

    if (reason.length > 200) {
      return res.status(400).json({
        success: false,
        message: '售后原因不能超过200个字符'
      });
    }

    // 验证售后具体内容（可选）
    if (content !== undefined && content !== null) {
      if (typeof content !== 'string') {
        return res.status(400).json({
          success: false,
          message: '售后具体内容必须是字符串类型'
        });
      }
    }

    next();
  } catch (error) {
    console.error('验证创建售后数据错误:', error);
    res.status(500).json({
      success: false,
      message: '数据验证失败'
    });
  }
};

// 验证更新售后的数据
const validateUpdateAfterSale = (req, res, next) => {
  try {
    const { reason, content, status, product_ids, end_time } = req.body;

    // 至少需要有一个更新字段
    if (reason === undefined && content === undefined && status === undefined && 
        product_ids === undefined && end_time === undefined) {
      return res.status(400).json({
        success: false,
        message: '至少需要提供一个要更新的字段'
      });
    }

    // 验证售后原因（可选）
    if (reason !== undefined) {
      if (typeof reason !== 'string') {
        return res.status(400).json({
          success: false,
          message: '售后原因必须是字符串类型'
        });
      }

      if (reason.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '售后原因不能为空'
        });
      }

      if (reason.length > 200) {
        return res.status(400).json({
          success: false,
          message: '售后原因不能超过200个字符'
        });
      }
    }

    // 验证售后具体内容（可选）
    if (content !== undefined && content !== null) {
      if (typeof content !== 'string') {
        return res.status(400).json({
          success: false,
          message: '售后具体内容必须是字符串类型'
        });
      }
    }

    // 验证售后状态（可选）
    if (status !== undefined) {
      if (typeof status !== 'string') {
        return res.status(400).json({
          success: false,
          message: '售后状态必须是字符串类型'
        });
      }

      const validStatuses = ['pending', 'processing', 'approved', 'rejected', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `售后状态必须是以下之一: ${validStatuses.join(', ')}`
        });
      }
    }

    // 验证商品ID数组（可选）
    if (product_ids !== undefined) {
      if (!Array.isArray(product_ids)) {
        return res.status(400).json({
          success: false,
          message: '售后商品必须是数组类型'
        });
      }

      if (product_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '售后商品不能为空，至少需要一个商品'
        });
      }

      // 验证每个商品ID
      for (let i = 0; i < product_ids.length; i++) {
        const productId = product_ids[i];
        
        if (typeof productId !== 'number' && typeof productId !== 'string') {
          return res.status(400).json({
            success: false,
            message: `第${i + 1}个商品的商品ID必须是数字类型`
          });
        }

        const productIdNum = parseInt(productId);
        if (isNaN(productIdNum) || productIdNum <= 0) {
          return res.status(400).json({
            success: false,
            message: `第${i + 1}个商品的商品ID必须是有效的正整数`
          });
        }
      }
    }

    // 验证结束时间（可选）
    if (end_time !== undefined && end_time !== null) {
      if (typeof end_time !== 'string' && !(end_time instanceof Date)) {
        return res.status(400).json({
          success: false,
          message: '结束时间格式不正确'
        });
      }
    }

    next();
  } catch (error) {
    console.error('验证更新售后数据错误:', error);
    res.status(500).json({
      success: false,
      message: '数据验证失败'
    });
  }
};

// 验证更新售后状态的数据
const validateUpdateAfterSaleStatus = (req, res, next) => {
  try {
    const { status } = req.body;

    // 验证必填字段
    if (!status) {
      return res.status(400).json({
        success: false,
        message: '售后状态不能为空'
      });
    }

    // 验证售后状态类型
    if (typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        message: '售后状态必须是字符串类型'
      });
    }

    // 验证售后状态值
    const validStatuses = ['pending', 'processing', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `售后状态必须是以下之一: ${validStatuses.join(', ')}`
      });
    }

    next();
  } catch (error) {
    console.error('验证更新售后状态数据错误:', error);
    res.status(500).json({
      success: false,
      message: '数据验证失败'
    });
  }
};

// 验证查询参数
const validateQueryParams = (req, res, next) => {
  try {
    const { page, limit, user_id, order_id, status } = req.query;

    // 验证页码
    if (page !== undefined) {
      const pageNum = parseInt(page);
      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
          success: false,
          message: '页码必须是大于0的数字'
        });
      }
    }

    // 验证每页数量
    if (limit !== undefined) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: '每页数量必须是1-100之间的数字'
        });
      }
    }

    // 验证用户ID筛选
    if (user_id !== undefined) {
      const userId = parseInt(user_id);
      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({
          success: false,
          message: '用户ID必须是有效的正整数'
        });
      }
    }

    // 验证订单ID筛选
    if (order_id !== undefined) {
      const orderId = parseInt(order_id);
      if (isNaN(orderId) || orderId <= 0) {
        return res.status(400).json({
          success: false,
          message: '订单ID必须是有效的正整数'
        });
      }
    }

    // 验证售后状态筛选
    if (status !== undefined) {
      if (typeof status !== 'string') {
        return res.status(400).json({
          success: false,
          message: '售后状态必须是字符串类型'
        });
      }

      const validStatuses = ['pending', 'processing', 'approved', 'rejected', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `售后状态必须是以下之一: ${validStatuses.join(', ')}`
        });
      }
    }

    next();
  } catch (error) {
    console.error('验证查询参数错误:', error);
    res.status(500).json({
      success: false,
      message: '参数验证失败'
    });
  }
};

module.exports = {
  validateCreateAfterSale,
  validateUpdateAfterSale,
  validateUpdateAfterSaleStatus,
  validateQueryParams
};

