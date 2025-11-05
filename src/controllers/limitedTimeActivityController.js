/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-11 18:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-11 18:30:00
 * @FilePath: \showcase-backend-node\src\controllers\limitedTimeActivityController.js
 * @Description: 限时活动控制器
 */

const LimitedTimeActivity = require('../models/LimitedTimeActivity');

class LimitedTimeActivityController {
  // 获取限时活动列表（公开接口）
  static async getActivities(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        is_active
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      // 如果指定了is_active，添加到选项中
      if (is_active !== undefined) {
        options.is_active = is_active === 'true' || is_active === '1';
      }

      const result = await LimitedTimeActivity.findAll(options);

      res.json({
        success: true,
        message: '获取限时活动列表成功',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('获取限时活动列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取限时活动列表失败'
      });
    }
  }

  // 获取启用的限时活动列表（公开接口）
  static async getActiveActivities(req, res) {
    try {
      const activities = await LimitedTimeActivity.findActive();

      res.json({
        success: true,
        message: '获取启用限时活动列表成功',
        data: activities
      });
    } catch (error) {
      console.error('获取启用限时活动列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取启用限时活动列表失败'
      });
    }
  }

  // 创建限时活动
  static async createActivity(req, res) {
    try {
      const {
        title,
        description,
        start_time,
        end_time,
        is_active,
        product_ids
      } = req.body;

      const activityData = {
        title: title.trim(),
        description: description ? description.trim() : null,
        start_time: start_time || null,
        end_time: end_time || null,
        is_active: is_active !== undefined ? (is_active === true || is_active === 'true' || is_active === 1 || is_active === '1') : true,
        product_ids: Array.isArray(product_ids) ? product_ids : []
      };

      const activity = await LimitedTimeActivity.create(activityData);

      res.status(201).json({
        success: true,
        message: '限时活动创建成功',
        data: activity
      });
    } catch (error) {
      console.error('创建限时活动错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建限时活动失败'
      });
    }
  }

  // 获取单个限时活动详情
  static async getActivityById(req, res) {
    try {
      const { id } = req.params;
      const activityId = parseInt(id);

      if (isNaN(activityId) || activityId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的限时活动ID'
        });
      }

      const activity = await LimitedTimeActivity.findById(activityId);

      if (!activity) {
        return res.status(404).json({
          success: false,
          message: '限时活动不存在'
        });
      }

      res.json({
        success: true,
        message: '获取限时活动详情成功',
        data: activity
      });
    } catch (error) {
      console.error('获取限时活动详情错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取限时活动详情失败'
      });
    }
  }

  // 更新限时活动
  static async updateActivity(req, res) {
    try {
      const { id } = req.params;
      const activityId = parseInt(id);

      if (isNaN(activityId) || activityId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的限时活动ID'
        });
      }

      const {
        title,
        description,
        start_time,
        end_time,
        is_active,
        product_ids
      } = req.body;

      const updateData = {};

      if (title !== undefined) {
        updateData.title = title.trim();
      }
      if (description !== undefined) {
        updateData.description = description ? description.trim() : null;
      }
      if (start_time !== undefined) {
        updateData.start_time = start_time || null;
      }
      if (end_time !== undefined) {
        updateData.end_time = end_time || null;
      }
      if (is_active !== undefined) {
        updateData.is_active = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1';
      }
      if (product_ids !== undefined) {
        updateData.product_ids = Array.isArray(product_ids) ? product_ids : [];
      }

      // 检查是否有任何更新字段
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: '至少需要提供一个更新字段'
        });
      }

      const updated = await LimitedTimeActivity.update(activityId, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: '限时活动不存在或更新失败'
        });
      }

      res.json({
        success: true,
        message: '限时活动更新成功',
        data: updated
      });
    } catch (error) {
      console.error('更新限时活动错误:', error);
      
      if (error.message === '限时活动不存在') {
        return res.status(404).json({
          success: false,
          message: '限时活动不存在'
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || '更新限时活动失败'
      });
    }
  }

  // 删除限时活动
  static async deleteActivity(req, res) {
    try {
      const { id } = req.params;
      const activityId = parseInt(id);

      if (isNaN(activityId) || activityId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的限时活动ID'
        });
      }

      const deleted = await LimitedTimeActivity.delete(activityId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: '限时活动不存在或删除失败'
        });
      }

      res.json({
        success: true,
        message: '限时活动删除成功'
      });
    } catch (error) {
      console.error('删除限时活动错误:', error);
      
      if (error.message === '限时活动不存在') {
        return res.status(404).json({
          success: false,
          message: '限时活动不存在'
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || '删除限时活动失败'
      });
    }
  }

  // 批量删除限时活动
  static async batchDeleteActivities(req, res) {
    try {
      const { activityIds } = req.body;

      const result = await LimitedTimeActivity.batchDelete(activityIds);

      res.json({
        success: true,
        message: `成功删除${result.deletedCount}个限时活动`,
        data: {
          deletedCount: result.deletedCount,
          requestedIds: result.requestedIds
        }
      });
    } catch (error) {
      console.error('批量删除限时活动错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '批量删除限时活动失败'
      });
    }
  }
}

module.exports = LimitedTimeActivityController;

