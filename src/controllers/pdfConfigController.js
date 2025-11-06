/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\controllers\pdfConfigController.js
 * @Description: PDF配置控制器
 */

const PdfConfig = require('../models/PdfConfig');

class PdfConfigController {
  // 获取PDF配置（管理员接口）
  static async getPdfConfig(req, res) {
    try {
      const pdfConfig = await PdfConfig.findForAdmin();

      if (!pdfConfig) {
        return res.status(404).json({
          success: false,
          message: '暂无PDF配置信息'
        });
      }

      res.json({
        success: true,
        message: '获取PDF配置成功',
        data: pdfConfig
      });
    } catch (error) {
      console.error('获取PDF配置错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取PDF配置失败'
      });
    }
  }

  // 创建/设置PDF配置
  static async createPdfConfig(req, res) {
    try {
      const {
        pdf_file_company_name,
        pdf_title_company_name,
        pdf_background_image,
        products_per_row,
        is_active
      } = req.body;

      // 处理文件上传
      let backgroundImagePath = pdf_background_image || null;
      
      if (req.file) {
        // 生成文件路径
        const path = require('path');
        const fs = require('fs');
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
        const filePath = `/uploads/pdfimages/${fileName}`;
        
        // 保存文件到磁盘
        const uploadDir = path.join(__dirname, '../../uploads/pdfimages');
        
        // 确保目录存在
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const fullPath = path.join(uploadDir, fileName);
        fs.writeFileSync(fullPath, req.file.buffer);
        
        // 使用保存后的文件路径
        backgroundImagePath = filePath;
      }

      const pdfConfigData = {
        pdf_file_company_name: pdf_file_company_name ? pdf_file_company_name.trim() : '',
        pdf_title_company_name: pdf_title_company_name ? pdf_title_company_name.trim() : '',
        pdf_background_image: backgroundImagePath,
        products_per_row: products_per_row || '2',
        is_active: is_active !== undefined ? parseInt(is_active) : 1
      };

      const pdfConfig = await PdfConfig.create(pdfConfigData);

      res.status(201).json({
        success: true,
        message: 'PDF配置创建成功',
        data: pdfConfig
      });
    } catch (error) {
      console.error('创建PDF配置错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建PDF配置失败'
      });
    }
  }

  // 获取所有PDF配置（管理员）
  static async getAllPdfConfig(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        is_active
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        is_active: is_active !== undefined ? parseInt(is_active) : null
      };

      const result = await PdfConfig.findAll(options);

      res.json({
        success: true,
        message: '获取PDF配置列表成功',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('获取PDF配置列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取PDF配置列表失败'
      });
    }
  }

  // 获取单个PDF配置详情
  static async getPdfConfigById(req, res) {
    try {
      const { id } = req.params;
      const configId = parseInt(id);

      if (isNaN(configId) || configId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的PDF配置ID'
        });
      }

      const pdfConfig = await PdfConfig.findById(configId);

      if (!pdfConfig) {
        return res.status(404).json({
          success: false,
          message: 'PDF配置不存在'
        });
      }

      res.json({
        success: true,
        message: '获取PDF配置详情成功',
        data: pdfConfig
      });
    } catch (error) {
      console.error('获取PDF配置详情错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取PDF配置详情失败'
      });
    }
  }

  // 更新PDF配置
  static async updatePdfConfig(req, res) {
    try {
      const { id } = req.params;
      const configId = parseInt(id);

      if (isNaN(configId) || configId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的PDF配置ID'
        });
      }

      const {
        pdf_file_company_name,
        pdf_title_company_name,
        pdf_background_image,
        products_per_row,
        is_active
      } = req.body;

      const updateData = {};

      if (pdf_file_company_name !== undefined) {
        updateData.pdf_file_company_name = pdf_file_company_name.trim();
      }
      if (pdf_title_company_name !== undefined) {
        updateData.pdf_title_company_name = pdf_title_company_name.trim();
      }
      
      // 处理文件上传
      if (req.file) {
        // 如果有上传新文件，保存新文件
        const path = require('path');
        const fs = require('fs');
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
        const filePath = `/uploads/pdfimages/${fileName}`;
        
        // 保存文件到磁盘
        const uploadDir = path.join(__dirname, '../../uploads/pdfimages');
        
        // 确保目录存在
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const fullPath = path.join(uploadDir, fileName);
        fs.writeFileSync(fullPath, req.file.buffer);
        
        // 使用保存后的文件路径
        updateData.pdf_background_image = filePath;
        
        // 删除旧文件（如果存在）
        const existingConfig = await PdfConfig.findById(configId);
        if (existingConfig && existingConfig.pdf_background_image) {
          const oldFilePath = path.join(__dirname, '../../', existingConfig.pdf_background_image);
          if (fs.existsSync(oldFilePath)) {
            try {
              fs.unlinkSync(oldFilePath);
            } catch (err) {
              console.error('删除旧文件失败:', err);
            }
          }
        }
      } else if (pdf_background_image !== undefined) {
        // 如果没有上传文件，但提供了路径，使用提供的路径
        // 如果值为空字符串，表示删除背景图
        updateData.pdf_background_image = pdf_background_image === '' ? null : pdf_background_image;
      }
      
      if (products_per_row !== undefined) {
        updateData.products_per_row = products_per_row;
      }
      if (is_active !== undefined) {
        updateData.is_active = parseInt(is_active);
      }

      const updated = await PdfConfig.update(configId, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'PDF配置不存在或更新失败'
        });
      }

      // 获取更新后的数据
      const updatedPdfConfig = await PdfConfig.findById(configId);

      res.json({
        success: true,
        message: 'PDF配置更新成功',
        data: updatedPdfConfig
      });
    } catch (error) {
      console.error('更新PDF配置错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '更新PDF配置失败'
      });
    }
  }

  // 删除PDF配置
  static async deletePdfConfig(req, res) {
    try {
      const { id } = req.params;
      const configId = parseInt(id);

      if (isNaN(configId) || configId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的PDF配置ID'
        });
      }

      const deleted = await PdfConfig.delete(configId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'PDF配置不存在或删除失败'
        });
      }

      res.json({
        success: true,
        message: 'PDF配置删除成功'
      });
    } catch (error) {
      console.error('删除PDF配置错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '删除PDF配置失败'
      });
    }
  }
}

module.exports = PdfConfigController;

