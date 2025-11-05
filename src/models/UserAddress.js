/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-11 17:00:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-11 17:00:00
 * @FilePath: \showcase-backend-node\src\models\UserAddress.js
 * @Description: 用户地址模型
 */

const dbConnection = require('../config/dbConnection');

class UserAddress {
  constructor(data) {
    this.address_id = data.address_id;
    this.user_id = data.user_id;
    this.name = data.name;
    this.phone = data.phone;
    this.address = data.address;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // 创建地址
  static async create(addressData) {
    try {
      const { user_id, name, phone, address } = addressData;

      // 验证必填字段
      if (!user_id || isNaN(user_id)) {
        throw new Error('用户ID不能为空且必须是有效数字');
      }

      if (!name || name.trim() === '') {
        throw new Error('收货人姓名不能为空');
      }

      if (!phone || phone.trim() === '') {
        throw new Error('联系电话不能为空');
      }

      if (!address || address.trim() === '') {
        throw new Error('详细地址不能为空');
      }

      // 验证姓名长度
      if (name.trim().length > 100) {
        throw new Error('收货人姓名不能超过100个字符');
      }

      // 验证电话长度
      if (phone.trim().length > 20) {
        throw new Error('联系电话不能超过20个字符');
      }

      // 验证用户是否存在
      const userResult = await dbConnection.query(
        'SELECT user_id FROM users WHERE user_id = ?',
        [user_id]
      );
      if (userResult[0].length === 0) {
        throw new Error('用户不存在');
      }

      const query = `
        INSERT INTO user_addresses (user_id, name, phone, address)
        VALUES (?, ?, ?, ?)
      `;
      
      const values = [user_id, name.trim(), phone.trim(), address.trim()];
      const result = await dbConnection.query(query, values);

      // result[0] 是 ResultSetHeader，包含 insertId 属性
      const insertId = result[0]?.insertId || result[0];
      return await this.findById(insertId);
    } catch (error) {
      throw error;
    }
  }

  // 获取用户的所有地址
  static async findByUserId(userId, options = {}) {
    try {
      if (!userId || isNaN(userId)) {
        throw new Error('用户ID不能为空且必须是有效数字');
      }

      const query = `
        SELECT address_id, user_id, name, phone, address, created_at, updated_at
        FROM user_addresses
        WHERE user_id = ?
        ORDER BY created_at DESC
      `;
      
      const result = await dbConnection.query(query, [userId]);
      const addresses = result[0] || [];

      return addresses.map(addr => new UserAddress(addr));
    } catch (error) {
      throw error;
    }
  }

  // 根据ID获取地址
  static async findById(addressId) {
    try {
      if (!addressId || isNaN(addressId)) {
        throw new Error('地址ID不能为空且必须是有效数字');
      }

      const query = `
        SELECT address_id, user_id, name, phone, address, created_at, updated_at
        FROM user_addresses
        WHERE address_id = ?
      `;
      
      const result = await dbConnection.query(query, [addressId]);
      
      if (result[0].length === 0) {
        return null;
      }

      return new UserAddress(result[0][0]);
    } catch (error) {
      throw error;
    }
  }

  // 根据ID和用户ID获取地址（确保地址属于该用户）
  static async findByIdAndUserId(addressId, userId) {
    try {
      if (!addressId || isNaN(addressId)) {
        throw new Error('地址ID不能为空且必须是有效数字');
      }

      if (!userId || isNaN(userId)) {
        throw new Error('用户ID不能为空且必须是有效数字');
      }

      const query = `
        SELECT address_id, user_id, name, phone, address, created_at, updated_at
        FROM user_addresses
        WHERE address_id = ? AND user_id = ?
      `;
      
      const result = await dbConnection.query(query, [addressId, userId]);
      
      if (result[0].length === 0) {
        return null;
      }

      return new UserAddress(result[0][0]);
    } catch (error) {
      throw error;
    }
  }

  // 更新地址
  async update(updateData) {
    try {
      const { name, phone, address } = updateData;
      const updates = [];
      const values = [];

      // 构建更新字段
      if (name !== undefined) {
        if (!name || name.trim() === '') {
          throw new Error('收货人姓名不能为空');
        }
        if (name.trim().length > 100) {
          throw new Error('收货人姓名不能超过100个字符');
        }
        updates.push('name = ?');
        values.push(name.trim());
      }

      if (phone !== undefined) {
        if (!phone || phone.trim() === '') {
          throw new Error('联系电话不能为空');
        }
        if (phone.trim().length > 20) {
          throw new Error('联系电话不能超过20个字符');
        }
        updates.push('phone = ?');
        values.push(phone.trim());
      }

      if (address !== undefined) {
        if (!address || address.trim() === '') {
          throw new Error('详细地址不能为空');
        }
        updates.push('address = ?');
        values.push(address.trim());
      }

      if (updates.length === 0) {
        throw new Error('没有提供要更新的字段');
      }

      // 添加更新时间
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(this.address_id);

      const query = `
        UPDATE user_addresses
        SET ${updates.join(', ')}
        WHERE address_id = ?
      `;

      await dbConnection.query(query, values);

      // 返回更新后的地址
      return await UserAddress.findById(this.address_id);
    } catch (error) {
      throw error;
    }
  }

  // 删除地址
  static async delete(addressId, userId) {
    try {
      if (!addressId || isNaN(addressId)) {
        throw new Error('地址ID不能为空且必须是有效数字');
      }

      if (!userId || isNaN(userId)) {
        throw new Error('用户ID不能为空且必须是有效数字');
      }

      // 检查地址是否存在且属于该用户
      const address = await this.findByIdAndUserId(addressId, userId);
      if (!address) {
        throw new Error('地址不存在或不属于该用户');
      }

      // 检查地址是否被订单使用
      const orderResult = await dbConnection.query(
        'SELECT COUNT(*) as count FROM user_orders WHERE address_id = ?',
        [addressId]
      );
      
      if (orderResult[0][0].count > 0) {
        throw new Error('该地址已被订单使用，无法删除');
      }

      const query = 'DELETE FROM user_addresses WHERE address_id = ? AND user_id = ?';
      await dbConnection.query(query, [addressId, userId]);

      return {
        address_id: addressId,
        message: '地址删除成功'
      };
    } catch (error) {
      throw error;
    }
  }

  // 转换为安全对象（用于API响应）
  toSafeObject() {
    return {
      address_id: this.address_id,
      user_id: this.user_id,
      name: this.name,
      phone: this.phone,
      address: this.address,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = UserAddress;

