/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\validators\bannerValidator.js
 * @Description: 轮播图验证器
 */

// 验证创建轮播图的数据
const validateCreateBanner = (req, res, next) => {
  try {
    const { title, description, sort_order } = req.body;
    const image_url = req.file ? 'uploaded_file' : req.body.image_url;

    // 验证必填字段
    if (!title) {
      return res.status(400).json({
        success: false,
        message: '轮播图标题不能为空'
      });
    }

    if (!image_url) {
      return res.status(400).json({
        success: false,
        message: '轮播图图片路径不能为空'
      });
    }

    // 验证标题类型和长度
    if (typeof title !== 'string') {
      return res.status(400).json({
        success: false,
        message: '轮播图标题必须是字符串类型'
      });
    }

    if (title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '轮播图标题不能为空'
      });
    }

    if (title.length > 200) {
      return res.status(400).json({
        success: false,
        message: '轮播图标题不能超过200个字符'
      });
    }

    // 验证图片路径类型和长度
    if (typeof image_url !== 'string') {
      return res.status(400).json({
        success: false,
        message: '轮播图图片路径必须是字符串类型'
      });
    }

    if (image_url.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: '轮播图图片路径不能为空'
      });
    }

    if (image_url.length > 500) {
      return res.status(400).json({
        success: false,
        message: '轮播图图片路径不能超过500个字符'
      });
    }

    // 验证描述（可选）
    if (description !== undefined && description !== null) {
      if (typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          message: '轮播图描述必须是字符串类型'
        });
      }

      if (description.length > 1000) {
        return res.status(400).json({
          success: false,
          message: '轮播图描述不能超过1000个字符'
        });
      }
    }

    // 验证排序权重（可选）
    if (sort_order !== undefined) {
      if (typeof sort_order !== 'number' && typeof sort_order !== 'string') {
        return res.status(400).json({
          success: false,
          message: '排序权重必须是数字类型'
        });
      }

      const sortValue = parseInt(sort_order);
      if (isNaN(sortValue) || sortValue < 0) {
        return res.status(400).json({
          success: false,
          message: '排序权重必须是非负整数'
        });
      }
    }

    // 将文件信息添加到请求体中，供控制器使用
    if (req.file) {
      req.body.image_url = 'uploaded_file';
    }

    next();
  } catch (error) {
    console.error('验证创建轮播图数据错误:', error);
    res.status(500).json({
      success: false,
      message: '数据验证失败'
    });
  }
};

// 验证更新轮播图的数据
const validateUpdateBanner = (req, res, next) => {
  try {
    const { title, description, image_url, sort_order } = req.body;

    // 至少需要提供一个更新字段
    if (title === undefined && description === undefined && 
        image_url === undefined && sort_order === undefined) {
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
          message: '轮播图标题必须是字符串类型'
        });
      }

      if (title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '轮播图标题不能为空'
        });
      }

      if (title.length > 200) {
        return res.status(400).json({
          success: false,
          message: '轮播图标题不能超过200个字符'
        });
      }
    }

    // 验证描述（如果提供）
    if (description !== undefined) {
      if (typeof description !== 'string') {
        return res.status(400).json({
          success: false,
          message: '轮播图描述必须是字符串类型'
        });
      }

      if (description.length > 1000) {
        return res.status(400).json({
          success: false,
          message: '轮播图描述不能超过1000个字符'
        });
      }
    }

    // 验证图片路径（如果提供）
    if (image_url !== undefined) {
      if (typeof image_url !== 'string') {
        return res.status(400).json({
          success: false,
          message: '轮播图图片路径必须是字符串类型'
        });
      }

      if (image_url.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '轮播图图片路径不能为空'
        });
      }

      if (image_url.length > 500) {
        return res.status(400).json({
          success: false,
          message: '轮播图图片路径不能超过500个字符'
        });
      }
    }

    // 验证排序权重（如果提供）
    if (sort_order !== undefined) {
      if (typeof sort_order !== 'number' && typeof sort_order !== 'string') {
        return res.status(400).json({
          success: false,
          message: '排序权重必须是数字类型'
        });
      }

      const sortValue = parseInt(sort_order);
      if (isNaN(sortValue) || sortValue < 0) {
        return res.status(400).json({
          success: false,
          message: '排序权重必须是非负整数'
        });
      }
    }

    next();
  } catch (error) {
    console.error('验证更新轮播图数据错误:', error);
    res.status(500).json({
      success: false,
      message: '数据验证失败'
    });
  }
};

// 验证更新排序的数据
const validateUpdateSort = (req, res, next) => {
  try {
    const { sort_order } = req.body;

    // 验证必填字段
    if (sort_order === undefined) {
      return res.status(400).json({
        success: false,
        message: '排序权重不能为空'
      });
    }

    // 验证排序权重类型
    if (typeof sort_order !== 'number' && typeof sort_order !== 'string') {
      return res.status(400).json({
        success: false,
        message: '排序权重必须是数字类型'
      });
    }

    // 验证排序权重范围
    const sortValue = parseInt(sort_order);
    if (isNaN(sortValue) || sortValue < 0) {
      return res.status(400).json({
        success: false,
        message: '排序权重必须是非负整数'
      });
    }

    next();
  } catch (error) {
    console.error('验证更新排序数据错误:', error);
    res.status(500).json({
      success: false,
      message: '数据验证失败'
    });
  }
};

// 验证查询参数
const validateQueryParams = (req, res, next) => {
  try {
    const { page, limit } = req.query;

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
    const { bannerIds } = req.body;

    // 验证必填字段
    if (!bannerIds) {
      return res.status(400).json({
        success: false,
        message: '轮播图ID数组不能为空'
      });
    }

    // 验证数组类型
    if (!Array.isArray(bannerIds)) {
      return res.status(400).json({
        success: false,
        message: '轮播图ID必须是数组格式'
      });
    }

    // 验证数组长度
    if (bannerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '轮播图ID数组不能为空'
      });
    }

    if (bannerIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: '单次最多删除100个轮播图'
      });
    }

    // 验证每个ID的格式
    const invalidIds = bannerIds.filter(id => {
      return isNaN(id) || parseInt(id) <= 0;
    });

    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `无效的轮播图ID: ${invalidIds.join(', ')}`
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
  validateCreateBanner,
  validateUpdateBanner,
  validateUpdateSort,
  validateQueryParams,
  validateBatchDelete
};
