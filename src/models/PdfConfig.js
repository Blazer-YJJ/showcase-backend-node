/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\models\PdfConfig.js
 * @Description: PDF配置模型
 */

const dbConnection = require('../config/dbConnection');

class PdfConfig {
  constructor(data) {
    this.config_id = data.config_id;
    this.pdf_file_company_name = data.pdf_file_company_name;
    this.pdf_title_company_name = data.pdf_title_company_name;
    this.pdf_background_image = data.pdf_background_image;
    this.products_per_row = data.products_per_row;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // 创建PDF配置
  static async create(pdfConfigData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      const {
        pdf_file_company_name,
        pdf_title_company_name,
        pdf_background_image = null,
        products_per_row = '2',
        is_active = 1
      } = pdfConfigData;

      // 验证必填字段
      if (!pdf_file_company_name || typeof pdf_file_company_name !== 'string' || pdf_file_company_name.trim().length === 0) {
        throw new Error('PDF文件公司名字不能为空');
      }

      if (!pdf_title_company_name || typeof pdf_title_company_name !== 'string' || pdf_title_company_name.trim().length === 0) {
        throw new Error('PDF中的标题公司名字不能为空');
      }

      // 验证每行商品数量
      if (products_per_row !== '2' && products_per_row !== '3') {
        throw new Error('每行商品数量只能是2或3');
      }

      // 验证状态值
      const statusValue = parseInt(is_active);
      if (statusValue !== 0 && statusValue !== 1) {
        throw new Error('启用状态只能是0或1');
      }

      // 如果设置为启用，检查是否已存在启用的配置
      if (statusValue === 1) {
        const [existingRows] = await connection.execute(
          'SELECT config_id FROM pdf_config WHERE is_active = 1'
        );

        if (existingRows.length > 0) {
          // 将现有的启用配置设为禁用
          await connection.execute(
            'UPDATE pdf_config SET is_active = 0 WHERE is_active = 1'
          );
        }
      }

      // 插入PDF配置数据
      const [result] = await connection.execute(
        `INSERT INTO pdf_config (pdf_file_company_name, pdf_title_company_name, pdf_background_image, products_per_row, is_active) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          pdf_file_company_name.trim(),
          pdf_title_company_name.trim(),
          pdf_background_image || null,
          products_per_row,
          statusValue
        ]
      );

      await connection.commit();

      return {
        config_id: result.insertId,
        pdf_file_company_name: pdf_file_company_name.trim(),
        pdf_title_company_name: pdf_title_company_name.trim(),
        pdf_background_image: pdf_background_image || null,
        products_per_row: products_per_row,
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

  // 获取启用的PDF配置
  static async findActive() {
    const connection = await dbConnection.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM pdf_config WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取PDF配置（管理员接口，获取所有状态）
  static async findForAdmin() {
    const connection = await dbConnection.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM pdf_config ORDER BY created_at DESC LIMIT 1'
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // 根据ID获取PDF配置
  static async findById(configId) {
    const connection = await dbConnection.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM pdf_config WHERE config_id = ?',
        [configId]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取所有PDF配置（分页）
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
        `SELECT COUNT(*) as total FROM pdf_config ${whereClause}`,
        params
      );
      const total = countRows[0].total;

      // 获取数据
      const [rows] = await connection.execute(
        `SELECT * FROM pdf_config ${whereClause}
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

  // 更新PDF配置
  static async update(configId, updateData) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 检查记录是否存在
      const existing = await this.findById(configId);
      if (!existing) {
        throw new Error('PDF配置不存在');
      }

      const {
        pdf_file_company_name,
        pdf_title_company_name,
        pdf_background_image,
        products_per_row,
        is_active
      } = updateData;

      // 构建更新字段
      const updateFields = [];
      const updateValues = [];

      if (pdf_file_company_name !== undefined) {
        if (!pdf_file_company_name || typeof pdf_file_company_name !== 'string' || pdf_file_company_name.trim().length === 0) {
          throw new Error('PDF文件公司名字不能为空');
        }
        updateFields.push('pdf_file_company_name = ?');
        updateValues.push(pdf_file_company_name.trim());
      }

      if (pdf_title_company_name !== undefined) {
        if (!pdf_title_company_name || typeof pdf_title_company_name !== 'string' || pdf_title_company_name.trim().length === 0) {
          throw new Error('PDF中的标题公司名字不能为空');
        }
        updateFields.push('pdf_title_company_name = ?');
        updateValues.push(pdf_title_company_name.trim());
      }

      if (pdf_background_image !== undefined) {
        updateFields.push('pdf_background_image = ?');
        updateValues.push(pdf_background_image || null);
      }

      if (products_per_row !== undefined) {
        if (products_per_row !== '2' && products_per_row !== '3') {
          throw new Error('每行商品数量只能是2或3');
        }
        updateFields.push('products_per_row = ?');
        updateValues.push(products_per_row);
      }

      if (is_active !== undefined) {
        const statusValue = parseInt(is_active);
        if (statusValue !== 0 && statusValue !== 1) {
          throw new Error('启用状态只能是0或1');
        }
        updateFields.push('is_active = ?');
        updateValues.push(statusValue);

        // 如果设置为启用，将其他启用的配置设为禁用
        if (statusValue === 1) {
          await connection.execute(
            'UPDATE pdf_config SET is_active = 0 WHERE is_active = 1 AND config_id != ?',
            [configId]
          );
        }
      }

      if (updateFields.length === 0) {
        throw new Error('至少需要提供一个更新字段');
      }

      // 添加更新时间
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(configId);

      // 执行更新
      const [result] = await connection.execute(
        `UPDATE pdf_config SET ${updateFields.join(', ')} WHERE config_id = ?`,
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

  // 删除PDF配置
  static async delete(configId) {
    const connection = await dbConnection.getConnection();
    try {
      await connection.beginTransaction();

      // 检查记录是否存在
      const existing = await this.findById(configId);
      if (!existing) {
        throw new Error('PDF配置不存在');
      }

      // 删除记录
      const [result] = await connection.execute(
        'DELETE FROM pdf_config WHERE config_id = ?',
        [configId]
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

module.exports = PdfConfig;

