/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\validators\customerServiceValidator.js
 * @Description: 客服联系信息验证器
 */

/**
 * 验证查询参数
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const validateQueryParams = (req, res, next) => {
  const { page, limit, status } = req.query;

  // 验证页码
  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({
      success: false,
      message: '页码必须是大于0的数字'
    });
  }

  // 验证每页数量
  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      success: false,
      message: '每页数量必须是1-100之间的数字'
    });
  }

  // 验证状态
  if (status && !['active', 'inactive'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: '状态必须是 active 或 inactive'
    });
  }

  next();
};

/**
 * 验证客服联系信息ID
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const validateServiceId = (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id) || parseInt(id) < 1) {
    return res.status(400).json({
      success: false,
      message: '客服联系信息ID必须是有效的数字'
    });
  }

  next();
};

/**
 * 验证创建客服联系信息的数据
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const validateCreateCustomerService = (req, res, next) => {
  const { contact_phone, wechat_number, wechat_image } = req.body;
  const errors = [];

  // 验证联系电话
  if (!contact_phone || typeof contact_phone !== 'string' || contact_phone.trim().length === 0) {
    errors.push('联系电话不能为空');
  } else if (contact_phone.trim().length > 20) {
    errors.push('联系电话不能超过20个字符');
  }

  // 验证微信号
  if (!wechat_number || typeof wechat_number !== 'string' || wechat_number.trim().length === 0) {
    errors.push('微信号不能为空');
  } else if (wechat_number.trim().length > 50) {
    errors.push('微信号不能超过50个字符');
  }

  // 验证微信图片（可选）
  if (wechat_image && (typeof wechat_image !== 'string' || wechat_image.trim().length > 500)) {
    errors.push('微信图片URL不能超过500个字符');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: errors
    });
  }

  next();
};

/**
 * 验证更新客服联系信息的数据
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const validateUpdateCustomerService = (req, res, next) => {
  const { contact_phone, wechat_number, wechat_image } = req.body;
  const errors = [];

  // 验证联系电话（如果提供）
  if (contact_phone !== undefined) {
    if (typeof contact_phone !== 'string' || contact_phone.trim().length === 0) {
      errors.push('联系电话不能为空');
    } else if (contact_phone.trim().length > 20) {
      errors.push('联系电话不能超过20个字符');
    }
  }

  // 验证微信号（如果提供）
  if (wechat_number !== undefined) {
    if (typeof wechat_number !== 'string' || wechat_number.trim().length === 0) {
      errors.push('微信号不能为空');
    } else if (wechat_number.trim().length > 50) {
      errors.push('微信号不能超过50个字符');
    }
  }

  // 验证微信图片（如果提供）
  if (wechat_image !== undefined && (typeof wechat_image !== 'string' || wechat_image.trim().length > 500)) {
    errors.push('微信图片URL不能超过500个字符');
  }

  // 检查是否至少提供了一个要更新的字段
  if (Object.keys(req.body).length === 0 && !req.file) {
    errors.push('至少需要提供一个要更新的字段');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: errors
    });
  }

  next();
};

module.exports = {
  validateQueryParams,
  validateServiceId,
  validateCreateCustomerService,
  validateUpdateCustomerService
};

