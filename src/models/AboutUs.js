/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\models\AboutUs.js
 * @Description: 关于我们模型
 */

const dbConnection = require('../config/dbConnection');

class AboutUs {
  constructor(data) {
    this.about_id = data.about_id;
    this.company_name = data.company_name;
    this.main_business = data.main_business;
    this.address = data.address;
    this.contact_phone = data.contact_phone;
    this.logo_image = data.logo_image;
    this.company_description = data.company_description;
    this.website_url = data.website_url;
    this.email = data.email;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // 创建关于我们信息
  static async create(aboutUsData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      const {
        company_name,
        main_business,
        address,
        contact_phone,
        logo_image = null,
        company_description = null,
        website_url = null,
        email = null,
        is_active = 1
      } = aboutUsData;

      // 验证必填字段
      if (!company_name || typeof company_name !== 'string' || company_name.trim().length === 0) {
        throw new Error('公司名称不能为空');
      }

      if (!main_business || typeof main_business !== 'string' || main_business.trim().length === 0) {
        throw new Error('主营业务描述不能为空');
      }

      if (!address || typeof address !== 'string' || address.trim().length === 0) {
        throw new Error('公司地址不能为空');
      }

      if (!contact_phone || typeof contact_phone !== 'string' || contact_phone.trim().length === 0) {
        throw new Error('联系电话不能为空');
      }

      // 验证状态值
      const statusValue = parseInt(is_active);
      if (statusValue !== 0 && statusValue !== 1) {
        throw new Error('启用状态只能是0或1');
      }

      // 检查是否已存在关于我们信息
      const [existingRows] = await connection.execute(
        'SELECT about_id FROM about_us WHERE is_active = 1'
      );

      if (existingRows.length > 0) {
        throw new Error('已存在启用的关于我们信息，请先禁用现有信息或更新现有信息');
      }

      // 插入关于我们数据
      const [result] = await connection.execute(
        `INSERT INTO about_us (company_name, main_business, address, contact_phone, logo_image, company_description, website_url, email, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          company_name.trim(),
          main_business.trim(),
          address.trim(),
          contact_phone.trim(),
          logo_image || '',
          company_description ? company_description.trim() : null,
          website_url ? website_url.trim() : null,
          email ? email.trim() : null,
          statusValue
        ]
      );

      await connection.commit();

      return {
        about_id: result.insertId,
        company_name: company_name.trim(),
        main_business: main_business.trim(),
        address: address.trim(),
        contact_phone: contact_phone.trim(),
        logo_image: logo_image || '',
        company_description: company_description ? company_description.trim() : null,
        website_url: website_url ? website_url.trim() : null,
        email: email ? email.trim() : null,
        is_active: statusValue,
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取关于我们信息
  static async findActive() {
    const connection = await dbConnection.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM about_us WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取关于我们信息（管理员接口，获取所有状态）
  static async findForAdmin() {
    const connection = await dbConnection.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM about_us ORDER BY created_at DESC LIMIT 1'
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // 根据ID获取关于我们信息
  static async findById(aboutId) {
    const connection = await dbConnection.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM about_us WHERE about_id = ?',
        [aboutId]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取所有关于我们信息（分页）
  static async findAll(options = {}) {
    const connection = await dbConnection.getConnection();
    try {
      const {
        page = 1,
        limit = 10,
        is_active = null
      } = options;

      const offset = (page - 1) * limit;
      let whereClause = '';
      let params = [];

      // 构建查询条件
      if (is_active !== null) {
        whereClause = 'WHERE is_active = ?';
        params.push(parseInt(is_active));
      }

      // 获取总数
      const [countRows] = await connection.execute(
        `SELECT COUNT(*) as total FROM about_us ${whereClause}`,
        params
      );
      const total = countRows[0].total;

      // 获取数据
      const [rows] = await connection.execute(
        `SELECT * FROM about_us ${whereClause}
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      return {
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // 更新关于我们信息
  static async update(aboutId, updateData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 检查记录是否存在
      const existing = await this.findById(aboutId);
      if (!existing) {
        throw new Error('关于我们信息不存在');
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
      } = updateData;

      // 构建更新字段
      const updateFields = [];
      const updateValues = [];

      if (company_name !== undefined) {
        if (!company_name || typeof company_name !== 'string' || company_name.trim().length === 0) {
          throw new Error('公司名称不能为空');
        }
        updateFields.push('company_name = ?');
        updateValues.push(company_name.trim());
      }

      if (main_business !== undefined) {
        if (!main_business || typeof main_business !== 'string' || main_business.trim().length === 0) {
          throw new Error('主营业务描述不能为空');
        }
        updateFields.push('main_business = ?');
        updateValues.push(main_business.trim());
      }

      if (address !== undefined) {
        if (!address || typeof address !== 'string' || address.trim().length === 0) {
          throw new Error('公司地址不能为空');
        }
        updateFields.push('address = ?');
        updateValues.push(address.trim());
      }

      if (contact_phone !== undefined) {
        if (!contact_phone || typeof contact_phone !== 'string' || contact_phone.trim().length === 0) {
          throw new Error('联系电话不能为空');
        }
        updateFields.push('contact_phone = ?');
        updateValues.push(contact_phone.trim());
      }

      if (logo_image !== undefined) {
        updateFields.push('logo_image = ?');
        updateValues.push(logo_image || '');
      }

      if (company_description !== undefined) {
        updateFields.push('company_description = ?');
        updateValues.push(company_description ? company_description.trim() : null);
      }

      if (website_url !== undefined) {
        updateFields.push('website_url = ?');
        updateValues.push(website_url ? website_url.trim() : null);
      }

      if (email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(email ? email.trim() : null);
      }

      if (is_active !== undefined) {
        const statusValue = parseInt(is_active);
        if (statusValue !== 0 && statusValue !== 1) {
          throw new Error('启用状态只能是0或1');
        }
        updateFields.push('is_active = ?');
        updateValues.push(statusValue);
      }

      if (updateFields.length === 0) {
        throw new Error('至少需要提供一个更新字段');
      }

      // 添加更新时间
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(aboutId);

      // 执行更新
      const [result] = await connection.execute(
        `UPDATE about_us SET ${updateFields.join(', ')} WHERE about_id = ?`,
        [...updateValues]
      );

      await connection.commit();

      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 删除关于我们信息
  static async delete(aboutId) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 检查记录是否存在
      const existing = await this.findById(aboutId);
      if (!existing) {
        throw new Error('关于我们信息不存在');
      }

      // 删除记录
      const [result] = await connection.execute(
        'DELETE FROM about_us WHERE about_id = ?',
        [aboutId]
      );

      await connection.commit();

      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = AboutUs;
