/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\controllers\customerServiceController.js
 * @Description: 客服联系信息控制器
 */

const CustomerService = require('../models/CustomerService');
const logger = require('../middleware/logger');

/**
 * 获取客服联系信息列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getCustomerServices = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    // 构建查询条件
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    // 计算偏移量
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 查询数据
    const { data, total } = await CustomerService.getCustomerServices({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset
    });

    logger.info(`获取客服联系信息列表成功，共 ${total} 条记录`);

    res.json({
      success: true,
      data: data,
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    logger.error('获取客服联系信息列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取客服联系信息列表失败',
      error: error.message
    });
  }
};

/**
 * 根据ID获取客服联系信息详情
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getCustomerServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customerService = await CustomerService.getCustomerServiceById(id);
    
    if (!customerService) {
      return res.status(404).json({
        success: false,
        message: '客服联系信息不存在'
      });
    }

    logger.info(`获取客服联系信息详情成功，ID: ${id}`);

    res.json({
      success: true,
      data: customerService
    });
  } catch (error) {
    logger.error('获取客服联系信息详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取客服联系信息详情失败',
      error: error.message
    });
  }
};

/**
 * 创建客服联系信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const createCustomerService = async (req, res) => {
  try {
    const { 
      contact_phone, 
      wechat_number, 
      wechat_image
    } = req.body;

    const customerServiceData = {
      contact_phone,
      wechat_number,
      wechat_image
    };

    const newCustomerService = await CustomerService.createCustomerService(customerServiceData);

    logger.info(`创建客服联系信息成功，ID: ${newCustomerService.id}`);

    res.status(201).json({
      success: true,
      message: '客服联系信息创建成功',
      data: newCustomerService
    });
  } catch (error) {
    logger.error('创建客服联系信息失败:', error);
    res.status(500).json({
      success: false,
      message: '创建客服联系信息失败',
      error: error.message
    });
  }
};

/**
 * 更新客服联系信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const updateCustomerService = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      contact_phone, 
      wechat_number, 
      wechat_image
    } = req.body;

    // 检查客服联系信息是否存在
    const existingService = await CustomerService.getCustomerServiceById(id);
    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: '客服联系信息不存在'
      });
    }

    // 构建更新数据
    const updateData = {};
    if (contact_phone !== undefined) updateData.contact_phone = contact_phone;
    if (wechat_number !== undefined) updateData.wechat_number = wechat_number;
    if (wechat_image !== undefined) updateData.wechat_image = wechat_image;

    const updatedCustomerService = await CustomerService.updateCustomerService(id, updateData);

    logger.info(`更新客服联系信息成功，ID: ${id}`);

    res.json({
      success: true,
      message: '客服联系信息更新成功',
      data: updatedCustomerService
    });
  } catch (error) {
    logger.error('更新客服联系信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新客服联系信息失败',
      error: error.message
    });
  }
};

/**
 * 删除客服联系信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const deleteCustomerService = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查客服联系信息是否存在
    const existingService = await CustomerService.getCustomerServiceById(id);
    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: '客服联系信息不存在'
      });
    }

    await CustomerService.deleteCustomerService(id);

    logger.info(`删除客服联系信息成功，ID: ${id}`);

    res.json({
      success: true,
      message: '客服联系信息删除成功'
    });
  } catch (error) {
    logger.error('删除客服联系信息失败:', error);
    res.status(500).json({
      success: false,
      message: '删除客服联系信息失败',
      error: error.message
    });
  }
};

module.exports = {
  getCustomerServices,
  getCustomerServiceById,
  createCustomerService,
  updateCustomerService,
  deleteCustomerService
};
