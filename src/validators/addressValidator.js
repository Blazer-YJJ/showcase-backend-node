/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-11 17:00:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-11 17:00:00
 * @FilePath: \showcase-backend-node\src\validators\addressValidator.js
 * @Description: 地址验证器
 */

// 验证创建地址的数据
const validateCreateAddress = (req, res, next) => {
  try {
    const { name, phone, address } = req.body;

    // 验证必填字段
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '收货人姓名不能为空'
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: '联系电话不能为空'
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        message: '详细地址不能为空'
      });
    }

    // 验证姓名类型和长度
    if (typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: '收货人姓名必须是字符串类型'
      });
    }

    if (name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '收货人姓名不能为空'
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: '收货人姓名不能超过100个字符'
      });
    }

    // 验证电话类型和长度
    if (typeof phone !== 'string') {
      return res.status(400).json({
        success: false,
        message: '联系电话必须是字符串类型'
      });
    }

    if (phone.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '联系电话不能为空'
      });
    }

    if (phone.trim().length > 20) {
      return res.status(400).json({
        success: false,
        message: '联系电话不能超过20个字符'
      });
    }

    // 验证地址类型
    if (typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        message: '详细地址必须是字符串类型'
      });
    }

    if (address.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '详细地址不能为空'
      });
    }

    next();
  } catch (error) {
    console.error('验证创建地址数据错误:', error);
    res.status(500).json({
      success: false,
      message: '数据验证失败'
    });
  }
};

// 验证更新地址的数据
const validateUpdateAddress = (req, res, next) => {
  try {
    const { name, phone, address } = req.body;

    // 至少需要有一个更新字段
    if (name === undefined && phone === undefined && address === undefined) {
      return res.status(400).json({
        success: false,
        message: '至少需要提供一个要更新的字段'
      });
    }

    // 验证姓名（可选）
    if (name !== undefined) {
      if (typeof name !== 'string') {
        return res.status(400).json({
          success: false,
          message: '收货人姓名必须是字符串类型'
        });
      }

      if (name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '收货人姓名不能为空'
        });
      }

      if (name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: '收货人姓名不能超过100个字符'
        });
      }
    }

    // 验证电话（可选）
    if (phone !== undefined) {
      if (typeof phone !== 'string') {
        return res.status(400).json({
          success: false,
          message: '联系电话必须是字符串类型'
        });
      }

      if (phone.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '联系电话不能为空'
        });
      }

      if (phone.trim().length > 20) {
        return res.status(400).json({
          success: false,
          message: '联系电话不能超过20个字符'
        });
      }
    }

    // 验证地址（可选）
    if (address !== undefined) {
      if (typeof address !== 'string') {
        return res.status(400).json({
          success: false,
          message: '详细地址必须是字符串类型'
        });
      }

      if (address.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '详细地址不能为空'
        });
      }
    }

    next();
  } catch (error) {
    console.error('验证更新地址数据错误:', error);
    res.status(500).json({
      success: false,
      message: '数据验证失败'
    });
  }
};

module.exports = {
  validateCreateAddress,
  validateUpdateAddress
};

