/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-11 17:00:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-11 17:00:00
 * @FilePath: \showcase-backend-node\src\routes\addressRoutes.js
 * @Description: 地址路由
 */

const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { userAuth } = require('../middleware/userAuth');
const { validateCreateAddress, validateUpdateAddress } = require('../validators/addressValidator');

// 所有地址路由都需要用户认证
router.use(userAuth);

// POST /api/addresses - 创建地址（用户权限）
router.post('/', validateCreateAddress, addressController.createAddress);

// GET /api/addresses - 获取当前用户的所有地址（用户权限）
router.get('/', addressController.getMyAddresses);

// GET /api/addresses/:id - 获取地址详情（用户权限）
router.get('/:id', addressController.getAddressById);

// PUT /api/addresses/:id - 更新地址（用户权限）
router.put('/:id', validateUpdateAddress, addressController.updateAddress);

// DELETE /api/addresses/:id - 删除地址（用户权限）
router.delete('/:id', addressController.deleteAddress);

module.exports = router;

