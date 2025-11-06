/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-11-06 00:00:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-11-06 00:00:00
 * @FilePath: \showcase-backend-node\src\controllers\statisticsController.js
 * @Description: 数据统计控制器
 */
const dbConnection = require('../config/dbConnection');

class StatisticsController {
  // 获取数据统计
  static async getStatistics(req, res) {
    try {
      // 并行查询所有统计数据
      const [
        productCount,
        categoryCount,
        orderCount,
        afterSaleCount,
        userCount,
        adminCount
      ] = await Promise.all([
        // 商品总数
        dbConnection.query('SELECT COUNT(*) as count FROM products'),
        // 总分类数
        dbConnection.query('SELECT COUNT(*) as count FROM categories'),
        // 总订单数
        dbConnection.query('SELECT COUNT(*) as count FROM user_orders'),
        // 售后总数
        dbConnection.query('SELECT COUNT(*) as count FROM order_after_sales'),
        // 会员总数
        dbConnection.query('SELECT COUNT(*) as count FROM users'),
        // 管理员总数
        dbConnection.query('SELECT COUNT(*) as count FROM admins')
      ]);

      // 提取统计数据
      const statistics = {
        productCount: productCount[0][0].count,
        categoryCount: categoryCount[0][0].count,
        orderCount: orderCount[0][0].count,
        afterSaleCount: afterSaleCount[0][0].count,
        userCount: userCount[0][0].count,
        adminCount: adminCount[0][0].count
      };

      res.json({
        success: true,
        message: '获取统计数据成功',
        data: statistics
      });
    } catch (error) {
      console.error('获取统计数据错误:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取统计数据失败'
      });
    }
  }
}

module.exports = StatisticsController;

