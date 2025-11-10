/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\controllers\feedbackController.js
 * @Description: 意见反馈控制器
 */

const Feedback = require('../models/Feedback');
const path = require('path');

class FeedbackController {
  // 将绝对路径转换为相对路径
  static convertToRelativePath(absolutePath) {
    if (!absolutePath) return null;
    
    // 获取项目根目录
    const projectRoot = path.join(__dirname, '../../');
    
    // 将绝对路径转换为相对于项目根目录的路径
    const relativePath = path.relative(projectRoot, absolutePath);
    
    // 将反斜杠转换为正斜杠（用于URL）
    return relativePath.replace(/\\/g, '/');
  }

  // 创建反馈
  static async createFeedback(req, res) {
    try {
      const {
        title,
        content
      } = req.body;

      // 从认证信息中获取用户ID
      const user_id = req.user?.user_id;
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: '用户未认证'
        });
      }

      // 处理上传的图片文件 - 参考商品接口的实现方式
      let feedback_image = null;
      if (req.file) {
        // 生成相对路径，类似商品接口的做法
        const fileExtension = require('path').extname(req.file.originalname);
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
        const filePath = `/uploads/feedback/${fileName}`;
        
        // 保存文件到磁盘 - 参考商品接口的实现
        const fs = require('fs');
        const path = require('path');
        const uploadDir = path.join(__dirname, '../../uploads/feedback');
        
        // 确保目录存在
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const fullPath = path.join(uploadDir, fileName);
        fs.writeFileSync(fullPath, req.file.buffer);
        
        // 存储相对路径到数据库
        feedback_image = filePath;
      } else if (req.body.feedback_image) {
        // 如果传递的是图片路径字符串
        feedback_image = req.body.feedback_image;
      }

      const feedbackData = {
        user_id: parseInt(user_id),
        title: title.trim(),
        content: content.trim(),
        feedback_image: feedback_image
      };

      const feedback = await Feedback.create(feedbackData);

      res.status(201).json({
        success: true,
        message: '反馈创建成功',
        data: feedback
      });
    } catch (error) {
      console.error('创建反馈错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建反馈失败'
      });
    }
  }

  // 获取反馈列表
  static async getFeedbacks(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        user_id
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        user_id: user_id ? parseInt(user_id) : null
      };

      const result = await Feedback.findAll(options);

      // 将返回数据中的图片路径转换为相对路径
      if (result.data && Array.isArray(result.data)) {
        result.data.forEach(feedback => {
          if (feedback.feedback_image) {
            feedback.feedback_image = FeedbackController.convertToRelativePath(feedback.feedback_image);
          }
        });
      }

      res.json({
        success: true,
        message: '获取反馈列表成功',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('获取反馈列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取反馈列表失败'
      });
    }
  }

  // 获取单个反馈详情
  static async getFeedbackById(req, res) {
    try {
      const { id } = req.params;
      const feedbackId = parseInt(id);

      if (isNaN(feedbackId) || feedbackId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的反馈ID'
        });
      }

      const feedback = await Feedback.findById(feedbackId);

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: '反馈不存在'
        });
      }

      // 将返回数据中的图片路径转换为相对路径
      if (feedback.feedback_image) {
        feedback.feedback_image = FeedbackController.convertToRelativePath(feedback.feedback_image);
      }

      res.json({
        success: true,
        message: '获取反馈详情成功',
        data: feedback
      });
    } catch (error) {
      console.error('获取反馈详情错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取反馈详情失败'
      });
    }
  }

  // 删除反馈
  static async deleteFeedback(req, res) {
    try {
      const { id } = req.params;
      const feedbackId = parseInt(id);

      if (isNaN(feedbackId) || feedbackId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的反馈ID'
        });
      }

      const deleted = await Feedback.delete(feedbackId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: '反馈不存在或删除失败'
        });
      }

      res.json({
        success: true,
        message: '反馈删除成功'
      });
    } catch (error) {
      console.error('删除反馈错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '删除反馈失败'
      });
    }
  }

  // 批量删除反馈
  static async batchDeleteFeedbacks(req, res) {
    try {
      const { feedbackIds } = req.body;

      const result = await Feedback.batchDelete(feedbackIds);

      res.json({
        success: true,
        message: `成功删除${result.deletedCount}个反馈`,
        data: {
          deletedCount: result.deletedCount,
          requestedIds: result.requestedIds
        }
      });
    } catch (error) {
      console.error('批量删除反馈错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '批量删除反馈失败'
      });
    }
  }
}

module.exports = FeedbackController;


