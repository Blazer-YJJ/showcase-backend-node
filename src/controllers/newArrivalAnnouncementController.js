/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-11 18:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-11 18:30:00
 * @FilePath: \showcase-backend-node\src\controllers\newArrivalAnnouncementController.js
 * @Description: 上新公告控制器
 */

const NewArrivalAnnouncement = require('../models/NewArrivalAnnouncement');

class NewArrivalAnnouncementController {
  // 创建上新公告（需要管理员权限）
  static async createAnnouncement(req, res) {
    try {
      const { content, is_active = 1, product_ids = [] } = req.body;

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

      const announcement = await NewArrivalAnnouncement.create({
        content,
        is_active,
        product_ids: Array.isArray(product_ids) ? product_ids : []
      });

      res.status(201).json({
        success: true,
        message: '上新公告创建成功',
        data: announcement
      });
    } catch (error) {
      console.error('创建上新公告错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 获取上新公告列表（返回所有状态的公告，包括禁用和启用）
  static async getAnnouncements(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        is_active,
        include_products = 'true'
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

      // 验证状态筛选参数（可选）
      let statusFilter = null;
      if (is_active !== undefined && is_active !== '') {
        const statusValue = parseInt(is_active);
        if (isNaN(statusValue) || (statusValue !== 0 && statusValue !== 1)) {
          return res.status(400).json({
            success: false,
            message: '状态筛选值只能是0或1'
          });
        }
        statusFilter = statusValue;
      }

      const result = await NewArrivalAnnouncement.findAll({
        page: pageNum,
        limit: limitNum,
        is_active: statusFilter, // 如果不传 is_active 参数，则返回所有状态的公告
        include_products: include_products === 'true'
      });

      res.json({
        success: true,
        message: '获取上新公告列表成功',
        data: result
      });
    } catch (error) {
      console.error('获取上新公告列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 获取单个上新公告详情（公开接口）
  static async getAnnouncement(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '公告ID必须是有效数字'
        });
      }

      const announcement = await NewArrivalAnnouncement.findById(parseInt(id));

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
        message: '获取上新公告详情成功',
        data: announcement
      });
    } catch (error) {
      console.error('获取上新公告详情错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 更新上新公告（需要管理员权限）
  static async updateAnnouncement(req, res) {
    try {
      const { id } = req.params;
      const { content, is_active, product_ids } = req.body;

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

      const announcement = await NewArrivalAnnouncement.update(parseInt(id), {
        content,
        is_active,
        product_ids: product_ids !== undefined ? (Array.isArray(product_ids) ? product_ids : []) : undefined
      });

      res.json({
        success: true,
        message: '上新公告更新成功',
        data: announcement
      });
    } catch (error) {
      console.error('更新上新公告错误:', error);
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

  // 删除上新公告（需要管理员权限）
  static async deleteAnnouncement(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '公告ID必须是有效数字'
        });
      }

      const result = await NewArrivalAnnouncement.delete(parseInt(id));

      res.json({
        success: true,
        message: '上新公告删除成功',
        data: result
      });
    } catch (error) {
      console.error('删除上新公告错误:', error);
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

  // 批量删除上新公告（需要管理员权限）
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

      const result = await NewArrivalAnnouncement.batchDelete(announcementIds.map(id => parseInt(id)));

      res.json({
        success: true,
        message: `成功删除 ${result.deletedCount} 个上新公告`,
        data: {
          deletedCount: result.deletedCount,
          deletedIds: result.deletedIds
        }
      });
    } catch (error) {
      console.error('批量删除上新公告错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 获取所有上新公告列表（管理员接口，包括未启用的）
  static async getAllAnnouncements(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        is_active,
        include_products = 'true'
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

      const result = await NewArrivalAnnouncement.findAll({
        page: pageNum,
        limit: limitNum,
        is_active: statusFilter,
        include_products: include_products === 'true'
      });

      res.json({
        success: true,
        message: '获取上新公告列表成功',
        data: result
      });
    } catch (error) {
      console.error('获取上新公告列表错误:', error);
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

      const announcement = await NewArrivalAnnouncement.toggleStatus(parseInt(id), is_active);

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

  // 获取启用的上新公告列表（公开接口）
  static async getActiveAnnouncements(req, res) {
    try {
      const { include_products = 'true' } = req.query;

      const announcements = await NewArrivalAnnouncement.findActive({
        include_products: include_products === 'true'
      });

      res.json({
        success: true,
        message: '获取启用上新公告列表成功',
        data: announcements
      });
    } catch (error) {
      console.error('获取启用上新公告列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }

  // 获取上新公告统计信息（管理员权限）
  static async getStats(req, res) {
    try {
      const stats = await NewArrivalAnnouncement.getStats();

      res.json({
        success: true,
        message: '获取上新公告统计成功',
        data: stats
      });
    } catch (error) {
      console.error('获取上新公告统计错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '服务器内部错误'
      });
    }
  }
}

module.exports = NewArrivalAnnouncementController;

