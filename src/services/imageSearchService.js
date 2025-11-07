/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-01-28 15:30:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-01-28 15:30:00
 * @FilePath: \showcase-backend-node\src\services\imageSearchService.js
 * @Description: 百度图像搜索服务
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const baiduConfig = require('../config/baiduConfig');

class ImageSearchService {
  constructor() {
    // 百度API配置
    this.apiKey = baiduConfig.apiKey;
    this.secretKey = baiduConfig.secretKey;
    this.appId = baiduConfig.appId;
    this.appName = baiduConfig.appName;
    this.accessToken = null;
    this.tokenExpireTime = null;
    
    // 百度API端点
    this.tokenUrl = baiduConfig.tokenUrl;
    this.similarAddUrl = baiduConfig.similarAddUrl;
    this.similarSearchUrl = baiduConfig.similarSearchUrl;
    this.similarDeleteUrl = baiduConfig.similarDeleteUrl;
  }

  /**
   * 获取百度API访问令牌
   */
  async getAccessToken() {
    // 检查API密钥是否配置
    if (!this.apiKey || !this.secretKey) {
      throw new Error('百度API密钥未配置，请在src/config/baiduConfig.js中设置apiKey和secretKey');
    }

    // 如果token未过期，直接返回缓存的token
    if (this.accessToken && this.tokenExpireTime && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    try {
      // 百度API获取token使用POST请求，参数作为query参数传递
      const params = {
        grant_type: 'client_credentials',
        client_id: this.apiKey,
        client_secret: this.secretKey
      };
      
      const response = await axios.post(this.tokenUrl, null, {
        params: params
      });

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        // token有效期30天，提前1小时刷新
        const expiresIn = (response.data.expires_in || 2592000) * 1000 - 3600000;
        this.tokenExpireTime = Date.now() + expiresIn;
        return this.accessToken;
      } else if (response.data && response.data.error) {
        // 百度API返回的错误信息
        throw new Error(`获取access_token失败: ${response.data.error} - ${response.data.error_description || ''}`);
      } else {
        throw new Error('获取access_token失败: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      // 详细错误信息
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.error) {
          throw new Error(`获取百度API访问令牌失败: ${errorData.error} - ${errorData.error_description || errorData.error_msg || ''}`);
        }
        throw new Error(`获取百度API访问令牌失败: ${JSON.stringify(errorData)}`);
      }
      throw new Error(`获取百度API访问令牌失败: ${error.message}`);
    }
  }

  /**
   * 将图片转换为base64编码
   * @param {string|Buffer} imageSource - 图片路径、URL或Buffer
   * @returns {Promise<string>} base64编码的图片
   */
  async imageToBase64(imageSource) {
    try {
      // 如果是Buffer，直接转换
      if (Buffer.isBuffer(imageSource)) {
        return imageSource.toString('base64');
      }

      // 如果是URL，下载图片
      if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
        const response = await axios.get(imageSource, {
          responseType: 'arraybuffer'
        });
        return Buffer.from(response.data).toString('base64');
      }

      // 如果是本地文件路径（绝对路径）
      if (fs.existsSync(imageSource)) {
        const imageBuffer = fs.readFileSync(imageSource);
        return imageBuffer.toString('base64');
      }

      // 处理相对路径或以/uploads/开头的路径
      let relativePath = imageSource;
      
      // 如果路径以/uploads/开头，去掉开头的/，使其成为相对路径
      if (relativePath.startsWith('/uploads/')) {
        relativePath = relativePath.substring(1); // 去掉开头的/
      }
      
      // 构建完整的文件路径
      const uploadPath = path.resolve(__dirname, '../../', relativePath);
      
      if (fs.existsSync(uploadPath)) {
        const imageBuffer = fs.readFileSync(uploadPath);
        return imageBuffer.toString('base64');
      }

      throw new Error('无法读取图片: ' + imageSource + ' (尝试路径: ' + uploadPath + ')');
    } catch (error) {
      throw new Error(`图片转换失败: ${error.message}`);
    }
  }

  /**
   * 添加图片到百度图库（入库）
   * @param {string|Buffer} imageSource - 图片路径、URL或Buffer
   * @param {string} brief - 图片摘要信息（用于检索结果匹配，建议传入商品ID）
   * @returns {Promise<Object>} 返回cont_sign等信息
   */
  async addImage(imageSource, brief) {
    try {
      const accessToken = await this.getAccessToken();
      const imageBase64 = await this.imageToBase64(imageSource);

      // 使用URLSearchParams构建表单数据
      const params = new URLSearchParams();
      params.append('image', imageBase64);
      params.append('brief', brief || '');

      const url = `${this.similarAddUrl}?access_token=${accessToken}`;
      
      const response = await axios.post(url, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data && response.data.cont_sign) {
        return {
          success: true,
          cont_sign: response.data.cont_sign,
          log_id: response.data.log_id
        };
      } else {
        throw new Error('图片入库失败: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      if (error.response && error.response.data) {
        throw new Error(`图片入库失败: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`图片入库失败: ${error.message}`);
    }
  }

  /**
   * 搜索相似图片
   * @param {string|Buffer} imageSource - 图片路径、URL或Buffer
   * @param {number} pn - 分页页码，默认为0
   * @param {number} rn - 每页返回数量，默认为10，最多10
   * @returns {Promise<Array>} 返回相似图片列表
   */
  async searchSimilarImages(imageSource, pn = 0, rn = 10) {
    try {
      const accessToken = await this.getAccessToken();
      const imageBase64 = await this.imageToBase64(imageSource);

      // 使用URLSearchParams构建表单数据
      const params = new URLSearchParams();
      params.append('image', imageBase64);
      params.append('pn', pn.toString());
      params.append('rn', Math.min(rn, 10).toString()); // 最多10条

      const url = `${this.similarSearchUrl}?access_token=${accessToken}`;
      
      const response = await axios.post(url, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data && response.data.result) {
        return {
          success: true,
          results: response.data.result || [],
          log_id: response.data.log_id
        };
      } else {
        throw new Error('图片搜索失败: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      if (error.response && error.response.data) {
        throw new Error(`图片搜索失败: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`图片搜索失败: ${error.message}`);
    }
  }

  /**
   * 从百度图库删除图片
   * @param {string} contSign - 图片签名
   * @returns {Promise<Object>} 删除结果
   */
  async deleteImage(contSign) {
    try {
      const accessToken = await this.getAccessToken();

      // 使用URLSearchParams构建表单数据
      const params = new URLSearchParams();
      params.append('cont_sign', contSign);

      const url = `${this.similarDeleteUrl}?access_token=${accessToken}`;
      
      const response = await axios.post(url, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data && response.data.log_id) {
        return {
          success: true,
          log_id: response.data.log_id
        };
      } else {
        throw new Error('图片删除失败: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      if (error.response && error.response.data) {
        throw new Error(`图片删除失败: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`图片删除失败: ${error.message}`);
    }
  }
}

module.exports = new ImageSearchService();

