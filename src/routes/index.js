/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-01 00:25:28
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-11-05 23:31:05
 * @FilePath: \showcase-backend-node\src\routes\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const express = require('express');
const router = express.Router();

// 基础路由
router.get('/', (req, res) => {
  res.json({
    message: 'API路由根目录',
    availableRoutes: [
      'GET /api/admins - 获取管理员列表',
      'GET /api/users - 获取用户列表',
      'GET /api/products - 获取商品列表',
      'POST /api/products/batch/delete - 批量删除商品',
      'POST /api/products/batch/tags - 批量给多个商品添加标签',
      'POST /api/products/batch/create - 批量创建商品（根据图片名自动命名）',
      'GET /api/categories/all - 获取所有分类（无需认证）',
      'GET /api/explore-selections - 获取探索精选列表（公开接口）',
      'GET /api/explore-selections/:id - 获取探索精选详情（公开接口）',
      'POST /api/explore-selections - 创建探索精选（管理员权限，支持单个和批量）',
      'PUT /api/explore-selections/:id - 更新探索精选排序（管理员权限）',
      'DELETE /api/explore-selections/:id - 删除探索精选（管理员权限）',
      'POST /api/explore-selections/batch/sort - 批量更新探索精选排序（管理员权限）',
      'GET /api/explore-selections/admin/stats - 获取探索精选统计（管理员权限）',
      'GET /api/main-promotions - 获取主推款式列表（公开接口）',
      'GET /api/main-promotions/:id - 获取主推款式详情（公开接口）',
      'POST /api/main-promotions - 创建主推款式（管理员权限，支持单个和批量）',
      'PUT /api/main-promotions/:id - 更新主推款式排序（管理员权限）',
      'DELETE /api/main-promotions/:id - 删除主推款式（管理员权限）',
      'POST /api/main-promotions/batch/sort - 批量更新主推款式排序（管理员权限）',
      'GET /api/main-promotions/admin/stats - 获取主推款式统计（管理员权限）',
      'GET /api/hot-products - 获取热门款式列表（公开接口）',
      'GET /api/hot-products/:id - 获取热门款式详情（公开接口）',
      'POST /api/hot-products - 创建热门款式（管理员权限，支持单个和批量）',
      'PUT /api/hot-products/:id - 更新热门款式排序（管理员权限）',
      'POST /api/hot-products/batch/delete - 批量删除热门款式（管理员权限）',
      'POST /api/hot-products/batch/sort - 批量更新热门款式排序（管理员权限）',
      'GET /api/hot-products/admin/stats - 获取热门款式统计（管理员权限）',
      'GET /api/announcements - 获取公告列表（公开接口）',
      'GET /api/announcements/active - 获取启用公告列表（公开接口）',
      'POST /api/announcements - 创建公告（管理员权限）',
      'DELETE /api/announcements/:id - 删除公告（管理员权限）',
      'POST /api/feedback - 创建反馈（用户权限）',
      'GET /api/feedback - 获取反馈列表（管理员权限）',
      'GET /api/feedback/:id - 获取反馈详情（管理员权限）',
      'DELETE /api/feedback/:id - 删除反馈（管理员权限）',
      'POST /api/feedback/batch/delete - 批量删除反馈（管理员权限）',
      'GET /api/about-us - 获取关于我们信息（管理员权限）',
      'POST /api/about-us - 创建关于我们信息（管理员权限）',
      'GET /api/about-us/all - 获取所有关于我们信息（管理员权限）',
      'GET /api/about-us/:id - 获取关于我们信息详情（管理员权限）',
      'PUT /api/about-us/:id - 更新关于我们信息（管理员权限）',
      'DELETE /api/about-us/:id - 删除关于我们信息（管理员权限）',
      'GET /api/banners - 获取轮播图列表（公开接口）',
      'POST /api/banners - 创建轮播图（管理员权限）',
      'GET /api/banners/:id - 获取轮播图详情（管理员权限）',
      'PUT /api/banners/:id - 更新轮播图（管理员权限）',
      'PUT /api/banners/:id/sort - 更新轮播图排序（管理员权限）',
      'DELETE /api/banners/:id - 删除轮播图（管理员权限）',
      'POST /api/banners/batch/delete - 批量删除轮播图（管理员权限）',
      'GET /api/customer-service - 获取客服联系信息列表（公开接口）',
      'POST /api/customer-service - 创建客服联系信息（管理员权限）',
      'GET /api/customer-service/:id - 获取客服联系信息详情（管理员权限）',
      'PUT /api/customer-service/:id - 更新客服联系信息（管理员权限）',
      'DELETE /api/customer-service/:id - 删除客服联系信息（管理员权限）',
      'GET /api/limited-time-activities - 获取限时活动列表（公开接口）',
      'GET /api/limited-time-activities/active - 获取启用限时活动列表（公开接口）',
      'POST /api/limited-time-activities - 创建限时活动（管理员权限）',
      'GET /api/limited-time-activities/:id - 获取限时活动详情（公开接口）',
      'PUT /api/limited-time-activities/:id - 更新限时活动（管理员权限）',
      'DELETE /api/limited-time-activities/:id - 删除限时活动（管理员权限）',
      'POST /api/limited-time-activities/batch/delete - 批量删除限时活动（管理员权限）',
      'GET /api/new-arrival-announcements - 获取上新公告列表（公开接口）',
      'GET /api/new-arrival-announcements/active - 获取启用上新公告列表（公开接口）',
      'GET /api/new-arrival-announcements/:id - 获取上新公告详情（公开接口）',
      'POST /api/new-arrival-announcements - 创建上新公告（管理员权限）',
      'GET /api/new-arrival-announcements/admin/list - 获取所有上新公告列表（管理员权限）',
      'GET /api/new-arrival-announcements/admin/stats - 获取上新公告统计（管理员权限）',
      'PUT /api/new-arrival-announcements/:id - 更新上新公告（管理员权限）',
      'PUT /api/new-arrival-announcements/:id/status - 切换上新公告状态（管理员权限）',
      'DELETE /api/new-arrival-announcements/:id - 删除上新公告（管理员权限）',
      'POST /api/new-arrival-announcements/batch/delete - 批量删除上新公告（管理员权限）',
      'POST /api/orders - 创建订单（用户权限）',
      'GET /api/orders - 获取当前用户的订单列表（用户权限）',
      'GET /api/orders/:id - 获取订单详情（用户权限）',
      'PUT /api/orders/:id - 更新订单（用户权限）',
      'DELETE /api/orders/:id - 删除订单（用户权限）',
      'GET /api/orders/admin/list - 获取所有订单列表（管理员权限）',
      'GET /api/orders/admin/:id - 获取订单详情（管理员权限）',
      'PUT /api/orders/admin/:id - 更新订单（管理员权限）',
      'PUT /api/orders/admin/:id/status - 修改订单状态（管理员权限）',
      'DELETE /api/orders/admin/:id - 删除订单（管理员权限）',
      'POST /api/addresses - 创建地址（用户权限）',
      'GET /api/addresses - 获取当前用户的所有地址（用户权限）',
      'GET /api/addresses/:id - 获取地址详情（用户权限）',
      'PUT /api/addresses/:id - 更新地址（用户权限）',
      'DELETE /api/addresses/:id - 删除地址（用户权限）',
      'GET /api/health - 健康检查'
    ]
  });
});

module.exports = router;

