// MySQL数据库连接模块
const mysql = require('mysql2/promise');
const logger = require('../middleware/logger');

// 数据库配置
require('dotenv').config();

const dbConfig = {
  development: {
    host: 'localhost',
    port: 3306,
    database: 'showcase_backend',
    user: 'root',
    password: 'YJJ010317..',
    charset: process.env.DB_CHARSET || 'utf8mb4',
    timezone: process.env.DB_TIMEZONE || '+08:00',
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
  },
  production: {
    host: 'localhost',
    port: 3306,
    database: 'showcase_backend',
    user: 'root',
    password: 'YJJ010317..',
    charset: process.env.DB_CHARSET || 'utf8mb4',
    timezone: process.env.DB_TIMEZONE || '+08:00',
    connectionLimit: 20,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
  },
  test: {
    host: 'localhost',
    port: 3306,
    database: 'showcase_backend',
    user: 'root',
    password: 'YJJ010317..',
    charset: process.env.DB_CHARSET || 'utf8mb4',
    timezone: process.env.DB_TIMEZONE || '+08:00',
    connectionLimit: 5,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
  }
};

// 获取当前环境的配置
const currentConfig = dbConfig[process.env.NODE_ENV || 'development'];

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * 创建数据库连接池
   */
  async createPool() {
    try {
      this.pool = mysql.createPool({
        ...currentConfig,
        waitForConnections: true,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });

      // 测试连接
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      this.isConnected = true;
      console.log('✅ MySQL数据库连接成功');
      console.log(`📊 数据库: ${currentConfig.database}@${currentConfig.host}:${currentConfig.port}`);
      
      return this.pool;
    } catch (error) {
      this.isConnected = false;
      console.error('❌ MySQL数据库连接失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取数据库连接
   */
  async getConnection() {
    if (!this.pool) {
      throw new Error('数据库连接池未初始化');
    }
    return await this.pool.getConnection();
  }

  /**
   * 执行查询
   */
  async query(sql, params = []) {
    try {
      const [rows, fields] = await this.pool.query(sql, params);
      return [rows, fields];
    } catch (error) {
      logger.error('数据库查询错误:', error);
      throw error;
    }
  }

  /**
   * 执行事务
   */
  async transaction(callback) {
    const connection = await this.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 检查连接状态
   */
  async checkConnection() {
    try {
      const connection = await this.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 关闭连接池
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('🔌 MySQL数据库连接已关闭');
    }
  }

  /**
   * 获取连接状态
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      config: {
        host: currentConfig.host,
        port: currentConfig.port,
        database: currentConfig.database,
        user: currentConfig.user
      }
    };
  }
}

// 创建单例实例
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;
