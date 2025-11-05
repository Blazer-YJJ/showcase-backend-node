/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-11 17:00:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-11 17:00:00
 * @FilePath: \showcase-backend-node\src\controllers\orderController.js
 * @Description: 订单控制器
 */

const Order = require('../models/Order');

class OrderController {
  // 创建订单（会员）
  static async createOrder(req, res) {
    try {
      const {
        address_id,
        items, // 商品数组：[{product_id, item_note?}]
        order_note
      } = req.body;

      // 从认证中间件获取用户ID
      const user_id = req.user.user_id;

      const orderData = {
        user_id,
        address_id,
        items,
        order_note,
        order_status: 'pending'
      };

      const order = await Order.create(orderData);

      res.status(201).json({
        success: true,
        message: '订单创建成功',
        data: order
      });
    } catch (error) {
      console.error('创建订单错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建订单失败'
      });
    }
  }

  // 获取当前用户的订单列表（会员）
  static async getMyOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        order_status
      } = req.query;

      // 从认证中间件获取用户ID
      const user_id = req.user.user_id;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        user_id,
        order_status: order_status || null
      };

      const result = await Order.findAll(options);

      res.json({
        success: true,
        message: '获取订单列表成功',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('获取订单列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取订单列表失败'
      });
    }
  }

  // 获取订单详情（会员）
  static async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const orderId = parseInt(id);

      if (isNaN(orderId) || orderId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的订单ID'
        });
      }

      // 从认证中间件获取用户ID
      const user_id = req.user.user_id;

      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      // 验证订单是否属于当前用户
      if (order.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: '无权访问此订单'
        });
      }

      res.json({
        success: true,
        message: '获取订单详情成功',
        data: order
      });
    } catch (error) {
      console.error('获取订单详情错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取订单详情失败'
      });
    }
  }

  // 更新订单（会员）
  static async updateOrder(req, res) {
    try {
      const { id } = req.params;
      const orderId = parseInt(id);

      if (isNaN(orderId) || orderId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的订单ID'
        });
      }

      // 从认证中间件获取用户ID
      const user_id = req.user.user_id;

      // 检查订单是否存在且属于当前用户
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      if (order.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: '无权修改此订单'
        });
      }

      // 只允许更新某些字段（会员不能修改订单状态）
      const {
        address_id,
        items, // 商品数组：[{product_id, item_note?}]
        item_note, // 向后兼容：更新第一个订单项的备注
        order_note
      } = req.body;

      const updateData = {};
      if (address_id !== undefined) updateData.address_id = address_id;
      if (items !== undefined) updateData.items = items;
      if (item_note !== undefined) updateData.item_note = item_note;
      if (order_note !== undefined) updateData.order_note = order_note;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有要更新的字段'
        });
      }

      const updatedOrder = await Order.update(orderId, updateData);

      res.json({
        success: true,
        message: '订单更新成功',
        data: updatedOrder
      });
    } catch (error) {
      console.error('更新订单错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '更新订单失败'
      });
    }
  }

  // 删除订单（会员）
  static async deleteOrder(req, res) {
    try {
      const { id } = req.params;
      const orderId = parseInt(id);

      if (isNaN(orderId) || orderId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的订单ID'
        });
      }

      // 从认证中间件获取用户ID
      const user_id = req.user.user_id;

      // 检查订单是否存在且属于当前用户
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      if (order.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          message: '无权删除此订单'
        });
      }

      const deleted = await Order.delete(orderId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: '订单不存在或删除失败'
        });
      }

      res.json({
        success: true,
        message: '订单删除成功'
      });
    } catch (error) {
      console.error('删除订单错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '删除订单失败'
      });
    }
  }

  // ========== 管理员接口 ==========

  // 获取所有订单列表（管理员）
  static async getAllOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        user_id,
        order_status
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        user_id: user_id ? parseInt(user_id) : null,
        order_status: order_status || null
      };

      const result = await Order.findAll(options);

      res.json({
        success: true,
        message: '获取订单列表成功',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('获取订单列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取订单列表失败'
      });
    }
  }

  // 获取订单详情（管理员）
  static async getOrderByIdAdmin(req, res) {
    try {
      const { id } = req.params;
      const orderId = parseInt(id);

      if (isNaN(orderId) || orderId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的订单ID'
        });
      }

      const order = await Order.findById(orderId, true);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      res.json({
        success: true,
        message: '获取订单详情成功',
        data: order
      });
    } catch (error) {
      console.error('获取订单详情错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取订单详情失败'
      });
    }
  }

  // 更新订单（管理员）
  static async updateOrderAdmin(req, res) {
    try {
      const { id } = req.params;
      const orderId = parseInt(id);

      if (isNaN(orderId) || orderId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的订单ID'
        });
      }

      // 检查订单是否存在
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      const {
        address_id,
        items, // 商品数组：[{product_id, item_note?}]
        order_note
      } = req.body;

      const updateData = {};
      if (address_id !== undefined) updateData.address_id = address_id;
      if (items !== undefined) updateData.items = items;
      if (order_note !== undefined) updateData.order_note = order_note;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有要更新的字段'
        });
      }

      const updatedOrder = await Order.update(orderId, updateData);

      res.json({
        success: true,
        message: '订单更新成功',
        data: updatedOrder
      });
    } catch (error) {
      console.error('更新订单错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '更新订单失败'
      });
    }
  }

  // 修改订单状态（管理员）
  static async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { order_status } = req.body;

      const orderId = parseInt(id);

      if (isNaN(orderId) || orderId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的订单ID'
        });
      }

      if (!order_status) {
        return res.status(400).json({
          success: false,
          message: '订单状态不能为空'
        });
      }

      const updatedOrder = await Order.updateStatus(orderId, order_status);

      res.json({
        success: true,
        message: '订单状态更新成功',
        data: updatedOrder
      });
    } catch (error) {
      console.error('更新订单状态错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '更新订单状态失败'
      });
    }
  }

  // 删除订单（管理员）
  static async deleteOrderAdmin(req, res) {
    try {
      const { id } = req.params;
      const orderId = parseInt(id);

      if (isNaN(orderId) || orderId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的订单ID'
        });
      }

      const deleted = await Order.delete(orderId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: '订单不存在或删除失败'
        });
      }

      res.json({
        success: true,
        message: '订单删除成功'
      });
    } catch (error) {
      console.error('删除订单错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '删除订单失败'
      });
    }
  }
}

module.exports = OrderController;

