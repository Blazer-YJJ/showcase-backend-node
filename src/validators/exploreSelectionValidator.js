/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-03 16:50:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-03 16:50:00
 * @FilePath: \showcase-backend-node\src\validators\exploreSelectionValidator.js
 * @Description: 精选商品数据验证器
 */

class ExploreSelectionValidator {
  // 验证添加精选商品的请求数据
  static validateCreateSelection(data) {
    const errors = [];

    // 验证商品ID
    if (!data.product_id) {
      errors.push('商品ID不能为空');
    } else if (isNaN(parseInt(data.product_id)) || parseInt(data.product_id) <= 0) {
      errors.push('商品ID必须是正整数');
    }

    // 验证排序值（可选）
    if (data.sort_order !== undefined && data.sort_order !== null) {
      if (isNaN(parseInt(data.sort_order))) {
        errors.push('排序值必须是数字');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 验证更新精选商品排序的请求数据
  static validateUpdateSortOrder(data) {
    const errors = [];

    // 验证排序值
    if (data.sort_order === undefined || data.sort_order === null) {
      errors.push('排序值不能为空');
    } else if (isNaN(parseInt(data.sort_order))) {
      errors.push('排序值必须是数字');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 验证批量更新排序的请求数据
  static validateBatchUpdateSortOrder(data) {
    const errors = [];

    // 验证updates数组
    if (!data.updates || !Array.isArray(data.updates)) {
      errors.push('更新数据必须是数组');
      return { isValid: false, errors };
    }

    if (data.updates.length === 0) {
      errors.push('更新数据不能为空');
      return { isValid: false, errors };
    }

    // 验证每个更新项
    data.updates.forEach((update, index) => {
      if (!update.selection_id) {
        errors.push(`第${index + 1}项：精选商品ID不能为空`);
      } else if (isNaN(parseInt(update.selection_id)) || parseInt(update.selection_id) <= 0) {
        errors.push(`第${index + 1}项：精选商品ID必须是正整数`);
      }

      if (update.sort_order === undefined || update.sort_order === null) {
        errors.push(`第${index + 1}项：排序值不能为空`);
      } else if (isNaN(parseInt(update.sort_order))) {
        errors.push(`第${index + 1}项：排序值必须是数字`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 验证ID参数
  static validateId(id) {
    const errors = [];

    if (!id) {
      errors.push('ID不能为空');
    } else if (isNaN(parseInt(id)) || parseInt(id) <= 0) {
      errors.push('ID必须是正整数');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 中间件：验证创建精选商品
  static validateCreate(req, res, next) {
    const validation = ExploreSelectionValidator.validateCreateSelection(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: validation.errors
      });
    }
    
    next();
  }

  // 中间件：验证更新排序
  static validateUpdateSort(req, res, next) {
    const validation = ExploreSelectionValidator.validateUpdateSortOrder(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: validation.errors
      });
    }
    
    next();
  }

  // 中间件：验证批量更新排序
  static validateBatchUpdateSort(req, res, next) {
    const validation = ExploreSelectionValidator.validateBatchUpdateSortOrder(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: validation.errors
      });
    }
    
    next();
  }

  // 中间件：验证ID参数
  static validateIdParam(req, res, next) {
    const validation = ExploreSelectionValidator.validateId(req.params.id);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: validation.errors
      });
    }
    
    next();
  }
}

module.exports = ExploreSelectionValidator;

