/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-11-07 10:50:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-11-07 10:50:00
 * @FilePath: \showcase-backend-node\src\controllers\favoriteController.js
 * @Description: 商品收藏控制器
 */

const UserFavorite = require('../models/UserFavorite');

// 添加收藏
const addFavorite = async (req, res) => {
  try {
    const { product_id } = req.body;
    
    // 从认证中间件获取用户ID
    const user_id = req.user.user_id;

    if (!product_id || isNaN(product_id)) {
      return res.status(400).json({
        success: false,
        message: '商品ID不能为空且必须是有效数字'
      });
    }

    const favoriteData = {
      user_id,
      product_id: parseInt(product_id)
    };

    const favorite = await UserFavorite.create(favoriteData);

    res.status(201).json({
      success: true,
      message: '收藏成功',
      data: favorite.toSafeObject()
    });
  } catch (error) {
    console.error('添加收藏错误:', error);
    
    if (error.message.includes('不能为空') || 
        error.message.includes('必须是有效数字') ||
        error.message.includes('用户不存在') ||
        error.message.includes('商品不存在') ||
        error.message.includes('已经收藏过了')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '添加收藏失败'
    });
  }
};

// 取消收藏
const removeFavorite = async (req, res) => {
  try {
    const { product_id } = req.body;
    
    // 从认证中间件获取用户ID
    const user_id = req.user.user_id;

    if (!product_id || isNaN(product_id)) {
      return res.status(400).json({
        success: false,
        message: '商品ID不能为空且必须是有效数字'
      });
    }

    const result = await UserFavorite.delete(user_id, parseInt(product_id));

    res.json({
      success: true,
      message: result.message,
      data: {
        favorite_id: result.favorite_id
      }
    });
  } catch (error) {
    console.error('取消收藏错误:', error);
    
    if (error.message.includes('不能为空') || 
        error.message.includes('必须是有效数字') ||
        error.message.includes('收藏不存在')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '取消收藏失败'
    });
  }
};

// 获取当前用户的收藏列表
const getMyFavorites = async (req, res) => {
  try {
    // 从认证中间件获取用户ID
    const user_id = req.user.user_id;

    // 获取查询参数
    const {
      page = 1,
      limit = 20,
      order_by = 'created_at',
      order = 'DESC'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      order_by,
      order
    };

    const result = await UserFavorite.findByUserId(user_id, options);

    res.json({
      success: true,
      message: '获取收藏列表成功',
      data: result.favorites,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('获取收藏列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取收藏列表失败'
    });
  }
};

// 检查商品是否已收藏
const checkFavorite = async (req, res) => {
  try {
    const { product_id } = req.params;
    
    // 从认证中间件获取用户ID
    const user_id = req.user.user_id;

    if (!product_id || isNaN(product_id)) {
      return res.status(400).json({
        success: false,
        message: '商品ID不能为空且必须是有效数字'
      });
    }

    const isFavorite = await UserFavorite.isFavorite(user_id, parseInt(product_id));

    res.json({
      success: true,
      message: '检查收藏状态成功',
      data: {
        product_id: parseInt(product_id),
        is_favorite: isFavorite
      }
    });
  } catch (error) {
    console.error('检查收藏状态错误:', error);
    res.status(500).json({
      success: false,
      message: '检查收藏状态失败'
    });
  }
};

// 批量取消收藏
const batchRemoveFavorites = async (req, res) => {
  try {
    const { product_ids } = req.body;
    
    // 从认证中间件获取用户ID
    const user_id = req.user.user_id;

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '商品ID列表不能为空'
      });
    }

    const result = await UserFavorite.batchDelete(user_id, product_ids);

    res.json({
      success: true,
      message: result.message,
      data: {
        deleted_count: result.deleted_count
      }
    });
  } catch (error) {
    console.error('批量取消收藏错误:', error);
    
    if (error.message.includes('不能为空') || 
        error.message.includes('必须是有效数字') ||
        error.message.includes('没有有效的商品ID')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: '批量取消收藏失败'
    });
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  getMyFavorites,
  checkFavorite,
  batchRemoveFavorites
};

