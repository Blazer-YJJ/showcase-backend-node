/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\validators\aboutUsValidator.js
 * @Description: 关于我们验证器
 */

// 验证创建关于我们的数据
const validateCreateAboutUs = (req, res, next) => {
  try {
    const {
      company_name,
      main_business,
      address,
      contact_phone,
      logo_image,
      company_description,
      website_url,
      email,
      is_active
    } = req.body;

    // 验证必填字段
    if (!company_name) {
      return res.status(400).json({
        success: false,
        message: '公司名称不能为空'
      });
    }

    if (!main_business) {
      return res.status(400).json({
        success: false,
        message: '主营业务描述不能为空'
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        message: '公司地址不能为空'
      });
    }

    if (!contact_phone) {
      return res.status(400).json({
        success: false,
        message: '联系电话不能为空'
      });
    }

    // 验证公司名称类型和长度
    if (typeof company_name !== 'string') {
      return res.status(400).json({
        success: false,
        message: '公司名称必须是字符串类型'
      });
    }

    if (company_name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '公司名称不能为空'
      });
    }

    if (company_name.length > 200) {
      return res.status(400).json({
        success: false,
        message: '公司名称不能超过200个字符'
      });
    }

    // 验证主营业务类型和长度
    if (typeof main_business !== 'string') {
      return res.status(400).json({
        success: false,
        message: '主营业务描述必须是字符串类型'
      });
    }

    if (main_business.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '主营业务描述不能为空'
      });
    }

    if (main_business.length > 10000) {
      return res.status(400).json({
        success: false,
        message: '主营业务描述不能超过10000个字符'
      });
    }

    // 验证地址类型和长度
    if (typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        message: '公司地址必须是字符串类型'
      });
    }

    if (address.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '公司地址不能为空'
      });
    }

    if (address.length > 500) {
      return res.status(400).json({
        success: false,
        message: '公司地址不能超过500个字符'
      });
    }

    // 验证联系电话类型和长度
    if (typeof contact_phone !== 'string') {
      return res.status(400).json({
        success: false,
        message: '联系电话必须是字符串类型'
      });
    }

    if (contact_phone.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '联系电话不能为空'
      });
    }

    if (contact_phone.length > 50) {
      return res.status(400).json({
        success: false,
        message: '联系电话不能超过50个字符'
      });
    }

    // 验证可选字段
    if (logo_image !== undefined && logo_image !== null) {
      if (typeof logo_image !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'LOGO图片路径必须是字符串类型'
        });
      }

      if (logo_image.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'LOGO图片路径不能为空字符串'
        });
      }

      if (logo_image.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'LOGO图片路径不能超过500个字符'
        });
      }
    }

    if (company_description !== undefined && company_description !== null) {
      if (typeof company_description !== 'string') {
        return res.status(400).json({
          success: false,
          message: '公司简介必须是字符串类型'
        });
      }

      if (company_description.length > 10000) {
        return res.status(400).json({
          success: false,
          message: '公司简介不能超过10000个字符'
        });
      }
    }

    if (website_url !== undefined && website_url !== null) {
      if (typeof website_url !== 'string') {
        return res.status(400).json({
          success: false,
          message: '官网地址必须是字符串类型'
        });
      }

      if (website_url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '官网地址不能为空字符串'
        });
      }

      if (website_url.length > 500) {
        return res.status(400).json({
          success: false,
          message: '官网地址不能超过500个字符'
        });
      }
    }

    if (email !== undefined && email !== null) {
      if (typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          message: '联系邮箱必须是字符串类型'
        });
      }

      if (email.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '联系邮箱不能为空字符串'
        });
      }

      if (email.length > 100) {
        return res.status(400).json({
          success: false,
          message: '联系邮箱不能超过100个字符'
        });
      }

      // 简单的邮箱格式验证
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: '联系邮箱格式不正确'
        });
      }
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
    console.error('验证创建关于我们数据错误:', error);
    res.status(500).json({
      success: false,
      message: '数据验证失败'
    });
  }
};

// 验证更新关于我们的数据
const validateUpdateAboutUs = (req, res, next) => {
  try {
    const {
      company_name,
      main_business,
      address,
      contact_phone,
      logo_image,
      company_description,
      website_url,
      email,
      is_active
    } = req.body;

    // 至少需要提供一个更新字段
    if (company_name === undefined && main_business === undefined && 
        address === undefined && contact_phone === undefined && 
        logo_image === undefined && company_description === undefined && 
        website_url === undefined && email === undefined && 
        is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: '至少需要提供一个更新字段'
      });
    }

    // 验证公司名称（如果提供）
    if (company_name !== undefined) {
      if (typeof company_name !== 'string') {
        return res.status(400).json({
          success: false,
          message: '公司名称必须是字符串类型'
        });
      }

      if (company_name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '公司名称不能为空'
        });
      }

      if (company_name.length > 200) {
        return res.status(400).json({
          success: false,
          message: '公司名称不能超过200个字符'
        });
      }
    }

    // 验证主营业务（如果提供）
    if (main_business !== undefined) {
      if (typeof main_business !== 'string') {
        return res.status(400).json({
          success: false,
          message: '主营业务描述必须是字符串类型'
        });
      }

      if (main_business.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '主营业务描述不能为空'
        });
      }

      if (main_business.length > 10000) {
        return res.status(400).json({
          success: false,
          message: '主营业务描述不能超过10000个字符'
        });
      }
    }

    // 验证地址（如果提供）
    if (address !== undefined) {
      if (typeof address !== 'string') {
        return res.status(400).json({
          success: false,
          message: '公司地址必须是字符串类型'
        });
      }

      if (address.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '公司地址不能为空'
        });
      }

      if (address.length > 500) {
        return res.status(400).json({
          success: false,
          message: '公司地址不能超过500个字符'
        });
      }
    }

    // 验证联系电话（如果提供）
    if (contact_phone !== undefined) {
      if (typeof contact_phone !== 'string') {
        return res.status(400).json({
          success: false,
          message: '联系电话必须是字符串类型'
        });
      }

      if (contact_phone.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '联系电话不能为空'
        });
      }

      if (contact_phone.length > 50) {
        return res.status(400).json({
          success: false,
          message: '联系电话不能超过50个字符'
        });
      }
    }

    // 验证其他可选字段（与创建时相同的验证逻辑）
    if (logo_image !== undefined && logo_image !== null) {
      if (typeof logo_image !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'LOGO图片路径必须是字符串类型'
        });
      }

      if (logo_image.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'LOGO图片路径不能为空字符串'
        });
      }

      if (logo_image.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'LOGO图片路径不能超过500个字符'
        });
      }
    }

    if (company_description !== undefined && company_description !== null) {
      if (typeof company_description !== 'string') {
        return res.status(400).json({
          success: false,
          message: '公司简介必须是字符串类型'
        });
      }

      if (company_description.length > 10000) {
        return res.status(400).json({
          success: false,
          message: '公司简介不能超过10000个字符'
        });
      }
    }

    if (website_url !== undefined && website_url !== null) {
      if (typeof website_url !== 'string') {
        return res.status(400).json({
          success: false,
          message: '官网地址必须是字符串类型'
        });
      }

      if (website_url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '官网地址不能为空字符串'
        });
      }

      if (website_url.length > 500) {
        return res.status(400).json({
          success: false,
          message: '官网地址不能超过500个字符'
        });
      }
    }

    if (email !== undefined && email !== null) {
      if (typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          message: '联系邮箱必须是字符串类型'
        });
      }

      if (email.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '联系邮箱不能为空字符串'
        });
      }

      if (email.length > 100) {
        return res.status(400).json({
          success: false,
          message: '联系邮箱不能超过100个字符'
        });
      }

      // 简单的邮箱格式验证
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: '联系邮箱格式不正确'
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
    console.error('验证更新关于我们数据错误:', error);
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
  validateCreateAboutUs,
  validateUpdateAboutUs,
  validateQueryParams
};


