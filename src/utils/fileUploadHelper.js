/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-10-03 16:08:00
 * @LastEditors: JingChengCool jingchengcool@outlook.com
 * @LastEditTime: 2025-10-03 16:08:00
 * @FilePath: \showcase-backend-node\src\utils\fileUploadHelper.js
 * @Description: 文件上传处理工具
 */
const path = require('path');
const fs = require('fs');

// 支持的图片格式
const SUPPORTED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
// 最大文件大小 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * 验证文件是否为支持的图片格式
 * @param {String} filename 文件名
 * @returns {Boolean} 是否为支持的格式
 */
function isValidImageFormat(filename) {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_IMAGE_FORMATS.includes(ext);
}

/**
 * 验证文件大小是否超出限制
 * @param {Number} fileSize 文件大小（字节）
 * @returns {Boolean} 是否为有效文件大小
 */
function isValidFileSize(fileSize) {
  return fileSize <= MAX_FILE_SIZE;
}

/**
 * 从文件名提取商品名称
 * @param {String} originalName 原始文件名
 * @returns {String} 提取的商品名称
 */
function extractProductNameFromFilename(originalName) {
  if (!originalName) return '商品';
  
  // 移除文件扩展名
  let name = path.parse(originalName).name;
  
  // 移除常见的前缀和数字
  name = name.replace(/^(?:image|img|photo|picture|product|goods)?[_\-\.]?\d*[_\-\.]/, '');
  
  // 移除后缀中的数字
  name = name.replace(/[_\-\.]\d+$/, '');
  
  // 替换连字符、下划线和点号为空格
  name = name.replace(/[_\-\.]+/g, ' ');
  
  // 移除多余空格并转为小写
  name = name.trim().replace(/\s+/g, ' ').toLowerCase();
  
  // 如果处理后的名称为空，使用默认值
  if (!name) {
    // 使用时间戳生成唯一名称
    const timestamp = Date.now();
    name = `商品_${timestamp}`;
  }
  
  return name;
}

/**
 * 验证上传的文件数组
 * @param {Array} files 文件数组
 * @returns {Object} 验证结果 {valid, errors, validFiles}
 */
function validateUploadedFiles(files) {
  const errors = [];
  const validFiles = [];
  
  if (!files || files.length === 0) {
    errors.push('至少需要上传一张图片');
    return { valid: false, errors, validFiles: [] };
  }
  
  if (files.length > 100) {
    errors.push('单次最多只能上传100张图片');
    return { valid: false, errors, validFiles: [] };
  }
  
  files.forEach((file, index) => {
    const errorPrefix = `第${index + 1}张图片(${file.originalname || '未知文件名'}):`;
    
    // 验证文件格式
    if (!isValidImageFormat(file.originalname)) {
      errors.push(`${errorPrefix} 不支持的图片格式，仅支持 ${SUPPORTED_IMAGE_FORMATS.join(', ')}`);
      return;
    }
    
    // 验证文件大小
    if (!isValidFileSize(file.size)) {
      errors.push(`${errorPrefix} 文件过大，单张图片不能超过 ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }
    
    // 验证文件是否损坏（简单检查）
    if (file.buffer && file.buffer.length === 0) {
      errors.push(`${errorPrefix} 文件内容为空或已损坏`);
      return;
    }
    
    validFiles.push(file);
  });
  
  return {
    valid: errors.length === 0,
    errors,
    validFiles
  };
}

/**
 * 生成文件保存路径
 * @param {String} originalName 原始文件名
 * @param {String} uploadDir 上传目录
 * @returns {String} 完整的文件保存路径
 */
function generateFilePath(originalName, uploadDir) {
  const ext = path.extname(originalName).toLowerCase();
  const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
  return path.join(uploadDir, filename);
}

/**
 * 保存文件到指定路径
 * @param {Buffer} buffer 文件缓冲区
 * @param {String} filePath 文件保存路径
 * @returns {Promise<String>} 文件保存路径
 */
async function saveFile(buffer, filePath) {
  return new Promise((resolve, reject) => {
    try {
      // 确保目录存在
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFile(filePath, buffer, (err) => {
        if (err) {
          reject(new Error(`文件保存失败: ${err.message}`));
        } else {
          resolve(filePath);
        }
      });
    } catch (error) {
      reject(new Error(`文件保存失败: ${error.message}`));
    }
  });
}

/**
 * 删除文件
 * @param {String} filePath 文件路径
 */
function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`删除文件失败: ${filePath}`, error);
  }
}

module.exports = {
  extractProductNameFromFilename,
  validateUploadedFiles,
  generateFilePath,
  saveFile,
  deleteFile,
  SUPPORTED_IMAGE_FORMATS,
  MAX_FILE_SIZE
};
