/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-11-06 00:00:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-11-06 00:00:00
 * @FilePath: \showcase-backend-node\src\controllers\orderAfterSaleController.js
 * @Description: 订单售后控制器
 */

const OrderAfterSale = require('../models/OrderAfterSale');
const Order = require('../models/Order');

class OrderAfterSaleController {
  // 创建售后（会员）
  static async createAfterSale(req, res) {
    try {
      const {
        order_id,
        product_ids, // 商品ID数组
        reason,
        content
      } = req.body;

      // 从认证中间件获取用户ID
      const user_id = req.user.user_id;

      // 验证订单是否存在且属于当前用户
      const order = await Order.findById(order_id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      if (order.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: '无权为此订单创建售后'
        });
      }

      const afterSaleData = {
        order_id,
        product_ids,
        reason,
        content,
        status: 'pending'
      };

      const afterSale = await OrderAfterSale.create(afterSaleData);

      res.status(201).json({
        success: true,
        message: '售后创建成功',
        data: afterSale
      });
    } catch (error) {
      console.error('创建售后错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建售后失败'
      });
    }
  }

  // 获取当前用户的售后列表（会员）
  static async getMyAfterSales(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        order_id
      } = req.query;

      // 从认证中间件获取用户ID
      const user_id = req.user.user_id;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        user_id,
        order_id: order_id ? parseInt(order_id) : null,
        status: status || null
      };

      const result = await OrderAfterSale.findAll(options);

      res.json({
        success: true,
        message: '获取售后列表成功',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('获取售后列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取售后列表失败'
      });
    }
  }

  // 获取售后详情（会员）
  static async getAfterSaleById(req, res) {
    try {
      const { id } = req.params;
      const afterSaleId = parseInt(id);

      if (isNaN(afterSaleId) || afterSaleId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的售后ID'
        });
      }

      // 从认证中间件获取用户ID
      const user_id = req.user.user_id;

      const afterSale = await OrderAfterSale.findById(afterSaleId);

      if (!afterSale) {
        return res.status(404).json({
          success: false,
          message: '售后不存在'
        });
      }

      // 验证售后是否属于当前用户的订单
      const order = await Order.findById(afterSale.order_id);
      if (!order || order.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: '无权访问此售后'
        });
      }

      res.json({
        success: true,
        message: '获取售后详情成功',
        data: afterSale
      });
    } catch (error) {
      console.error('获取售后详情错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取售后详情失败'
      });
    }
  }

  // 更新售后（会员）
  static async updateAfterSale(req, res) {
    try {
      const { id } = req.params;
      const afterSaleId = parseInt(id);

      if (isNaN(afterSaleId) || afterSaleId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的售后ID'
        });
      }

      // 从认证中间件获取用户ID
      const user_id = req.user.user_id;

      // 检查售后是否存在且属于当前用户的订单
      const afterSale = await OrderAfterSale.findById(afterSaleId);
      if (!afterSale) {
        return res.status(404).json({
          success: false,
          message: '售后不存在'
        });
      }

      const order = await Order.findById(afterSale.order_id);
      if (!order || order.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: '无权修改此售后'
        });
      }

      // 会员只能更新某些字段，不能修改状态
      const {
        reason,
        content,
        product_ids
      } = req.body;

      const updateData = {};
      if (reason !== undefined) updateData.reason = reason;
      if (content !== undefined) updateData.content = content;
      if (product_ids !== undefined) updateData.product_ids = product_ids;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有要更新的字段'
        });
      }

      const updatedAfterSale = await OrderAfterSale.update(afterSaleId, updateData);

      res.json({
        success: true,
        message: '售后更新成功',
        data: updatedAfterSale
      });
    } catch (error) {
      console.error('更新售后错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '更新售后失败'
      });
    }
  }

  // 删除售后（会员）
  static async deleteAfterSale(req, res) {
    try {
      const { id } = req.params;
      const afterSaleId = parseInt(id);

      if (isNaN(afterSaleId) || afterSaleId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的售后ID'
        });
      }

      // 从认证中间件获取用户ID
      const user_id = req.user.user_id;

      // 检查售后是否存在且属于当前用户的订单
      const afterSale = await OrderAfterSale.findById(afterSaleId);
      if (!afterSale) {
        return res.status(404).json({
          success: false,
          message: '售后不存在'
        });
      }

      const order = await Order.findById(afterSale.order_id);
      if (!order || order.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: '无权删除此售后'
        });
      }

      const deleted = await OrderAfterSale.delete(afterSaleId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: '售后不存在或删除失败'
        });
      }

      res.json({
        success: true,
        message: '售后删除成功'
      });
    } catch (error) {
      console.error('删除售后错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '删除售后失败'
      });
    }
  }

  // ========== 管理员接口 ==========

  // 获取所有售后列表（管理员）
  static async getAllAfterSales(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        user_id,
        order_id,
        status
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        user_id: user_id ? parseInt(user_id) : null,
        order_id: order_id ? parseInt(order_id) : null,
        status: status || null
      };

      const result = await OrderAfterSale.findAll(options);

      res.json({
        success: true,
        message: '获取售后列表成功',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('获取售后列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取售后列表失败'
      });
    }
  }

  // 获取售后详情（管理员）
  static async getAfterSaleByIdAdmin(req, res) {
    try {
      const { id } = req.params;
      const afterSaleId = parseInt(id);

      if (isNaN(afterSaleId) || afterSaleId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的售后ID'
        });
      }

      const afterSale = await OrderAfterSale.findById(afterSaleId, true);

      if (!afterSale) {
        return res.status(404).json({
          success: false,
          message: '售后不存在'
        });
      }

      res.json({
        success: true,
        message: '获取售后详情成功',
        data: afterSale
      });
    } catch (error) {
      console.error('获取售后详情错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取售后详情失败'
      });
    }
  }

  // 更新售后（管理员）
  static async updateAfterSaleAdmin(req, res) {
    try {
      const { id } = req.params;
      const afterSaleId = parseInt(id);

      if (isNaN(afterSaleId) || afterSaleId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的售后ID'
        });
      }

      // 检查售后是否存在
      const afterSale = await OrderAfterSale.findById(afterSaleId);
      if (!afterSale) {
        return res.status(404).json({
          success: false,
          message: '售后不存在'
        });
      }

      const {
        reason,
        content,
        status,
        product_ids,
        end_time
      } = req.body;

      const updateData = {};
      if (reason !== undefined) updateData.reason = reason;
      if (content !== undefined) updateData.content = content;
      if (status !== undefined) updateData.status = status;
      if (product_ids !== undefined) updateData.product_ids = product_ids;
      if (end_time !== undefined) updateData.end_time = end_time;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有要更新的字段'
        });
      }

      const updatedAfterSale = await OrderAfterSale.update(afterSaleId, updateData);

      res.json({
        success: true,
        message: '售后更新成功',
        data: updatedAfterSale
      });
    } catch (error) {
      console.error('更新售后错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '更新售后失败'
      });
    }
  }

  // 修改售后状态（管理员）
  static async updateAfterSaleStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const afterSaleId = parseInt(id);

      if (isNaN(afterSaleId) || afterSaleId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的售后ID'
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: '售后状态不能为空'
        });
      }

      const updatedAfterSale = await OrderAfterSale.updateStatus(afterSaleId, status);

      res.json({
        success: true,
        message: '售后状态更新成功',
        data: updatedAfterSale
      });
    } catch (error) {
      console.error('更新售后状态错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '更新售后状态失败'
      });
    }
  }

  // 删除售后（管理员）
  static async deleteAfterSaleAdmin(req, res) {
    try {
      const { id } = req.params;
      const afterSaleId = parseInt(id);

      if (isNaN(afterSaleId) || afterSaleId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的售后ID'
        });
      }

      const deleted = await OrderAfterSale.delete(afterSaleId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: '售后不存在或删除失败'
        });
      }

      res.json({
        success: true,
        message: '售后删除成功'
      });
    } catch (error) {
      console.error('删除售后错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '删除售后失败'
      });
    }
  }
}

module.exports = OrderAfterSaleController;

