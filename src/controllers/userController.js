const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 创建用户
const createUser = async (req, res) => {
  try {
    const userData = req.body;
    const result = await User.create(userData);
    
    res.status(201).json({
      success: true,
      data: result,
      message: '用户创建成功'
    });
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.message.includes('必填字段') || 
        error.message.includes('长度') || 
        error.message.includes('已存在') ||
        error.message.includes('会员类型')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '创建用户失败'
    });
  }
};

// 获取用户列表
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, member_type } = req.query;
    
    // 验证分页参数
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: '页码必须大于0'
      });
    }
    
    if (limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: '每页数量必须在1-100之间'
      });
    }

    const options = {
      page: pageNum,
      limit: limitNum,
      member_type
    };

    const result = await User.findAll(options);
    
    res.json({
      success: true,
      data: result.users.map(user => user.toSafeObject()),
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
};

// 根据ID获取用户
const getUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: '用户ID必须是数字'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user.toSafeObject()
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
};

// 更新用户
const updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: '用户ID必须是数字'
      });
    }

    // 检查用户是否存在
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const updateData = req.body;
    const result = await user.update(updateData);
    
    res.json({
      success: true,
      data: result,
      message: '用户更新成功'
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.message.includes('不能为空') || 
        error.message.includes('长度') || 
        error.message.includes('已被其他用户使用') ||
        error.message.includes('会员类型') ||
        error.message.includes('没有提供要更新的字段')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '更新用户失败'
    });
  }
};

// 删除用户
const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: '用户ID必须是数字'
      });
    }

    const result = await User.delete(userId);
    
    res.json({
      success: true,
      data: result,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    
    if (error.message.includes('用户不存在')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '删除用户失败'
    });
  }
};

// 用户登录
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码为必填字段'
      });
    }

    // 查找用户
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 生成JWT token
    const token = jwt.sign(
      { 
        userId: user.user_id,
        username: user.username,
        memberType: user.member_type
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: user.toSafeObject()
      },
      message: '登录成功'
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
};

// 获取当前登录用户的会员账号信息
const getMyProfile = async (req, res) => {
  try {
    // 从认证中间件获取用户ID
    const user_id = req.user.user_id;

    // 获取用户信息（包含地址）
    const userInfo = await User.findByIdWithAddresses(user_id);

    if (!userInfo) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 格式化地址信息（将地址列表转换为联系地址字符串）
    let contactAddress = '';
    if (userInfo.addresses && userInfo.addresses.length > 0) {
      // 如果有多个地址，可以取第一个，或者合并所有地址
      // 这里取第一个地址作为联系地址
      const firstAddress = userInfo.addresses[0];
      contactAddress = `${firstAddress.address} (${firstAddress.name}, ${firstAddress.phone})`;
    }

    res.json({
      success: true,
      message: '获取会员账号信息成功',
      data: {
        user_id: userInfo.user_id,
        name: userInfo.name,
        username: userInfo.username,
        member_type: userInfo.member_type,
        created_at: userInfo.created_at,
        contact_address: contactAddress,
        addresses: userInfo.addresses || []
      }
    });
  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({
      success: false,
      message: '获取会员账号信息失败'
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
  getMyProfile
};
