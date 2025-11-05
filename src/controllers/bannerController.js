/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\controllers\bannerController.js
 * @Description: 轮播图控制器
 */

const Banner = require('../models/Banner');

class BannerController {
  // 获取轮播图列表（公开接口）
  static async getBanners(req, res) {
    try {
      const {
        page = 1,
        limit = 10
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await Banner.findAll(options);

      res.json({
        success: true,
        message: '获取轮播图列表成功',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('获取轮播图列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取轮播图列表失败'
      });
    }
  }

  // 创建轮播图
  static async createBanner(req, res) {
    try {
      const {
        title,
        description,
        sort_order
      } = req.body;

      // 处理文件上传
      let image_url = req.body.image_url; // 如果没有上传文件，使用提供的URL
      
      if (req.file) {
        // 生成文件路径
        const fileExtension = require('path').extname(req.file.originalname);
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
        const filePath = `/uploads/banners/${fileName}`;
        
        // 保存文件到磁盘
        const fs = require('fs');
        const path = require('path');
        const uploadDir = path.join(__dirname, '../../uploads/banners');
        
        // 确保目录存在
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const fullPath = path.join(uploadDir, fileName);
        fs.writeFileSync(fullPath, req.file.buffer);
        
        // 使用保存后的文件路径
        image_url = filePath;
      }

      const bannerData = {
        title: title.trim(),
        description: description ? description.trim() : null,
        image_url: image_url.trim(),
        sort_order: sort_order !== undefined ? parseInt(sort_order) : 0
      };

      const banner = await Banner.create(bannerData);

      res.status(201).json({
        success: true,
        message: '轮播图创建成功',
        data: banner
      });
    } catch (error) {
      console.error('创建轮播图错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建轮播图失败'
      });
    }
  }

  // 获取单个轮播图详情
  static async getBannerById(req, res) {
    try {
      const { id } = req.params;
      const bannerId = parseInt(id);

      if (isNaN(bannerId) || bannerId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的轮播图ID'
        });
      }

      const banner = await Banner.findById(bannerId);

      if (!banner) {
        return res.status(404).json({
          success: false,
          message: '轮播图不存在'
        });
      }

      res.json({
        success: true,
        message: '获取轮播图详情成功',
        data: banner
      });
    } catch (error) {
      console.error('获取轮播图详情错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取轮播图详情失败'
      });
    }
  }

  // 更新轮播图
  static async updateBanner(req, res) {
    try {
      const { id } = req.params;
      const bannerId = parseInt(id);

      if (isNaN(bannerId) || bannerId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的轮播图ID'
        });
      }

      const {
        title,
        description,
        image_url,
        sort_order
      } = req.body;

      const updateData = {};

      if (title !== undefined) {
        updateData.title = title.trim();
      }
      if (description !== undefined) {
        updateData.description = description ? description.trim() : null;
      }
      if (image_url !== undefined) {
        updateData.image_url = image_url.trim();
      }
      if (sort_order !== undefined) {
        updateData.sort_order = parseInt(sort_order);
      }

      const updated = await Banner.update(bannerId, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: '轮播图不存在或更新失败'
        });
      }

      // 获取更新后的数据
      const updatedBanner = await Banner.findById(bannerId);

      res.json({
        success: true,
        message: '轮播图更新成功',
        data: updatedBanner
      });
    } catch (error) {
      console.error('更新轮播图错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '更新轮播图失败'
      });
    }
  }

  // 更新轮播图排序
  static async updateBannerSort(req, res) {
    try {
      const { id } = req.params;
      const bannerId = parseInt(id);

      if (isNaN(bannerId) || bannerId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的轮播图ID'
        });
      }

      const { sort_order } = req.body;
      const sortValue = parseInt(sort_order);

      const updated = await Banner.updateSort(bannerId, sortValue);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: '轮播图不存在或更新失败'
        });
      }

      // 获取更新后的数据
      const updatedBanner = await Banner.findById(bannerId);

      res.json({
        success: true,
        message: '轮播图排序更新成功',
        data: updatedBanner
      });
    } catch (error) {
      console.error('更新轮播图排序错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '更新轮播图排序失败'
      });
    }
  }

  // 删除轮播图
  static async deleteBanner(req, res) {
    try {
      const { id } = req.params;
      const bannerId = parseInt(id);

      if (isNaN(bannerId) || bannerId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的轮播图ID'
        });
      }

      const deleted = await Banner.delete(bannerId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: '轮播图不存在或删除失败'
        });
      }

      res.json({
        success: true,
        message: '轮播图删除成功'
      });
    } catch (error) {
      console.error('删除轮播图错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '删除轮播图失败'
      });
    }
  }

  // 批量删除轮播图
  static async batchDeleteBanners(req, res) {
    try {
      const { bannerIds } = req.body;

      const result = await Banner.batchDelete(bannerIds);

      res.json({
        success: true,
        message: `成功删除${result.deletedCount}个轮播图`,
        data: {
          deletedCount: result.deletedCount,
          requestedIds: result.requestedIds
        }
      });
    } catch (error) {
      console.error('批量删除轮播图错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '批量删除轮播图失败'
      });
    }
  }
}

module.exports = BannerController;


