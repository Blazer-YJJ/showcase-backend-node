/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\validators\feedbackValidator.js
 * @Description: 意见反馈验证器
 */

// 验证创建反馈的数据
const validateCreateFeedback = (req, res, next) => {
  try {
    const { title, content } = req.body;
    const feedback_image = req.file ? req.file.path : req.body.feedback_image;

    // 验证必填字段
    if (!title) {
      return res.status(400).json({
        success: false,
        message: '反馈标题不能为空'
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '反馈内容不能为空'
      });
    }

    // 验证标题类型和长度
    if (typeof title !== 'string') {
      return res.status(400).json({
        success: false,
        message: '反馈标题必须是字符串类型'
      });
    }

    if (title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '反馈标题不能为空'
      });
    }

    if (title.length > 200) {
      return res.status(400).json({
        success: false,
        message: '反馈标题不能超过200个字符'
      });
    }

    // 验证内容类型和长度
    if (typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        message: '反馈内容必须是字符串类型'
      });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '反馈内容不能为空'
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        success: false,
        message: '反馈内容不能超过5000个字符'
      });
    }

    // 验证图片路径（可选）
    if (feedback_image !== undefined && feedback_image !== null) {
      if (typeof feedback_image !== 'string') {
        return res.status(400).json({
          success: false,
          message: '反馈图片路径必须是字符串类型'
        });
      }

      if (feedback_image.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '反馈图片路径不能为空字符串'
        });
      }

      if (feedback_image.length > 500) {
        return res.status(400).json({
          success: false,
          message: '反馈图片路径不能超过500个字符'
        });
      }
    }

    // 将文件路径添加到请求体中，供控制器使用
    if (req.file) {
      req.body.feedback_image = req.file.path;
    }

    next();
  } catch (error) {
    console.error('验证创建反馈数据错误:', error);
    res.status(500).json({
      success: false,
      message: '数据验证失败'
    });
  }
};

// 验证查询参数
const validateQueryParams = (req, res, next) => {
  try {
    const { page, limit, user_id } = req.query;

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
    const { feedbackIds } = req.body;

    // 验证必填字段
    if (!feedbackIds) {
      return res.status(400).json({
        success: false,
        message: '反馈ID数组不能为空'
      });
    }

    // 验证数组类型
    if (!Array.isArray(feedbackIds)) {
      return res.status(400).json({
        success: false,
        message: '反馈ID必须是数组格式'
      });
    }

    // 验证数组长度
    if (feedbackIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '反馈ID数组不能为空'
      });
    }

    if (feedbackIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: '单次最多删除100个反馈'
      });
    }

    // 验证每个ID的格式
    const invalidIds = feedbackIds.filter(id => {
      return isNaN(id) || parseInt(id) <= 0;
    });

    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `无效的反馈ID: ${invalidIds.join(', ')}`
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
  validateCreateFeedback,
  validateQueryParams,
  validateBatchDelete
};
