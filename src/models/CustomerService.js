/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\models\CustomerService.js
 * @Description: 客服联系信息模型
 */

const db = require('../config/dbConnection');

class CustomerService {
  /**
   * 获取客服联系信息列表
   * @param {Object} options - 查询选项
   * @returns {Object} 查询结果
   */
  static async getCustomerServices(options = {}) {
    try {
      const { where = {}, limit = 10, offset = 0 } = options;
      
      // 构建WHERE子句
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (where.status) {
        whereClause += ` AND status = ?`;
        params.push(where.status);
      }

      // 查询总数
      const countQuery = `SELECT COUNT(*) as total FROM customer_service ${whereClause}`;
      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult[0][0].total);

      // 查询数据
      const dataQuery = `
        SELECT 
          service_id,
          contact_phone,
          wechat_number,
          wechat_image,
          created_at,
          updated_at
        FROM customer_service 
        ${whereClause}
        ORDER BY service_id ASC, created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      params.push(limit, offset);
      const dataResult = await db.query(dataQuery, params);

      return {
        data: dataResult[0],
        total: total
      };
    } catch (error) {
      throw new Error(`获取客服联系信息列表失败: ${error.message}`);
    }
  }

  /**
   * 根据ID获取客服联系信息
   * @param {Number} serviceId - 客服联系信息ID
   * @returns {Object|null} 客服联系信息对象或null
   */
  static async getCustomerServiceById(serviceId) {
    try {
      const query = `
        SELECT 
          service_id,
          contact_phone,
          wechat_number,
          wechat_image,
          created_at,
          updated_at
        FROM customer_service 
        WHERE service_id = ?
      `;
      
      const result = await db.query(query, [serviceId]);
      return result[0][0] || null;
    } catch (error) {
      throw new Error(`获取客服联系信息失败: ${error.message}`);
    }
  }

  /**
   * 创建客服联系信息
   * @param {Object} customerServiceData - 客服联系信息数据
   * @returns {Object} 创建的客服联系信息
   */
  static async createCustomerService(customerServiceData) {
    try {
      const {
        contact_phone,
        wechat_number,
        wechat_image
      } = customerServiceData;

      const query = `
        INSERT INTO customer_service (
          contact_phone,
          wechat_number,
          wechat_image,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, NOW(), NOW())
      `;

      const values = [
        contact_phone,
        wechat_number,
        wechat_image
      ];

      const result = await db.query(query, values);
      const insertId = result[0].insertId;
      
      // 返回新创建的记录
      return await this.getCustomerServiceById(insertId);
    } catch (error) {
      throw new Error(`创建客服联系信息失败: ${error.message}`);
    }
  }

  /**
   * 更新客服联系信息
   * @param {Number} serviceId - 客服联系信息ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新后的客服联系信息
   */
  static async updateCustomerService(serviceId, updateData) {
    try {
      const fields = [];
      const values = [];

      // 构建动态更新字段
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });

      if (fields.length === 0) {
        throw new Error('没有要更新的字段');
      }

      // 添加更新时间
      fields.push(`updated_at = NOW()`);

      const query = `
        UPDATE customer_service 
        SET ${fields.join(', ')}
        WHERE service_id = ?
      `;

      values.push(serviceId);
      const result = await db.query(query, values);

      if (result[0].affectedRows === 0) {
        throw new Error('客服联系信息不存在');
      }

      // 返回更新后的记录
      return await this.getCustomerServiceById(serviceId);
    } catch (error) {
      throw new Error(`更新客服联系信息失败: ${error.message}`);
    }
  }

  /**
   * 删除客服联系信息
   * @param {Number} serviceId - 客服联系信息ID
   * @returns {Boolean} 删除是否成功
   */
  static async deleteCustomerService(serviceId) {
    try {
      const query = 'DELETE FROM customer_service WHERE service_id = ?';
      const result = await db.query(query, [serviceId]);

      if (result[0].affectedRows === 0) {
        throw new Error('客服联系信息不存在');
      }

      return true;
    } catch (error) {
      throw new Error(`删除客服联系信息失败: ${error.message}`);
    }
  }

  /**
   * 检查客服联系信息是否存在
   * @param {Number} serviceId - 客服联系信息ID
   * @returns {Boolean} 是否存在
   */
  static async exists(serviceId) {
    try {
      const query = 'SELECT service_id FROM customer_service WHERE service_id = ?';
      const result = await db.query(query, [serviceId]);
      return result[0].length > 0;
    } catch (error) {
      throw new Error(`检查客服联系信息是否存在失败: ${error.message}`);
    }
  }
}

module.exports = CustomerService;