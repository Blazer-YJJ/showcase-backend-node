/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-11 18:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-11 18:30:00
 * @FilePath: \showcase-backend-node\src\validators\limitedTimeActivityValidator.js
 * @Description: 限时活动验证器
 */

// 验证创建限时活动的数据
const validateCreateActivity = (req, res, next) => {
  try {
    const { title, description, start_time, end_time, is_active, product_ids } = req.body;

    // 验证必填字段
    if (!title) {
      return res.status(400).json({
        success: false,
        message: '活动标题不能为空'
      });
    }

    // 验证标题类型和长度
    if (typeof title !== 'string') {
      return res.status(400).json({
        success: false,
        message: '活动标题必须是字符串类型'
      });
    }

    if (title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '活动标题不能为空'
      });
    }

    if (title.length > 200) {
      return res.status(400).json({
        success: false,
        message: '活动标题不能超过200个字符'
      });
    }

    // 验证描述（可选）
    if (description !== undefined && description !== null) {
      if (typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          message: '活动描述必须是字符串类型'
        });
      }
    }

    // 验证时间
    if (start_time !== undefined && start_time !== null) {
      const start = new Date(start_time);
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          message: '活动开始时间格式无效'
        });
      }
    }

    if (end_time !== undefined && end_time !== null) {
      const end = new Date(end_time);
      if (isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: '活动结束时间格式无效'
        });
      }
    }

    // 验证时间范围
    if (start_time && end_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: '活动开始时间必须早于结束时间'
        });
      }
    }

    // 验证is_active（可选）
    if (is_active !== undefined) {
      if (typeof is_active !== 'boolean' && 
          typeof is_active !== 'number' && 
          typeof is_active !== 'string' &&
          is_active !== null) {
        return res.status(400).json({
          success: false,
          message: 'is_active字段格式无效'
        });
      }
    }

    // 验证product_ids（可选）
    if (product_ids !== undefined) {
      if (!Array.isArray(product_ids)) {
        return res.status(400).json({
          success: false,
          message: '商品ID必须是数组格式'
        });
      }

      // 验证每个ID的格式
      const invalidIds = product_ids.filter(id => {
        const numId = parseInt(id);
        return isNaN(numId) || numId <= 0;
      });

      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: `无效的商品ID: ${invalidIds.join(', ')}`
        });
      }
    }

    next();
  } catch (error) {
    console.error('验证创建限时活动数据错误:', error);
    res.status(500).json({
      success: false,
      message: '数据验证失败'
    });
  }
};

// 验证更新限时活动的数据
const validateUpdateActivity = (req, res, next) => {
  try {
    const { title, description, start_time, end_time, is_active, product_ids } = req.body;

    // 至少需要提供一个更新字段
    if (title === undefined && description === undefined && 
        start_time === undefined && end_time === undefined && 
        is_active === undefined && product_ids === undefined) {
      return res.status(400).json({
        success: false,
        message: '至少需要提供一个更新字段'
      });
    }

    // 验证标题（如果提供）
    if (title !== undefined) {
      if (typeof title !== 'string') {
        return res.status(400).json({
          success: false,
          message: '活动标题必须是字符串类型'
        });
      }

      if (title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '活动标题不能为空'
        });
      }

      if (title.length > 200) {
        return res.status(400).json({
          success: false,
          message: '活动标题不能超过200个字符'
        });
      }
    }

    // 验证描述（如果提供）
    if (description !== undefined && description !== null) {
      if (typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          message: '活动描述必须是字符串类型'
        });
      }
    }

    // 验证开始时间（如果提供）
    if (start_time !== undefined && start_time !== null) {
      const start = new Date(start_time);
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          message: '活动开始时间格式无效'
        });
      }
    }

    // 验证结束时间（如果提供）
    if (end_time !== undefined && end_time !== null) {
      const end = new Date(end_time);
      if (isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: '活动结束时间格式无效'
        });
      }
    }

    // 验证时间范围（如果两个时间都提供了）
    if (start_time && end_time) {
      const start = new Date(start_time);
      const end = new Date(end_time);
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: '活动开始时间必须早于结束时间'
        });
      }
    }

    // 验证is_active（如果提供）
    if (is_active !== undefined) {
      if (typeof is_active !== 'boolean' && 
          typeof is_active !== 'number' && 
          typeof is_active !== 'string' &&
          is_active !== null) {
        return res.status(400).json({
          success: false,
          message: 'is_active字段格式无效'
        });
      }
    }

    // 验证product_ids（如果提供）
    if (product_ids !== undefined) {
      if (!Array.isArray(product_ids)) {
        return res.status(400).json({
          success: false,
          message: '商品ID必须是数组格式'
        });
      }

      // 验证每个ID的格式
      const invalidIds = product_ids.filter(id => {
        const numId = parseInt(id);
        return isNaN(numId) || numId <= 0;
      });

      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: `无效的商品ID: ${invalidIds.join(', ')}`
        });
      }
    }

    next();
  } catch (error) {
    console.error('验证更新限时活动数据错误:', error);
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

    // 验证is_active（如果提供）
    if (is_active !== undefined) {
      if (is_active !== 'true' && is_active !== 'false' && 
          is_active !== '1' && is_active !== '0') {
        return res.status(400).json({
          success: false,
          message: 'is_active参数必须是true/false或1/0'
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

// 验证批量删除的数据
const validateBatchDelete = (req, res, next) => {
  try {
    const { activityIds } = req.body;

    // 验证必填字段
    if (!activityIds) {
      return res.status(400).json({
        success: false,
        message: '活动ID数组不能为空'
      });
    }

    // 验证数组类型
    if (!Array.isArray(activityIds)) {
      return res.status(400).json({
        success: false,
        message: '活动ID必须是数组格式'
      });
    }

    // 验证数组长度
    if (activityIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '活动ID数组不能为空'
      });
    }

    if (activityIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: '单次最多删除100个活动'
      });
    }

    // 验证每个ID的格式
    const invalidIds = activityIds.filter(id => {
      return isNaN(id) || parseInt(id) <= 0;
    });

    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `无效的活动ID: ${invalidIds.join(', ')}`
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

module.exports = {
  validateCreateActivity,
  validateUpdateActivity,
  validateQueryParams,
  validateBatchDelete
};

