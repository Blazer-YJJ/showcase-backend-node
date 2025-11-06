/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-11-06
 * @Description: PDF导出服务
 */

const fs = require('fs');
const path = require('path');
const PDFHelper = require('../utils/pdfHelper');
const ImageHelper = require('../utils/imageHelper');
const PdfConfig = require('../models/PdfConfig');
const AboutUs = require('../models/AboutUs');
const Product = require('../models/Product');

class PDFExportService {
  /**
   * 清理文件名，移除不允许的字符
   * @param {string} filename - 原始文件名
   * @returns {string} 清理后的文件名
   */
  static sanitizeFilename(filename) {
    // 移除或替换不允许的字符：< > : " / \ | ? *
    return filename.replace(/[<>:"/\\|?*]/g, '_').trim();
  }

  /**
   * 导出全部商品PDF
   * @returns {Promise<Object>} 返回文件信息对象 {pdfName, pdfPath, generatedTime}
   */
  static async exportAllProducts() {
    try {
      // 获取PDF配置（优先使用PDF配置）
      const pdfConfig = await PdfConfig.findActive();
      
      // 如果PDF配置存在且启用，使用配置中的公司名称；否则从AboutUs获取
      let companyName, titleCompanyName;
      if (pdfConfig && pdfConfig.is_active === 1) {
        companyName = pdfConfig.pdf_file_company_name;
        titleCompanyName = pdfConfig.pdf_title_company_name;
      } else {
        const aboutUs = await AboutUs.findActive();
        companyName = aboutUs ? aboutUs.company_name : '公司';
        titleCompanyName = companyName;
      }
      
      // 获取所有商品（不分页）
      const products = await Product.findAllForExport();
      
      // 生成PDF Buffer（传递PDF配置）
      const pdfBuffer = await this.generatePDF(products, `${titleCompanyName}珠宝-全部商品-PDF文件`, pdfConfig);
      
      // 保存PDF文件
      const exportType = '全部款式';
      const timestamp = Date.now();
      const pdfName = this.sanitizeFilename(`${companyName}-${exportType}-${timestamp}.pdf`);
      const pdfPath = await this.savePDF(pdfBuffer, pdfName);
      const generatedTime = new Date().toISOString();
      
      return {
        pdfName,
        pdfPath,
        generatedTime
      };
    } catch (error) {
      console.error('导出全部商品PDF失败:', error);
      throw error;
    }
  }

  /**
   * 导出指定分类的商品PDF
   * @param {number} categoryId - 分类ID
   * @returns {Promise<Object>} 返回文件信息对象 {pdfName, pdfPath, generatedTime}
   */
  static async exportProductsByCategory(categoryId) {
    try {
      // 获取PDF配置（优先使用PDF配置）
      const pdfConfig = await PdfConfig.findActive();
      
      // 如果PDF配置存在且启用，使用配置中的公司名称；否则从AboutUs获取
      let companyName, titleCompanyName;
      if (pdfConfig && pdfConfig.is_active === 1) {
        companyName = pdfConfig.pdf_file_company_name;
        titleCompanyName = pdfConfig.pdf_title_company_name;
      } else {
        const aboutUs = await AboutUs.findActive();
        companyName = aboutUs ? aboutUs.company_name : '公司';
        titleCompanyName = companyName;
      }
      
      // 获取分类信息
      const dbConnection = require('../config/dbConnection');
      const [categoryRows] = await dbConnection.query(
        'SELECT name FROM categories WHERE category_id = ?',
        [categoryId]
      );
      
      if (categoryRows.length === 0) {
        throw new Error('分类不存在');
      }
      
      const categoryName = categoryRows[0].name;
      
      // 获取该分类下的所有商品
      const products = await Product.findAllForExport({ category_id: categoryId });
      
      // 生成PDF Buffer（传递PDF配置）
      const pdfBuffer = await this.generatePDF(products, `${titleCompanyName}珠宝-${categoryName}-PDF文件`, pdfConfig);
      
      // 保存PDF文件
      const exportType = this.sanitizeFilename(categoryName);
      const timestamp = Date.now();
      const pdfName = this.sanitizeFilename(`${companyName}-${exportType}-${timestamp}.pdf`);
      const pdfPath = await this.savePDF(pdfBuffer, pdfName);
      const generatedTime = new Date().toISOString();
      
      return {
        pdfName,
        pdfPath,
        generatedTime
      };
    } catch (error) {
      console.error('导出分类商品PDF失败:', error);
      throw error;
    }
  }

  /**
   * 导出搜索结果的商品PDF
   * @param {string} keyword - 搜索关键词
   * @param {string} sort - 排序字段
   * @param {string} order - 排序方向
   * @returns {Promise<Object>} 返回文件信息对象 {pdfName, pdfPath, generatedTime}
   */
  static async exportProductsBySearch(keyword, sort = 'created_at', order = 'desc') {
    try {
      // 获取PDF配置（优先使用PDF配置）
      const pdfConfig = await PdfConfig.findActive();
      
      // 如果PDF配置存在且启用，使用配置中的公司名称；否则从AboutUs获取
      let companyName, titleCompanyName;
      if (pdfConfig && pdfConfig.is_active === 1) {
        companyName = pdfConfig.pdf_file_company_name;
        titleCompanyName = pdfConfig.pdf_title_company_name;
      } else {
        const aboutUs = await AboutUs.findActive();
        companyName = aboutUs ? aboutUs.company_name : '公司';
        titleCompanyName = companyName;
      }
      
      // 搜索商品（获取所有结果，不分页）
      const products = await Product.searchForExport({
        keyword: keyword.trim(),
        sort,
        order: order.toLowerCase()
      });
      
      // 生成PDF Buffer（传递PDF配置）
      const pdfBuffer = await this.generatePDF(products, `${titleCompanyName}珠宝-搜索导出-PDF文件`, pdfConfig);
      
      // 保存PDF文件
      const exportType = '导出结果';
      const timestamp = Date.now();
      const pdfName = this.sanitizeFilename(`${companyName}-${exportType}-${timestamp}.pdf`);
      const pdfPath = await this.savePDF(pdfBuffer, pdfName);
      const generatedTime = new Date().toISOString();
      
      return {
        pdfName,
        pdfPath,
        generatedTime
      };
    } catch (error) {
      console.error('导出搜索商品PDF失败:', error);
      throw error;
    }
  }

  /**
   * 保存PDF文件到磁盘
   * @param {Buffer} pdfBuffer - PDF文件Buffer
   * @param {string} filename - 文件名
   * @returns {Promise<string>} 返回相对路径
   */
  static async savePDF(pdfBuffer, filename) {
    return new Promise((resolve, reject) => {
      try {
        // 确保uploads/pdfs目录存在
        const uploadsDir = path.join(__dirname, '../../uploads');
        const pdfsDir = path.join(uploadsDir, 'pdfs');
        
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        if (!fs.existsSync(pdfsDir)) {
          fs.mkdirSync(pdfsDir, { recursive: true });
        }
        
        // 如果文件已存在，添加时间戳
        let finalFilename = filename;
        const filePath = path.join(pdfsDir, finalFilename);
        
        if (fs.existsSync(filePath)) {
          const timestamp = Date.now();
          const nameWithoutExt = path.parse(filename).name;
          const ext = path.parse(filename).ext;
          finalFilename = `${nameWithoutExt}_${timestamp}${ext}`;
        }
        
        // 写入文件
        const finalPath = path.join(pdfsDir, finalFilename);
        fs.writeFileSync(finalPath, pdfBuffer);
        
        // 返回相对路径
        const relativePath = `/uploads/pdfs/${finalFilename}`;
        resolve(relativePath);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 生成PDF文档
   * @param {Array} products - 商品列表
   * @param {string} title - PDF标题
   * @param {Object} pdfConfig - PDF配置对象（可选）
   * @returns {Promise<Buffer>} PDF Buffer
   */
  static async generatePDF(products, title, pdfConfig = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = PDFHelper.createDocument();
        const chunks = [];

        // 监听数据流
        doc.on('data', (chunk) => {
          chunks.push(chunk);
        });

        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });

        doc.on('error', (error) => {
          reject(error);
        });

        // 从配置获取每行商品数量，默认为2
        const productsPerRow = (pdfConfig && pdfConfig.products_per_row) ? parseInt(pdfConfig.products_per_row) : 2;
        const rowsPerPage = 3; // 每页3行
        const productsPerPage = productsPerRow * rowsPerPage; // 每页商品数量（2列×3行=6 或 3列×3行=9）

        // 计算分页信息
        const totalCount = products.length;
        const totalPages = Math.max(1, Math.ceil(totalCount / productsPerPage));

        // 页面尺寸（A4）
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const marginLeft = doc.page.margins.left;
        const marginRight = doc.page.margins.right;
        const marginTop = doc.page.margins.top;
        const marginBottom = doc.page.margins.bottom;

        // 可用区域
        const usableWidth = pageWidth - marginLeft - marginRight;
        const usableHeight = pageHeight - marginTop - marginBottom;

        // 卡片尺寸（根据每行商品数量动态计算）
        const cardWidth = usableWidth / productsPerRow; // 无间距，直接平分
        const cardHeight = (usableHeight - 100) / rowsPerPage; // 减去标题和信息栏高度

        // 加载背景图片（如果配置中有）
        let backgroundImageBuffer = null;
        if (pdfConfig && pdfConfig.pdf_background_image) {
          try {
            console.log('正在加载背景图片:', pdfConfig.pdf_background_image);
            console.log('页面尺寸:', pageWidth, 'x', pageHeight);
            // 使用专门的方法加载背景图，会填充整个页面
            backgroundImageBuffer = await ImageHelper.loadBackgroundImage(
              pdfConfig.pdf_background_image, 
              Math.round(pageWidth), 
              Math.round(pageHeight)
            );
            if (backgroundImageBuffer) {
              console.log('背景图片加载成功，大小:', backgroundImageBuffer.length, 'bytes');
            } else {
              console.warn('背景图片加载返回null');
            }
          } catch (error) {
            console.error('加载背景图片失败:', error.message);
            console.error(error.stack);
          }
        } else {
          console.log('未配置背景图片或PDF配置不存在');
          if (!pdfConfig) {
            console.log('PDF配置对象为null');
          } else if (!pdfConfig.pdf_background_image) {
            console.log('PDF配置中未设置背景图片路径');
          }
        }

        let currentPage = 1;
        let productIndex = 0;
        let startY = 0; // 信息栏后的起始Y坐标

        // 添加第一页的背景图片（如果有，先添加作为底层）
        if (backgroundImageBuffer) {
          PDFHelper.addBackgroundImage(doc, backgroundImageBuffer, pageWidth, pageHeight);
        }

        // 添加第一页的标题和信息栏
        PDFHelper.addTitle(doc, title);
        PDFHelper.addInfoBar(doc, {
          totalCount,
          currentPage,
          totalPages,
          generatedTime: new Date().toLocaleString('zh-CN')
        });
        startY = doc.y; // 记录信息栏后的起始Y坐标

        // 处理每个商品
        for (let i = 0; i < products.length; i++) {
          const product = products[i];
          
          // 检查是否需要新页面
          if (productIndex > 0 && productIndex % productsPerPage === 0) {
            // 需要新页面（不显示标题，只显示信息栏）
            currentPage++;
            doc.addPage();
            
            // 添加背景图片（如果有，先添加作为底层）
            if (backgroundImageBuffer) {
              PDFHelper.addBackgroundImage(doc, backgroundImageBuffer, pageWidth, pageHeight);
            }
            
            // 新页面不显示标题，只显示信息栏
            PDFHelper.addInfoBar(doc, {
              totalCount,
              currentPage,
              totalPages,
              generatedTime: new Date().toLocaleString('zh-CN')
            });
            startY = doc.y; // 重新记录新页面的起始Y坐标
            productIndex = 0;
          }

          // 计算当前商品在页面中的位置
          const row = Math.floor((productIndex % productsPerPage) / productsPerRow); // 当前行（0, 1, 2）
          const col = productIndex % productsPerRow; // 当前列（0, 1 或 0, 1, 2）

          // 计算卡片位置（无间距）
          const x = marginLeft + col * cardWidth;
          const y = startY + row * cardHeight;

          // 获取商品主图（使用原图，不压缩）
          // 计算图片在PDF中的实际显示尺寸（点）
          const imageWidthPoints = cardWidth - 10; // 减去padding
          const imageHeightPoints = cardHeight * 0.6; // 图片占卡片高度的60%
          
          let imageBuffer = null;
          if (product.images && product.images.length > 0) {
            // 优先使用主图，否则使用第一张图片
            const mainImage = product.images.find(img => img.image_type === 'main') || product.images[0];
            if (mainImage && mainImage.image_url) {
              try {
                // 直接加载原始图片，不进行任何压缩或格式转换
                imageBuffer = await ImageHelper.loadOriginalImage(mainImage.image_url);
                if (!imageBuffer) {
                  throw new Error('图片加载返回null');
                }
              } catch (error) {
                console.error(`加载商品 ${product.product_id} 的图片失败:`, error.message);
                imageBuffer = await ImageHelper.createPlaceholder(
                  Math.round(imageWidthPoints), 
                  Math.round(imageHeightPoints), 
                  '图片加载失败'
                );
              }
            }
          }

          // 如果没有图片，创建占位图
          if (!imageBuffer) {
            imageBuffer = await ImageHelper.createPlaceholder(
              Math.round(imageWidthPoints), 
              Math.round(imageHeightPoints), 
              '暂无图片'
            );
          }

          // 添加商品卡片
          await PDFHelper.addProductCard(doc, product, x, y, cardWidth, cardHeight, imageBuffer);

          productIndex++;
        }

        // 结束文档
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PDFExportService;

