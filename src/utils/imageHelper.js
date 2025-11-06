/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-11-06
 * @Description: 图片处理工具函数
 */

const sharp = require('sharp'); // 图片处理库
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class ImageHelper {
  /**
   * 加载图片并转换为Buffer
   * @param {string} imageUrl - 图片URL或路径
   * @param {number} targetWidth - 目标宽度（像素，考虑高DPI）
   * @param {number} targetHeight - 目标高度（像素，考虑高DPI）
   * @param {Object} options - 选项
   * @param {number} options.quality - JPEG质量（默认95）
   * @param {boolean} options.allowEnlargement - 是否允许放大（默认true）
   * @returns {Promise<Buffer>} 图片Buffer
   */
  static async loadImage(imageUrl, targetWidth = 400, targetHeight = 400, options = {}) {
    try {
      const { quality = 95, allowEnlargement = true } = options;
      let imageBuffer;

      // 判断是本地路径还是URL
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        // 网络图片：使用axios下载
        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 10000 // 10秒超时
        });
        imageBuffer = Buffer.from(response.data);
      } else {
        // 本地图片：读取文件
        // 处理相对路径（从uploads目录开始）
        let filePath = imageUrl;
        if (imageUrl.startsWith('/uploads/')) {
          filePath = path.join(__dirname, '../../', imageUrl);
        } else if (!path.isAbsolute(imageUrl)) {
          filePath = path.join(__dirname, '../../uploads', imageUrl);
        }

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
          throw new Error(`图片文件不存在: ${filePath}`);
        }

        imageBuffer = fs.readFileSync(filePath);
      }

      // 使用sharp处理图片（调整尺寸、高质量输出）
      // 先flatten处理透明背景，转换为白色背景
      const resizeOptions = {
        fit: 'inside', // 保持宽高比，确保图片完全在指定尺寸内
        withoutEnlargement: !allowEnlargement // 根据参数决定是否允许放大
      };

      const processedImage = await sharp(imageBuffer)
        .resize(targetWidth, targetHeight, resizeOptions)
        .flatten({ background: { r: 255, g: 255, b: 255 } }) // 将透明背景转换为白色
        .jpeg({ quality: quality }) // 转换为JPEG格式，高质量输出
        .toBuffer();

      return processedImage;
    } catch (error) {
      console.error('加载图片失败:', error.message);
      // 返回一个占位图Buffer（可选）
      return null;
    }
  }

  /**
   * 获取图片尺寸
   * @param {string} imageUrl - 图片URL或路径
   * @returns {Promise<{width: number, height: number}>} 图片尺寸
   */
  static async getImageSize(imageUrl) {
    try {
      let imageBuffer;

      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 10000
        });
        imageBuffer = Buffer.from(response.data);
      } else {
        let filePath = imageUrl;
        if (imageUrl.startsWith('/uploads/')) {
          filePath = path.join(__dirname, '../../', imageUrl);
        } else if (!path.isAbsolute(imageUrl)) {
          filePath = path.join(__dirname, '../../uploads', imageUrl);
        }

        if (!fs.existsSync(filePath)) {
          throw new Error(`图片文件不存在: ${filePath}`);
        }

        imageBuffer = fs.readFileSync(filePath);
      }

      const metadata = await sharp(imageBuffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height
      };
    } catch (error) {
      console.error('获取图片尺寸失败:', error.message);
      return { width: 0, height: 0 };
    }
  }

  /**
   * 加载背景图片（专门用于PDF背景，会填充整个页面）
   * @param {string} imageUrl - 图片URL或路径
   * @param {number} targetWidth - 目标宽度
   * @param {number} targetHeight - 目标高度
   * @returns {Promise<Buffer>} 图片Buffer
   */
  static async loadBackgroundImage(imageUrl, targetWidth, targetHeight) {
    try {
      let imageBuffer;

      // 判断是本地路径还是URL
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        // 网络图片：使用axios下载
        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 10000 // 10秒超时
        });
        imageBuffer = Buffer.from(response.data);
      } else {
        // 本地图片：读取文件
        // 处理相对路径（从uploads目录开始）
        let filePath = imageUrl;
        if (imageUrl.startsWith('/uploads/')) {
          filePath = path.join(__dirname, '../../', imageUrl);
        } else if (!path.isAbsolute(imageUrl)) {
          filePath = path.join(__dirname, '../../uploads', imageUrl);
        }

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
          throw new Error(`背景图片文件不存在: ${filePath}`);
        }

        imageBuffer = fs.readFileSync(filePath);
      }

      // 使用sharp处理背景图片
      // 使用cover模式填充整个页面，允许放大
      const processedImage = await sharp(imageBuffer)
        .resize(targetWidth, targetHeight, {
          fit: 'cover', // 覆盖整个区域，可能会裁剪
          position: 'center' // 居中裁剪
        })
        .jpeg({ quality: 90 }) // 转换为JPEG格式，质量90%（背景图需要更高质量）
        .toBuffer();

      console.log(`背景图片处理完成，目标尺寸: ${targetWidth}x${targetHeight}, 输出大小: ${processedImage.length} bytes`);
      return processedImage;
    } catch (error) {
      console.error('加载背景图片失败:', error.message);
      console.error(error.stack);
      return null;
    }
  }

  /**
   * 加载原始图片，不进行任何压缩或格式转换
   * @param {string} imageUrl - 图片URL或路径
   * @returns {Promise<Buffer>} 原始图片Buffer
   */
  static async loadOriginalImage(imageUrl) {
    try {
      let imageBuffer;

      // 判断是本地路径还是URL
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        // 网络图片：使用axios下载
        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 10000 // 10秒超时
        });
        imageBuffer = Buffer.from(response.data);
      } else {
        // 本地图片：读取文件
        // 处理相对路径（从uploads目录开始）
        let filePath = imageUrl;
        if (imageUrl.startsWith('/uploads/')) {
          filePath = path.join(__dirname, '../../', imageUrl);
        } else if (!path.isAbsolute(imageUrl)) {
          filePath = path.join(__dirname, '../../uploads', imageUrl);
        }

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
          throw new Error(`图片文件不存在: ${filePath}`);
        }

        imageBuffer = fs.readFileSync(filePath);
      }

      // 直接返回原始图片Buffer，不进行任何处理
      return imageBuffer;
    } catch (error) {
      console.error('加载原始图片失败:', error.message);
      return null;
    }
  }

  /**
   * 创建占位图Buffer（当图片加载失败时使用）
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {string} text - 占位文本
   * @returns {Promise<Buffer>} 占位图Buffer
   */
  static async createPlaceholder(width, height, text = '图片加载失败') {
    try {
      const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f0f0f0"/>
          <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#999" text-anchor="middle" dominant-baseline="middle">${text}</text>
        </svg>
      `;
      
      const buffer = Buffer.from(svg);
      return await sharp(buffer).jpeg({ quality: 80 }).toBuffer();
    } catch (error) {
      console.error('创建占位图失败:', error.message);
      return null;
    }
  }
}

module.exports = ImageHelper;

