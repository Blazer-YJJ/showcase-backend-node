/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\controllers\aboutUsController.js
 * @Description: 关于我们控制器
 */

const AboutUs = require('../models/AboutUs');

class AboutUsController {
  // 获取关于我们信息（公开接口）
  static async getAboutUs(req, res) {
    try {
      const aboutUs = await AboutUs.findActive();

      if (!aboutUs) {
        return res.status(404).json({
          success: false,
          message: '暂无关于我们信息'
        });
      }

      res.json({
        success: true,
        message: '获取关于我们信息成功',
        data: aboutUs
      });
    } catch (error) {
      console.error('获取关于我们信息错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取关于我们信息失败'
      });
    }
  }

  // 创建关于我们信息
  static async createAboutUs(req, res) {
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

      const aboutUsData = {
        company_name: company_name.trim(),
        main_business: main_business.trim(),
        address: address.trim(),
        contact_phone: contact_phone.trim(),
        logo_image: logo_image || null,
        company_description: company_description ? company_description.trim() : null,
        website_url: website_url ? website_url.trim() : null,
        email: email ? email.trim() : null,
        is_active: is_active !== undefined ? parseInt(is_active) : 1
      };

      const aboutUs = await AboutUs.create(aboutUsData);

      res.status(201).json({
        success: true,
        message: '关于我们信息创建成功',
        data: aboutUs
      });
    } catch (error) {
      console.error('创建关于我们信息错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建关于我们信息失败'
      });
    }
  }

  // 获取所有关于我们信息（管理员）
  static async getAllAboutUs(req, res) {
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

      const result = await AboutUs.findAll(options);

      res.json({
        success: true,
        message: '获取关于我们信息列表成功',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('获取关于我们信息列表错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取关于我们信息列表失败'
      });
    }
  }

  // 获取单个关于我们信息详情
  static async getAboutUsById(req, res) {
    try {
      const { id } = req.params;
      const aboutId = parseInt(id);

      if (isNaN(aboutId) || aboutId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的关于我们信息ID'
        });
      }

      const aboutUs = await AboutUs.findById(aboutId);

      if (!aboutUs) {
        return res.status(404).json({
          success: false,
          message: '关于我们信息不存在'
        });
      }

      res.json({
        success: true,
        message: '获取关于我们信息详情成功',
        data: aboutUs
      });
    } catch (error) {
      console.error('获取关于我们信息详情错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取关于我们信息详情失败'
      });
    }
  }

  // 更新关于我们信息
  static async updateAboutUs(req, res) {
    try {
      const { id } = req.params;
      const aboutId = parseInt(id);

      if (isNaN(aboutId) || aboutId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的关于我们信息ID'
        });
      }

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

      const updateData = {};

      if (company_name !== undefined) {
        updateData.company_name = company_name.trim();
      }
      if (main_business !== undefined) {
        updateData.main_business = main_business.trim();
      }
      if (address !== undefined) {
        updateData.address = address.trim();
      }
      if (contact_phone !== undefined) {
        updateData.contact_phone = contact_phone.trim();
      }
      if (logo_image !== undefined) {
        updateData.logo_image = logo_image;
      }
      if (company_description !== undefined) {
        updateData.company_description = company_description ? company_description.trim() : null;
      }
      if (website_url !== undefined) {
        updateData.website_url = website_url ? website_url.trim() : null;
      }
      if (email !== undefined) {
        updateData.email = email ? email.trim() : null;
      }
      if (is_active !== undefined) {
        updateData.is_active = parseInt(is_active);
      }

      const updated = await AboutUs.update(aboutId, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: '关于我们信息不存在或更新失败'
        });
      }

      // 获取更新后的数据
      const updatedAboutUs = await AboutUs.findById(aboutId);

      res.json({
        success: true,
        message: '关于我们信息更新成功',
        data: updatedAboutUs
      });
    } catch (error) {
      console.error('更新关于我们信息错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '更新关于我们信息失败'
      });
    }
  }

  // 删除关于我们信息
  static async deleteAboutUs(req, res) {
    try {
      const { id } = req.params;
      const aboutId = parseInt(id);

      if (isNaN(aboutId) || aboutId <= 0) {
        return res.status(400).json({
          success: false,
          message: '无效的关于我们信息ID'
        });
      }

      const deleted = await AboutUs.delete(aboutId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: '关于我们信息不存在或删除失败'
        });
      }

      res.json({
        success: true,
        message: '关于我们信息删除成功'
      });
    } catch (error) {
      console.error('删除关于我们信息错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '删除关于我们信息失败'
      });
    }
  }
}

module.exports = AboutUsController;


