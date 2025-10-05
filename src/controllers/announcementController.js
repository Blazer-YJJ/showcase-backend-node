/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\controllers\announcementController.js
 * @Description: 公告信息控制器
 */

const Announcement = require('../models/Announcement');

class AnnouncementController {
  // 创建公告（需要管理员权限）
  static async createAnnouncement(req, res) {
    try {
      const { content, is_active = 1 } = req.body;

      // 验证必填字段
      if (!content) {
        return res.status(400).json({
          success: false,
          message: '公告内容不能为空'
        });
      }

      // 验证内容长度
      if (content.length > 10000) {
        return res.status(400).json({
          success: false,
          message: '公告内容不能超过10000个字符'
        });
      }

      // 验证状态值
      if (is_active !== 0 && is_active !== 1) {
        return res.status(400).json({
          success: false,
          message: '启用状态只能是0或1'
        });
      }

      const announcement = await Announcement.create({
        content,
        is_active
      });

      res.status(201).json({
        success: true,
        message: '公告创建成功',
        data: announcement
      });
    } catch (error) {
      console.error('创建公告错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 获取公告列表（公开接口，只返回启用的公告）
  static async getAnnouncements(req, res) {
    try {
      const {
        page = 1,
        limit = 10
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

      const result = await Announcement.findAll({
        page: pageNum,
        limit: limitNum,
        is_active: 1 // 只返回启用的公告
      });

      res.json({
        success: true,
        message: '获取公告列表成功',
        data: result
      });
    } catch (error) {
      console.error('获取公告列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 获取单个公告详情（公开接口）
  static async getAnnouncement(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '公告ID必须是有效数字'
        });
      }

      const announcement = await Announcement.findById(parseInt(id));

      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: '公告不存在'
        });
      }

      // 公开接口只返回启用的公告
      if (announcement.is_active !== 1) {
        return res.status(404).json({
          success: false,
          message: '公告不存在'
        });
      }

      res.json({
        success: true,
        message: '获取公告详情成功',
        data: announcement
      });
    } catch (error) {
      console.error('获取公告详情错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 更新公告（需要管理员权限）
  static async updateAnnouncement(req, res) {
    try {
      const { id } = req.params;
      const { content, is_active } = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '公告ID必须是有效数字'
        });
      }

      // 验证更新数据
      if (content !== undefined && (!content || content.trim().length === 0)) {
        return res.status(400).json({
          success: false,
          message: '公告内容不能为空'
        });
      }

      if (content && content.length > 10000) {
        return res.status(400).json({
          success: false,
          message: '公告内容不能超过10000个字符'
        });
      }

      if (is_active !== undefined && is_active !== 0 && is_active !== 1) {
        return res.status(400).json({
          success: false,
          message: '启用状态只能是0或1'
        });
      }

      const announcement = await Announcement.update(parseInt(id), {
        content,
        is_active
      });

      res.json({
        success: true,
        message: '公告更新成功',
        data: announcement
      });
    } catch (error) {
      console.error('更新公告错误:', error);
      if (error.message === '公告不存在') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 删除公告（需要管理员权限）
  static async deleteAnnouncement(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '公告ID必须是有效数字'
        });
      }

      const result = await Announcement.delete(parseInt(id));

      res.json({
        success: true,
        message: '公告删除成功',
        data: result
      });
    } catch (error) {
      console.error('删除公告错误:', error);
      if (error.message === '公告不存在') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 批量删除公告（需要管理员权限）
  static async batchDeleteAnnouncements(req, res) {
    try {
      const { announcementIds } = req.body;

      if (!announcementIds || !Array.isArray(announcementIds) || announcementIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: '公告ID数组不能为空'
        });
      }

      // 验证所有ID都是数字
      const invalidIds = announcementIds.filter(id => isNaN(id) || parseInt(id) <= 0);
      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: `无效的公告ID: ${invalidIds.join(', ')}`
        });
      }

      const result = await Announcement.batchDelete(announcementIds.map(id => parseInt(id)));

      res.json({
        success: true,
        message: `成功删除 ${result.deletedCount} 个公告`,
        data: {
          deletedCount: result.deletedCount,
          deletedIds: result.deletedIds
        }
      });
    } catch (error) {
      console.error('批量删除公告错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 获取所有公告列表（管理员接口，包括未启用的）
  static async getAllAnnouncements(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        is_active
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

      // 验证状态筛选参数
      let statusFilter = null;
      if (is_active !== undefined) {
        const statusValue = parseInt(is_active);
        if (statusValue !== 0 && statusValue !== 1) {
          return res.status(400).json({
            success: false,
            message: '状态筛选值只能是0或1'
          });
        }
        statusFilter = statusValue;
      }

      const result = await Announcement.findAll({
        page: pageNum,
        limit: limitNum,
        is_active: statusFilter
      });

      res.json({
        success: true,
        message: '获取公告列表成功',
        data: result
      });
    } catch (error) {
      console.error('获取公告列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 切换公告状态（需要管理员权限）
  static async toggleAnnouncementStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '公告ID必须是有效数字'
        });
      }

      if (is_active === undefined || (is_active !== 0 && is_active !== 1)) {
        return res.status(400).json({
          success: false,
          message: '启用状态只能是0或1'
        });
      }

      const announcement = await Announcement.toggleStatus(parseInt(id), is_active);

      res.json({
        success: true,
        message: `公告已${is_active ? '启用' : '禁用'}`,
        data: announcement
      });
    } catch (error) {
      console.error('切换公告状态错误:', error);
      if (error.message === '公告不存在') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 获取启用的公告列表（公开接口）
  static async getActiveAnnouncements(req, res) {
    try {
      const {
        page = 1,
        limit = 10
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

      const result = await Announcement.findAll({
        page: pageNum,
        limit: limitNum,
        is_active: 1 // 只返回启用的公告
      });

      res.json({
        success: true,
        message: '获取启用公告列表成功',
        data: result
      });
    } catch (error) {
      console.error('获取启用公告列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }
}

module.exports = AnnouncementController;
