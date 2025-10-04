const dbConnection = require('../config/dbConnection');

class Category {
  constructor(data) {
    this.category_id = data.category_id;
    this.name = data.name;
    this.parent_id = data.parent_id || null;
    this.level = data.level || 1;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // 创建分类
  static async create(categoryData) {
    try {
      const { name, parent_id } = categoryData;

      // 验证必填字段
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('分类名称不能为空');
      }

      if (name.length > 100) {
        throw new Error('分类名称不能超过100个字符');
      }

      const nameTrimmed = name.trim();
      let parentId = parent_id ? parseInt(parent_id) : null;
      let level = 1;

      // 如果有父级ID，验证父级分类是否存在并计算层级
      if (parentId) {
        const parentCategory = await Category.findById(parentId);
        if (!parentCategory) {
          throw new Error('父级分类不存在');
        }
        
        if (parentCategory.level >= 3) {
          throw new Error('最多支持三级分类');
        }
        
        level = parentCategory.level + 1;
      }

      // 检查同级下分类名称是否已存在
      const existingCategory = await Category.findByNameWithParent(nameTrimmed, parentId);
      if (existingCategory) {
        throw new Error('同级分类下名称不能重复');
      }

      const sql = 'INSERT INTO categories (name, parent_id, level) VALUES (?, ?, ?)';
      const result = await dbConnection.query(sql, [nameTrimmed, parentId, level]);

      return await Category.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  // 根据ID查找分类
  static async findById(id) {
    try {
      const sql = 'SELECT * FROM categories WHERE category_id = ?';
      const rows = await dbConnection.query(sql, [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return new Category(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // 根据名称查找分类
  static async findByName(name) {
    try {
      const sql = 'SELECT * FROM categories WHERE name = ?';
      const rows = await dbConnection.query(sql, [name]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return new Category(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // 根据名称和父级ID查找分类（用于检查同级分类重名）
  static async findByNameWithParent(name, parentId) {
    try {
      let sql = 'SELECT * FROM categories WHERE name = ?';
      let params = [name];
      
      if (parentId === null || parentId === undefined) {
        sql += ' AND parent_id IS NULL';
      } else {
        sql += ' AND parent_id = ?';
        params.push(parentId);
      }
      
      const rows = await dbConnection.query(sql, params);
      
      if (rows.length === 0) {
        return null;
      }
      
      return new Category(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // 检查循环引用
  static async checkCircularReference(categoryId, parentId) {
    try {
      let currentParent = parentId;
      while (currentParent) {
        if (currentParent === categoryId) {
          return true; // 形成循环引用
        }
        const parent = await Category.findById(currentParent);
        currentParent = parent ? parent.parent_id : null;
      }
      return false;
    } catch (error) {
      throw error;
    }
  }

  // 根据父级ID查找子分类
  static async findChildren(parentId) {
    try {
      let sql = 'SELECT * FROM categories WHERE parent_id = ? ORDER BY name ASC';
      let params = [parentId];
      
      const rows = await dbConnection.query(sql, params);
      return rows.map(row => new Category(row));
    } catch (error) {
      throw error;
    }
  }

  // 更新分类
  static async update(id, updateData) {
    try {
      const { name, parent_id } = updateData;

      // 验证必填字段
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('分类名称不能为空');
      }

      if (name.length > 100) {
        throw new Error('分类名称不能超过100个字符');
      }

      const nameTrimmed = name.trim();
      let parentId = parent_id ? parseInt(parent_id) : null;

      // 检查分类是否存在
      const existingCategory = await Category.findById(id);
      if (!existingCategory) {
        throw new Error('分类不存在');
      }

      // 防止循环引用：不能将自己设为子分类
      if (parentId === parseInt(id)) {
        throw new Error('不能将自己设为父级分类');
      }

      // 检查父级分类级别
      if (parentId) {
        const parentCategory = await Category.findById(parentId);
        if (!parentCategory) {
          throw new Error('父级分类不存在');
        }
        
        if (parentCategory.level >= 3) {
          throw new Error('最多支持三级分类');
        }
        
        // 检查是否会形成循环引用
        const isCircular = await Category.checkCircularReference(parseInt(id), parentId);
        if (isCircular) {
          throw new Error('不能将后代分类设为父级分类');
        }
      }

      // 检查同级下分类名称是否已被其他分类使用
      const duplicateCategory = await Category.findByNameWithParent(nameTrimmed, parentId);
      if (duplicateCategory && duplicateCategory.category_id !== parseInt(id)) {
        throw new Error('同级分类下名称不能重复');
      }

      // 重新计算层级
      const newLevel = parentId ? (await Category.findById(parentId)).level + 1 : 1;

      const sql = 'UPDATE categories SET name = ?, parent_id = ?, level = ? WHERE category_id = ?';
      await dbConnection.query(sql, [nameTrimmed, parentId, newLevel, id]);

      return await Category.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // 删除分类
  static async delete(id) {
    try {
      // 检查分类是否存在
      const category = await Category.findById(id);
      if (!category) {
        throw new Error('分类不存在');
      }

      // 检查是否有子分类
      const childrenSql = 'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?';
      const childrenResult = await dbConnection.query(childrenSql, [id]);
      
      if (childrenResult[0].count > 0) {
        throw new Error('无法删除分类，该分类下还有子分类');
      }

      // 检查是否有商品使用此分类
      const productsSql = 'SELECT COUNT(*) as count FROM products WHERE category_id = ?';
      const productsResult = await dbConnection.query(productsSql, [id]);
      
      if (productsResult[0].count > 0) {
        throw new Error('无法删除分类，该分类下还有商品');
      }

      const sql = 'DELETE FROM categories WHERE category_id = ?';
      await dbConnection.query(sql, [id]);

      return true;
    } catch (error) {
      throw error;
    }
  }

  // 获取所有分类（不分页，用于下拉选择等场景）
  static async getAll() {
    try {
      const sql = `
        SELECT category_id, name, parent_id, level, created_at, updated_at
        FROM categories
        ORDER BY level ASC, name ASC
      `;

      const rows = await dbConnection.query(sql);
      return rows.map(row => new Category(row));
    } catch (error) {
      throw error;
    }
  }

  // 获取分类树结构（层级结构）
  static async getTree() {
    try {
      const allCategories = await Category.getAll();
      
      // 建立分类映射
      const categoryMap = {};
      const rootCategories = [];
      
      // 初始化分类映射
      allCategories.forEach(category => {
        categoryMap[category.category_id] = {
          ...category,
          children: []
        };
      });
      
      // 构建树结构
      allCategories.forEach(category => {
        if (category.parent_id === null) {
          rootCategories.push(categoryMap[category.category_id]);
        } else if (categoryMap[category.parent_id]) {
          categoryMap[category.parent_id].children.push(categoryMap[category.category_id]);
        }
      });
      
      return rootCategories;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Category;
