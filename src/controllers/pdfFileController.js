/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\controllers\pdfFileController.js
 * @Description: PDF文件管理控制器
 */

const fs = require('fs');
const path = require('path');

class PdfFileController {
  /**
   * 获取所有PDF文件列表
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  static async getAllPdfFiles(req, res) {
    try {
      const pdfsDir = path.join(__dirname, '../../uploads/pdfs');
      
      // 确保目录存在
      if (!fs.existsSync(pdfsDir)) {
        fs.mkdirSync(pdfsDir, { recursive: true });
        return res.json({
          success: true,
          message: '获取PDF文件列表成功',
          data: [],
          total: 0
        });
      }

      // 读取目录中的所有文件
      const files = fs.readdirSync(pdfsDir);
      
      // 过滤出PDF文件并获取详细信息
      const pdfFiles = files
        .filter(file => file.toLowerCase().endsWith('.pdf'))
        .map(file => {
          const filePath = path.join(pdfsDir, file);
          const stats = fs.statSync(filePath);
          
          return {
            filename: file,
            size: stats.size, // 文件大小（字节）
            sizeFormatted: formatFileSize(stats.size), // 格式化后的文件大小
            createdTime: stats.birthtime, // 创建时间
            modifiedTime: stats.mtime, // 修改时间
            url: `/uploads/pdfs/${file}` // 访问URL
          };
        })
        .sort((a, b) => {
          // 按修改时间倒序排列（最新的在前）
          return new Date(b.modifiedTime) - new Date(a.modifiedTime);
        });

      res.json({
        success: true,
        message: '获取PDF文件列表成功',
        data: pdfFiles,
        total: pdfFiles.length
      });
    } catch (error) {
      console.error('获取PDF文件列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取PDF文件列表失败'
      });
    }
  }

  /**
   * 批量删除PDF文件
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  static async batchDeletePdfFiles(req, res) {
    try {
      const { filenames } = req.body;

      // 验证请求参数
      if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供要删除的文件名数组'
        });
      }

      const pdfsDir = path.join(__dirname, '../../uploads/pdfs');
      
      // 确保目录存在
      if (!fs.existsSync(pdfsDir)) {
        return res.status(404).json({
          success: false,
          message: 'PDF文件目录不存在'
        });
      }

      const results = {
        success: [],
        failed: []
      };

      // 遍历删除每个文件
      for (const filename of filenames) {
        try {
          // 安全检查：防止路径遍历攻击
          // 禁止包含路径分隔符、相对路径符号等危险字符
          if (filename.includes('..') || 
              filename.includes('/') || 
              filename.includes('\\') ||
              filename.includes('\0') ||
              !filename.toLowerCase().endsWith('.pdf')) {
            results.failed.push({
              filename,
              reason: '文件名格式不安全'
            });
            continue;
          }

          const filePath = path.join(pdfsDir, filename);
          
          // 确保文件路径在pdfs目录内（防止路径遍历攻击）
          const resolvedPath = path.resolve(filePath);
          const resolvedDir = path.resolve(pdfsDir);
          
          if (!resolvedPath.startsWith(resolvedDir)) {
            results.failed.push({
              filename,
              reason: '文件路径不安全'
            });
            continue;
          }

          // 检查文件是否存在
          if (!fs.existsSync(filePath)) {
            results.failed.push({
              filename,
              reason: '文件不存在'
            });
            continue;
          }

          // 删除文件
          fs.unlinkSync(filePath);
          results.success.push(filename);
        } catch (error) {
          console.error(`删除文件 ${filename} 失败:`, error);
          results.failed.push({
            filename,
            reason: error.message || '删除失败'
          });
        }
      }

      // 返回删除结果
      if (results.failed.length === 0) {
        res.json({
          success: true,
          message: `成功删除 ${results.success.length} 个PDF文件`,
          data: {
            deleted: results.success,
            failed: results.failed
          }
        });
      } else if (results.success.length === 0) {
        res.status(400).json({
          success: false,
          message: '所有文件删除失败',
          data: {
            deleted: results.success,
            failed: results.failed
          }
        });
      } else {
        res.json({
          success: true,
          message: `成功删除 ${results.success.length} 个文件，${results.failed.length} 个文件删除失败`,
          data: {
            deleted: results.success,
            failed: results.failed
          }
        });
      }
    } catch (error) {
      console.error('批量删除PDF文件错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '批量删除PDF文件失败'
      });
    }
  }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} 格式化后的文件大小
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

module.exports = PdfFileController;

