// Redis连接模块
const redis = require('redis');
require('dotenv').config();

class RedisConnection {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB) || 0,
      prefix: process.env.REDIS_PREFIX || 'showcase:',
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null
    };
  }

  /**
   * 创建Redis连接
   */
  async connect() {
    try {
      this.client = redis.createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
          connectTimeout: 10000,
          lazyConnect: true
        },
        password: this.config.password,
        database: this.config.db
      });

      // 监听连接事件
      this.client.on('connect', () => {
        console.log('🔄 Redis正在连接...');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        console.log('✅ Redis连接成功');
        console.log(`📊 Redis: ${this.config.host}:${this.config.port} (DB: ${this.config.db})`);
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        console.error('❌ Redis连接错误:', error.message);
      });

      this.client.on('end', () => {
        this.isConnected = false;
        console.log('🔌 Redis连接已断开');
      });

      // 连接到Redis
      await this.client.connect();
      
      return this.client;
    } catch (error) {
      this.isConnected = false;
      console.error('❌ Redis连接失败:', error.message);
      throw error;
    }
  }

  /**
   * 设置键值对
   */
  async set(key, value, expireSeconds = null) {
    try {
      const fullKey = this.config.prefix + key;
      if (expireSeconds) {
        return await this.client.setEx(fullKey, expireSeconds, JSON.stringify(value));
      } else {
        return await this.client.set(fullKey, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Redis SET错误:', error);
      throw error;
    }
  }

  /**
   * 获取值
   */
  async get(key) {
    try {
      const fullKey = this.config.prefix + key;
      const value = await this.client.get(fullKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET错误:', error);
      throw error;
    }
  }

  /**
   * 删除键
   */
  async del(key) {
    try {
      const fullKey = this.config.prefix + key;
      return await this.client.del(fullKey);
    } catch (error) {
      console.error('Redis DEL错误:', error);
      throw error;
    }
  }

  /**
   * 检查键是否存在
   */
  async exists(key) {
    try {
      const fullKey = this.config.prefix + key;
      return await this.client.exists(fullKey);
    } catch (error) {
      console.error('Redis EXISTS错误:', error);
      throw error;
    }
  }

  /**
   * 设置过期时间
   */
  async expire(key, seconds) {
    try {
      const fullKey = this.config.prefix + key;
      return await this.client.expire(fullKey, seconds);
    } catch (error) {
      console.error('Redis EXPIRE错误:', error);
      throw error;
    }
  }

  /**
   * 获取剩余过期时间
   */
  async ttl(key) {
    try {
      const fullKey = this.config.prefix + key;
      return await this.client.ttl(fullKey);
    } catch (error) {
      console.error('Redis TTL错误:', error);
      throw error;
    }
  }

  /**
   * 清空当前数据库
   */
  async flushdb() {
    try {
      return await this.client.flushDb();
    } catch (error) {
      console.error('Redis FLUSHDB错误:', error);
      throw error;
    }
  }

  /**
   * 获取Redis信息
   */
  async info() {
    try {
      return await this.client.info();
    } catch (error) {
      console.error('Redis INFO错误:', error);
      throw error;
    }
  }

  /**
   * 检查连接状态
   */
  async ping() {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  /**
   * 关闭连接
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      console.log('🔌 Redis连接已关闭');
    }
  }

  /**
   * 获取连接状态
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      config: {
        host: this.config.host,
        port: this.config.port,
        db: this.config.db,
        prefix: this.config.prefix
      }
    };
  }
}

// 创建单例实例
const redisConnection = new RedisConnection();

module.exports = redisConnection;
