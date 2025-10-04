const Category = require('../models/Category');

/**
 * 创建分类
 */
const createCategory = async (req, res) => {
  try {
    const categoryData = req.body;
    const result = await Category.create(categoryData);
    
    res.status(201).json({
      success: true,
      data: result,
      message: '分类创建成功'
    });
  } catch (error) {
    console.error('Create category error:', error);
    
    if (error.message.includes('不能为空') || 
        error.message.includes('不能超过') || 
        error.message.includes('已存在')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '分类创建失败'
    });
  }
};


/**
 * 获取所有分类（不分页，返回树状结构）
 */
const getAllCategories = async (req, res) => {
  try {
    const tree = await Category.getTree();
    
    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('Get all categories error:', error);
    
    res.status(500).json({
      success: false,
      message: '获取分类列表失败'
    });
  }
};

/**
 * 获取分类树结构
 */
const getCategoryTree = async (req, res) => {
  try {
    const tree = await Category.getTree();
    
    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('Get category tree error:', error);
    
    res.status(500).json({
      success: false,
      message: '获取分类树结构失败'
    });
  }
};


/**
 * 更新分类
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const result = await Category.update(id, updateData);
    
    res.json({
      success: true,
      data: result,
      message: '分类更新成功'
    });
  } catch (error) {
    console.error('Update category error:', error);
    
    if (error.message.includes('不存在') || 
        error.message.includes('不能为空') || 
        error.message.includes('不能超过') || 
        error.message.includes('已存在')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '更新分类失败'
    });
  }
};

/**
 * 删除分类
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Category.delete(id);
    
    res.json({
      success: true,
      message: '分类删除成功'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    
    if (error.message.includes('不存在') || 
        error.message.includes('还有商品')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '删除分类失败'
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryTree,
  updateCategory,
  deleteCategory
};
