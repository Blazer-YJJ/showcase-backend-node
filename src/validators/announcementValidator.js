/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\validators\announcementValidator.js
 * @Description: 公告信息验证器
 */

// 验证创建公告的数据
const validateCreateAnnouncement = (req, res, next) => {
  try {
    const { content, is_active } = req.body;

    // 验证必填字段
    if (!content) {
      return res.status(400).json({
        success: false,
        message: '公告内容不能为空'
      });
    }

    // 验证内容类型和长度
    if (typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        message: '公告内容必须是字符串类型'
      });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '公告内容不能为空'
      });
    }

    if (content.length > 10000) {
      return res.status(400).json({
        success: false,
        message: '公告内容不能超过10000个字符'
      });
    }

    // 验证状态值（可选）
    if (is_active !== undefined) {
      if (typeof is_active !== 'number' && typeof is_active !== 'string') {
        return res.status(400).json({
          success: false,
          message: '启用状态必须是数字类型'
        });
      }

      const statusValue = parseInt(is_active);
      if (statusValue !== 0 && statusValue !== 1) {
        return res.status(400).json({
          success: false,
          message: '启用状态只能是0或1'
        });
      }
    }

    next();
  } catch (error) {
    console.error('验证创建公告数据错误:', error);
    res.status(500).json({
      success: false,
      message: '数据验证失败'
    });
  }
};

// 验证更新公告的数据
const validateUpdateAnnouncement = (req, res, next) => {
  try {
    const { content, is_active } = req.body;

    // 至少需要提供一个更新字段
    if (content === undefined && is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: '至少需要提供一个更新字段'
      });
    }

    // 验证内容（如果提供）
    if (content !== undefined) {
      if (typeof content !== 'string') {
        return res.status(400).json({
          success: false,
          message: '公告内容必须是字符串类型'
        });
      }

      if (content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '公告内容不能为空'
        });
      }

      if (content.length > 10000) {
        return res.status(400).json({
          success: false,
          message: '公告内容不能超过10000个字符'
        });
      }
    }

    // 验证状态值（如果提供）
    if (is_active !== undefined) {
      if (typeof is_active !== 'number' && typeof is_active !== 'string') {
        return res.status(400).json({
          success: false,
          message: '启用状态必须是数字类型'
        });
      }

      const statusValue = parseInt(is_active);
      if (statusValue !== 0 && statusValue !== 1) {
        return res.status(400).json({
          success: false,
          message: '启用状态只能是0或1'
        });
      }
    }

    next();
  } catch (error) {
    console.error('验证更新公告数据错误:', error);
    res.status(500).json({
      success: false,
      message: '数据验证失败'
    });
  }
};

// 验证切换状态的数据
const validateToggleStatus = (req, res, next) => {
  try {
    const { is_active } = req.body;

    // 验证必填字段
    if (is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: '启用状态不能为空'
      });
    }

    // 验证状态值类型
    if (typeof is_active !== 'number' && typeof is_active !== 'string') {
      return res.status(400).json({
        success: false,
        message: '启用状态必须是数字类型'
      });
    }

    // 验证状态值范围
    const statusValue = parseInt(is_active);
    if (statusValue !== 0 && statusValue !== 1) {
      return res.status(400).json({
        success: false,
        message: '启用状态只能是0或1'
      });
    }

    next();
  } catch (error) {
    console.error('验证切换状态数据错误:', error);
    res.status(500).json({
      success: false,
      message: '数据验证失败'
    });
  }
};

// 验证批量删除的数据
const validateBatchDelete = (req, res, next) => {
  try {
    const { announcementIds } = req.body;

    // 验证必填字段
    if (!announcementIds) {
      return res.status(400).json({
        success: false,
        message: '公告ID数组不能为空'
      });
    }

    // 验证数组类型
    if (!Array.isArray(announcementIds)) {
      return res.status(400).json({
        success: false,
        message: '公告ID必须是数组格式'
      });
    }

    // 验证数组长度
    if (announcementIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '公告ID数组不能为空'
      });
    }

    if (announcementIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: '单次最多删除100个公告'
      });
    }

    // 验证每个ID的格式
    const invalidIds = announcementIds.filter(id => {
      return isNaN(id) || parseInt(id) <= 0;
    });

    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `无效的公告ID: ${invalidIds.join(', ')}`
      });
    }

    next();
  } catch (error) {
    console.error('验证批量删除数据错误:', error);
    res.status(500).json({
      success: false,
      message: '数据验证失败'
    });
  }
};

// 验证查询参数
const validateQueryParams = (req, res, next) => {
  try {
    const { page, limit, is_active } = req.query;

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

    // 验证状态筛选
    if (is_active !== undefined) {
      const statusValue = parseInt(is_active);
      if (statusValue !== 0 && statusValue !== 1) {
        return res.status(400).json({
          success: false,
          message: '状态筛选值只能是0或1'
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
  validateCreateAnnouncement,
  validateUpdateAnnouncement,
  validateToggleStatus,
  validateBatchDelete,
  validateQueryParams
};
