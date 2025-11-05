/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-11 17:00:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-11 17:00:00
 * @FilePath: \showcase-backend-node\src\controllers\addressController.js
 * @Description: 地址控制器
 */

const UserAddress = require('../models/UserAddress');

// 创建地址
const createAddress = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    
    // 从认证中间件获取用户ID
    const user_id = req.user.user_id;

    const addressData = {
      user_id,
      name,
      phone,
      address
    };

    const newAddress = await UserAddress.create(addressData);

    res.status(201).json({
      success: true,
      message: '地址创建成功',
      data: newAddress.toSafeObject()
    });
  } catch (error) {
    console.error('创建地址错误:', error);
    
    if (error.message.includes('不能为空') || 
        error.message.includes('长度') || 
        error.message.includes('用户不存在')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '创建地址失败'
    });
  }
};

// 获取当前用户的所有地址
const getMyAddresses = async (req, res) => {
  try {
    // 从认证中间件获取用户ID
    const user_id = req.user.user_id;

    const addresses = await UserAddress.findByUserId(user_id);

    res.json({
      success: true,
      message: '获取地址列表成功',
      data: addresses.map(addr => addr.toSafeObject())
    });
  } catch (error) {
    console.error('获取地址列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取地址列表失败'
    });
  }
};

// 根据ID获取地址详情
const getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const addressId = parseInt(id);

    if (isNaN(addressId) || addressId <= 0) {
      return res.status(400).json({
        success: false,
        message: '无效的地址ID'
      });
    }

    // 从认证中间件获取用户ID
    const user_id = req.user.user_id;

    // 确保地址属于当前用户
    const address = await UserAddress.findByIdAndUserId(addressId, user_id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: '地址不存在或不属于当前用户'
      });
    }

    res.json({
      success: true,
      message: '获取地址详情成功',
      data: address.toSafeObject()
    });
  } catch (error) {
    console.error('获取地址详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取地址详情失败'
    });
  }
};

// 更新地址
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const addressId = parseInt(id);

    if (isNaN(addressId) || addressId <= 0) {
      return res.status(400).json({
        success: false,
        message: '无效的地址ID'
      });
    }

    // 从认证中间件获取用户ID
    const user_id = req.user.user_id;

    // 确保地址属于当前用户
    const address = await UserAddress.findByIdAndUserId(addressId, user_id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: '地址不存在或不属于当前用户'
      });
    }

    const updateData = req.body;
    const updatedAddress = await address.update(updateData);

    res.json({
      success: true,
      message: '地址更新成功',
      data: updatedAddress.toSafeObject()
    });
  } catch (error) {
    console.error('更新地址错误:', error);
    
    if (error.message.includes('不能为空') || 
        error.message.includes('长度') || 
        error.message.includes('没有提供要更新的字段')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '更新地址失败'
    });
  }
};

// 删除地址
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const addressId = parseInt(id);

    if (isNaN(addressId) || addressId <= 0) {
      return res.status(400).json({
        success: false,
        message: '无效的地址ID'
      });
    }

    // 从认证中间件获取用户ID
    const user_id = req.user.user_id;

    const result = await UserAddress.delete(addressId, user_id);

    res.json({
      success: true,
      message: result.message,
      data: {
        address_id: result.address_id
      }
    });
  } catch (error) {
    console.error('删除地址错误:', error);
    
    if (error.message.includes('地址不存在') || 
        error.message.includes('不属于该用户') ||
        error.message.includes('已被订单使用')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '删除地址失败'
    });
  }
};

module.exports = {
  createAddress,
  getMyAddresses,
  getAddressById,
  updateAddress,
  deleteAddress
};

