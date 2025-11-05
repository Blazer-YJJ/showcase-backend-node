/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-11 17:00:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-11 17:00:00
 * @FilePath: \showcase-backend-node\src\validators\orderValidator.js
 * @Description: 订单验证器
 */

// 验证创建订单的数据
const validateCreateOrder = (req, res, next) => {
  try {
    const { address_id, items, order_note } = req.body;

    // 验证必填字段
    if (!address_id) {
      return res.status(400).json({
        success: false,
        message: '地址ID不能为空'
      });
    }

    // 验证地址ID类型和格式
    if (typeof address_id !== 'number' && typeof address_id !== 'string') {
      return res.status(400).json({
        success: false,
        message: '地址ID必须是数字类型'
      });
    }

    const addressId = parseInt(address_id);
    if (isNaN(addressId) || addressId <= 0) {
      return res.status(400).json({
        success: false,
        message: '地址ID必须是有效的正整数'
      });
    }

    // 验证商品数组
    if (!items) {
      return res.status(400).json({
        success: false,
        message: '订单商品不能为空'
      });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: '订单商品必须是数组类型'
      });
    }

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '订单商品不能为空，至少需要一个商品'
      });
    }

    // 验证每个商品项
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (!item.product_id) {
        return res.status(400).json({
          success: false,
          message: `第${i + 1}个商品的商品ID不能为空`
        });
      }

      // 验证商品ID类型和格式
      if (typeof item.product_id !== 'number' && typeof item.product_id !== 'string') {
        return res.status(400).json({
          success: false,
          message: `第${i + 1}个商品的商品ID必须是数字类型`
        });
      }

      const productId = parseInt(item.product_id);
      if (isNaN(productId) || productId <= 0) {
        return res.status(400).json({
          success: false,
          message: `第${i + 1}个商品的商品ID必须是有效的正整数`
        });
      }

      // 验证商品数量（可选，默认为1）
      if (item.quantity !== undefined && item.quantity !== null) {
        if (typeof item.quantity !== 'number' && typeof item.quantity !== 'string') {
          return res.status(400).json({
            success: false,
            message: `第${i + 1}个商品的数量必须是数字类型`
          });
        }

        const quantity = parseInt(item.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: `第${i + 1}个商品的数量必须是大于0的正整数`
          });
        }

        if (quantity > 9999) {
          return res.status(400).json({
            success: false,
            message: `第${i + 1}个商品的数量不能超过9999`
          });
        }
      }

      // 验证商品备注（可选）
      if (item.item_note !== undefined && item.item_note !== null) {
        if (typeof item.item_note !== 'string') {
          return res.status(400).json({
            success: false,
            message: `第${i + 1}个商品的备注必须是字符串类型`
          });
        }

        if (item.item_note.length > 1000) {
          return res.status(400).json({
            success: false,
            message: `第${i + 1}个商品的备注不能超过1000个字符`
          });
        }
      }
    }

    // 验证订单备注（可选）
    if (order_note !== undefined && order_note !== null) {
      if (typeof order_note !== 'string') {
        return res.status(400).json({
          success: false,
          message: '订单备注必须是字符串类型'
        });
      }

      if (order_note.length > 1000) {
        return res.status(400).json({
          success: false,
          message: '订单备注不能超过1000个字符'
        });
      }
    }

    next();
  } catch (error) {
    console.error('验证创建订单数据错误:', error);
    res.status(500).json({
      success: false,
      message: '数据验证失败'
    });
  }
};

// 验证更新订单的数据
const validateUpdateOrder = (req, res, next) => {
  try {
    const { address_id, items, item_note, order_note } = req.body;

    // 至少需要有一个更新字段
    if (address_id === undefined && items === undefined && item_note === undefined && order_note === undefined) {
      return res.status(400).json({
        success: false,
        message: '至少需要提供一个要更新的字段'
      });
    }

    // 验证地址ID（可选）
    if (address_id !== undefined) {
      if (typeof address_id !== 'number' && typeof address_id !== 'string') {
        return res.status(400).json({
          success: false,
          message: '地址ID必须是数字类型'
        });
      }

      const addressId = parseInt(address_id);
      if (isNaN(addressId) || addressId <= 0) {
        return res.status(400).json({
          success: false,
          message: '地址ID必须是有效的正整数'
        });
      }
    }

    // 验证商品数组（可选，与创建接口保持一致）
    if (items !== undefined) {
      if (!Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: '订单商品必须是数组类型'
        });
      }

      if (items.length === 0) {
        return res.status(400).json({
          success: false,
          message: '订单商品不能为空，至少需要一个商品'
        });
      }

      // 验证每个商品项
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (!item.product_id) {
          return res.status(400).json({
            success: false,
            message: `第${i + 1}个商品的商品ID不能为空`
          });
        }

        // 验证商品ID类型和格式
        if (typeof item.product_id !== 'number' && typeof item.product_id !== 'string') {
          return res.status(400).json({
            success: false,
            message: `第${i + 1}个商品的商品ID必须是数字类型`
          });
        }

        const productId = parseInt(item.product_id);
        if (isNaN(productId) || productId <= 0) {
          return res.status(400).json({
            success: false,
            message: `第${i + 1}个商品的商品ID必须是有效的正整数`
          });
        }

        // 验证商品数量（可选，默认为1）
        if (item.quantity !== undefined && item.quantity !== null) {
          if (typeof item.quantity !== 'number' && typeof item.quantity !== 'string') {
            return res.status(400).json({
              success: false,
              message: `第${i + 1}个商品的数量必须是数字类型`
            });
          }

          const quantity = parseInt(item.quantity);
          if (isNaN(quantity) || quantity <= 0) {
            return res.status(400).json({
              success: false,
              message: `第${i + 1}个商品的数量必须是大于0的正整数`
            });
          }

          if (quantity > 9999) {
            return res.status(400).json({
              success: false,
              message: `第${i + 1}个商品的数量不能超过9999`
            });
          }
        }

        // 验证商品备注（可选）
        if (item.item_note !== undefined && item.item_note !== null) {
          if (typeof item.item_note !== 'string') {
            return res.status(400).json({
              success: false,
              message: `第${i + 1}个商品的备注必须是字符串类型`
            });
          }

          if (item.item_note.length > 1000) {
            return res.status(400).json({
              success: false,
              message: `第${i + 1}个商品的备注不能超过1000个字符`
            });
          }
        }
      }
    }

    // 验证商品备注（可选，向后兼容，用于更新第一个订单项的备注）
    if (item_note !== undefined && item_note !== null) {
      if (typeof item_note !== 'string') {
        return res.status(400).json({
          success: false,
          message: '商品备注必须是字符串类型'
        });
      }

      if (item_note.length > 1000) {
        return res.status(400).json({
          success: false,
          message: '商品备注不能超过1000个字符'
        });
      }
    }

    // 验证订单备注（可选）
    if (order_note !== undefined && order_note !== null) {
      if (typeof order_note !== 'string') {
        return res.status(400).json({
          success: false,
          message: '订单备注必须是字符串类型'
        });
      }

      if (order_note.length > 1000) {
        return res.status(400).json({
          success: false,
          message: '订单备注不能超过1000个字符'
        });
      }
    }

    next();
  } catch (error) {
    console.error('验证更新订单数据错误:', error);
    res.status(500).json({
      success: false,
      message: '数据验证失败'
    });
  }
};

// 验证更新订单状态的数据
const validateUpdateOrderStatus = (req, res, next) => {
  try {
    const { order_status } = req.body;

    // 验证必填字段
    if (!order_status) {
      return res.status(400).json({
        success: false,
        message: '订单状态不能为空'
      });
    }

    // 验证订单状态类型
    if (typeof order_status !== 'string') {
      return res.status(400).json({
        success: false,
        message: '订单状态必须是字符串类型'
      });
    }

    // 验证订单状态值
    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(order_status)) {
      return res.status(400).json({
        success: false,
        message: `订单状态必须是以下之一: ${validStatuses.join(', ')}`
      });
    }

    next();
  } catch (error) {
    console.error('验证更新订单状态数据错误:', error);
    res.status(500).json({
      success: false,
      message: '数据验证失败'
    });
  }
};

// 验证查询参数
const validateQueryParams = (req, res, next) => {
  try {
    const { page, limit, user_id, order_status } = req.query;

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

    // 验证订单状态筛选
    if (order_status !== undefined) {
      if (typeof order_status !== 'string') {
        return res.status(400).json({
          success: false,
          message: '订单状态必须是字符串类型'
        });
      }

      const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(order_status)) {
        return res.status(400).json({
          success: false,
          message: `订单状态必须是以下之一: ${validStatuses.join(', ')}`
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
  validateCreateOrder,
  validateUpdateOrder,
  validateUpdateOrderStatus,
  validateQueryParams
};

