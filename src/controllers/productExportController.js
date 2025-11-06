/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-11-06
 * @Description: 商品PDF导出控制器
 */

const PDFExportService = require('../services/pdfExportService');

class ProductExportController {
  /**
   * 导出全部商品PDF
   */
  static async exportAllProducts(req, res) {
    try {
      const result = await PDFExportService.exportAllProducts();
      
      res.status(200).json({
        success: true,
        data: {
          pdfName: result.pdfName,
          pdfPath: result.pdfPath,
          generatedTime: result.generatedTime
        }
      });
    } catch (error) {
      console.error('导出全部商品PDF失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '导出PDF失败'
      });
    }
  }

  /**
   * 导出指定分类的商品PDF
   */
  static async exportProductsByCategory(req, res) {
    try {
      const { category_id } = req.params;

      if (!category_id || isNaN(category_id)) {
        return res.status(400).json({
          success: false,
          message: '分类ID必须是有效数字'
        });
      }

      const result = await PDFExportService.exportProductsByCategory(parseInt(category_id));
      
      res.status(200).json({
        success: true,
        data: {
          pdfName: result.pdfName,
          pdfPath: result.pdfPath,
          generatedTime: result.generatedTime
        }
      });
    } catch (error) {
      console.error('导出分类商品PDF失败:', error);
      
      if (error.message === '分类不存在') {
        return res.status(404).json({
          success: false,
          message: '分类不存在'
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || '导出PDF失败'
      });
    }
  }

  /**
   * 导出搜索结果的商品PDF
   */
  static async exportProductsBySearch(req, res) {
    try {
      const { q: keyword, sort = 'created_at', order = 'desc' } = req.query;

      if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '搜索关键词不能为空'
        });
      }

      // 验证排序参数
      const allowedSortFields = ['created_at', 'price', 'name'];
      const allowedOrders = ['asc', 'desc'];
      
      if (!allowedSortFields.includes(sort)) {
        return res.status(400).json({
          success: false,
          message: `排序字段无效，支持的字段: ${allowedSortFields.join(', ')}`
        });
      }

      if (!allowedOrders.includes(order.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `排序方向无效，支持的方向: ${allowedOrders.join(', ')}`
        });
      }

      const result = await PDFExportService.exportProductsBySearch(
        keyword.trim(),
        sort,
        order.toLowerCase()
      );
      
      res.status(200).json({
        success: true,
        data: {
          pdfName: result.pdfName,
          pdfPath: result.pdfPath,
          generatedTime: result.generatedTime
        }
      });
    } catch (error) {
      console.error('导出搜索商品PDF失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '导出PDF失败'
      });
    }
  }
}

module.exports = ProductExportController;

