/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-03 16:50:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-03 16:50:00
 * @FilePath: \showcase-backend-node\src\controllers\exploreSelectionController.js
 * @Description: 精选商品控制器
 */

const ExploreSelection = require('../models/ExploreSelection');

class ExploreSelectionController {
  // 获取精选商品列表（公开接口）
  static async getSelections(req, res) {
    try {
      const selections = await ExploreSelection.getAll();
      
      res.json({
        success: true,
        message: '获取精选商品列表成功',
        data: {
          selections,
          total: selections.length
        }
      });
    } catch (error) {
      console.error('获取精选商品列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取精选商品列表失败',
        error: error.message
      });
    }
  }

  // 获取单个精选商品详情（公开接口）
  static async getSelection(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: '精选商品ID无效'
        });
      }

      const selection = await ExploreSelection.getById(parseInt(id));
      
      if (!selection) {
        return res.status(404).json({
          success: false,
          message: '精选商品不存在'
        });
      }

      res.json({
        success: true,
        message: '获取精选商品详情成功',
        data: selection
      });
    } catch (error) {
      console.error('获取精选商品详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取精选商品详情失败',
        error: error.message
      });
    }
  }

  // 创建精选商品（支持单个和批量，需要管理员权限）
  static async createSelection(req, res) {
    try {
      const { product_ids, product_id, sort_order_start = 0, sort_order } = req.body;

      // 支持两种格式：批量创建（product_ids数组）和单个创建（product_id）
      let productIdsArray = [];
      
      if (product_ids && Array.isArray(product_ids)) {
        // 批量创建模式
        productIdsArray = product_ids;
      } else if (product_id) {
        // 单个创建模式（兼容旧接口）
        productIdsArray = [product_id];
      } else {
        return res.status(400).json({
          success: false,
          message: '商品ID不能为空，请提供product_id或product_ids'
        });
      }

      if (productIdsArray.length === 0) {
        return res.status(400).json({
          success: false,
          message: '商品ID列表不能为空'
        });
      }

      // 验证商品ID格式
      for (const id of productIdsArray) {
        if (!id || isNaN(parseInt(id))) {
          return res.status(400).json({
            success: false,
            message: '商品ID格式无效，必须为数字'
          });
        }
      }

      // 去重
      const uniqueProductIds = [...new Set(productIdsArray.map(id => parseInt(id)))];

      // 确定排序起始值
      let startOrder = sort_order_start;
      if (productIdsArray.length === 1 && sort_order !== undefined) {
        // 单个创建时，如果提供了sort_order，使用它
        startOrder = parseInt(sort_order);
      }

      const results = await ExploreSelection.batchCreate({
        product_ids: uniqueProductIds,
        sort_order_start: startOrder
      });

      // 如果是单个创建，返回单个结果格式（兼容旧接口）
      if (productIdsArray.length === 1 && !product_ids) {
        if (results.created.length > 0) {
          res.status(201).json({
            success: true,
            message: '添加精选商品成功',
            data: results.created[0]
          });
        } else if (results.skipped.length > 0) {
          res.status(409).json({
            success: false,
            message: '该商品已被精选'
          });
        } else {
          res.status(500).json({
            success: false,
            message: '添加精选商品失败'
          });
        }
      } else {
        // 批量创建返回批量结果格式
        res.status(201).json({
          success: true,
          message: '批量创建精选商品成功',
          data: {
            created: results.created,
            skipped: results.skipped,
            total_requested: productIdsArray.length,
            total_created: results.created.length,
            total_skipped: results.skipped.length
          }
        });
      }
    } catch (error) {
      console.error('创建精选商品失败:', error);
      res.status(500).json({
        success: false,
        message: '创建精选商品失败',
        error: error.message
      });
    }
  }

  // 更新精选商品排序（需要管理员权限）
  static async updateSelection(req, res) {
    try {
      const { id } = req.params;
      const { sort_order } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: '精选商品ID无效'
        });
      }

      if (sort_order === undefined || sort_order === null) {
        return res.status(400).json({
          success: false,
          message: '排序值不能为空'
        });
      }

      if (isNaN(parseInt(sort_order))) {
        return res.status(400).json({
          success: false,
          message: '排序值格式无效'
        });
      }

      await ExploreSelection.updateSortOrder(parseInt(id), parseInt(sort_order));

      // 获取更新后的精选商品信息
      const updatedSelection = await ExploreSelection.getById(parseInt(id));

      res.json({
        success: true,
        message: '更新精选商品排序成功',
        data: updatedSelection
      });
    } catch (error) {
      console.error('更新精选商品排序失败:', error);
      
      if (error.message === '精选商品不存在') {
        return res.status(404).json({
          success: false,
          message: '精选商品不存在'
        });
      }

      res.status(500).json({
        success: false,
        message: '更新精选商品排序失败',
        error: error.message
      });
    }
  }

  // 删除精选商品（需要管理员权限）
  static async deleteSelection(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: '精选商品ID无效'
        });
      }

      await ExploreSelection.delete(parseInt(id));

      res.json({
        success: true,
        message: '删除精选商品成功'
      });
    } catch (error) {
      console.error('删除精选商品失败:', error);
      
      if (error.message === '精选商品不存在') {
        return res.status(404).json({
          success: false,
          message: '精选商品不存在'
        });
      }

      res.status(500).json({
        success: false,
        message: '删除精选商品失败',
        error: error.message
      });
    }
  }


  // 批量更新精选商品排序（需要管理员权限）
  static async batchUpdateSortOrder(req, res) {
    try {
      const { updates } = req.body;

      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: '更新数据不能为空'
        });
      }

      // 验证更新数据格式
      for (const update of updates) {
        if (!update.selection_id || !update.sort_order) {
          return res.status(400).json({
            success: false,
            message: '更新数据格式无效，需要selection_id和sort_order'
          });
        }
        
        if (isNaN(parseInt(update.selection_id)) || isNaN(parseInt(update.sort_order))) {
          return res.status(400).json({
            success: false,
            message: '更新数据格式无效，ID和排序值必须为数字'
          });
        }
      }

      await ExploreSelection.batchUpdateSortOrder(updates.map(update => ({
        selection_id: parseInt(update.selection_id),
        sort_order: parseInt(update.sort_order)
      })));

      res.json({
        success: true,
        message: '批量更新精选商品排序成功'
      });
    } catch (error) {
      console.error('批量更新精选商品排序失败:', error);
      res.status(500).json({
        success: false,
        message: '批量更新精选商品排序失败',
        error: error.message
      });
    }
  }

  // 获取精选商品统计信息（需要管理员权限）
  static async getStats(req, res) {
    try {
      const count = await ExploreSelection.getCount();
      
      res.json({
        success: true,
        message: '获取精选商品统计成功',
        data: {
          total: count
        }
      });
    } catch (error) {
      console.error('获取精选商品统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取精选商品统计失败',
        error: error.message
      });
    }
  }
}

module.exports = ExploreSelectionController;
