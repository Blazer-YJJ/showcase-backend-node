/*
 * @Author: JingChengCool jingchengcool@outlook.com
 * @Date: 2025-11-06
 * @Description: PDF工具函数
 */

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const os = require('os');

class PDFHelper {
  /**
   * 获取中文字体路径
   * @returns {string|null} 字体文件路径，如果找不到则返回null
   */
  static getChineseFontPath() {
    const platform = os.platform();
    let fontPaths = [];

    if (platform === 'win32') {
      // Windows系统字体路径（优先使用TTF文件，因为PDFKit对TTF支持更好）
      const windowsFontsDir = path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts');
      fontPaths = [
        path.join(windowsFontsDir, 'simhei.ttf'), // 黑体（TTF格式，优先）
        path.join(windowsFontsDir, 'simsun.ttf'), // 宋体（TTF格式）
        path.join(windowsFontsDir, 'msyh.ttf'), // 微软雅黑（TTF格式，如果存在）
        path.join(windowsFontsDir, 'simsun.ttc'), // 宋体（TTC格式，备用）
        path.join(windowsFontsDir, 'msyh.ttc'), // 微软雅黑（TTC格式，备用）
      ];
    } else if (platform === 'darwin') {
      // macOS系统字体路径
      fontPaths = [
        '/System/Library/Fonts/PingFang.ttc',
        '/System/Library/Fonts/STHeiti Light.ttc',
        '/Library/Fonts/Arial Unicode.ttf',
      ];
    } else {
      // Linux系统字体路径
      fontPaths = [
        '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc',
        '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
        '/usr/share/fonts/truetype/arphic/uming.ttc',
      ];
    }

    // 查找第一个存在的字体文件
    for (const fontPath of fontPaths) {
      if (fs.existsSync(fontPath)) {
        return fontPath;
      }
    }

    return null;
  }

  /**
   * 注册中文字体到PDF文档
   * @param {PDFDocument} doc - PDF文档实例
   * @returns {boolean} 是否成功注册
   */
  static registerChineseFont(doc) {
    const fontPath = this.getChineseFontPath();
    
    if (fontPath) {
      try {
        // 注册字体，命名为 'ChineseFont' 和 'ChineseFontBold'
        doc.registerFont('ChineseFont', fontPath);
        doc.registerFont('ChineseFontBold', fontPath);
        // 存储字体路径到文档对象，用于后续检查
        doc._chineseFontRegistered = true;
        console.log('中文字体注册成功:', fontPath);
        return true;
      } catch (error) {
        console.warn('注册中文字体失败，使用默认字体:', error.message);
        doc._chineseFontRegistered = false;
        return false;
      }
    } else {
      console.warn('未找到中文字体文件，使用默认字体');
      doc._chineseFontRegistered = false;
      return false;
    }
  }

  /**
   * 创建PDF文档实例
   * @param {Object} options - PDF选项
   * @returns {PDFDocument} PDF文档实例
   */
  static createDocument(options = {}) {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 15,
        bottom: 15,
        left: 15,
        right: 15
      },
      ...options
    });

    // 注册中文字体
    this.registerChineseFont(doc);

    return doc;
  }

  /**
   * 添加顶部标题
   * @param {PDFDocument} doc - PDF文档实例
   * @param {string} title - 标题文本
   */
  static addTitle(doc, title) {
    // 尝试使用中文字体，如果未注册则使用默认字体
    const fontName = doc._chineseFontRegistered ? 'ChineseFontBold' : 'Helvetica-Bold';
    
    doc.fontSize(20)
       .font(fontName)
       .text(title, {
         align: 'center',
         width: doc.page.width - doc.page.margins.left - doc.page.margins.right
       });
    
    doc.moveDown(0.5);
  }

  /**
   * 添加信息栏
   * @param {PDFDocument} doc - PDF文档实例
   * @param {Object} info - 信息对象
   * @param {number} info.totalCount - 商品总数
   * @param {number} info.currentPage - 当前页
   * @param {number} info.totalPages - 总页数
   * @param {string} info.generatedTime - 生成时间
   */
  static addInfoBar(doc, info) {
    const { totalCount, currentPage, totalPages, generatedTime } = info;
    
    // 尝试使用中文字体，如果未注册则使用默认字体
    const fontName = doc._chineseFontRegistered ? 'ChineseFont' : 'Helvetica';
    
    doc.fontSize(10)
       .font(fontName)
       .fillColor('#666666')
       .text(
         `商品总数: ${totalCount} | 第 ${currentPage} 页 / 共 ${totalPages} 页 | 生成时间: ${generatedTime}`,
         {
           align: 'center',
           width: doc.page.width - doc.page.margins.left - doc.page.margins.right
         }
       );
    
    doc.moveDown(0.5);
    // 添加分隔线
    doc.strokeColor('#cccccc')
       .lineWidth(0.5)
       .moveTo(doc.page.margins.left, doc.y)
       .lineTo(doc.page.width - doc.page.margins.right, doc.y)
       .stroke();
    
    doc.moveDown(0.5);
  }

  /**
   * 添加商品卡片
   * @param {PDFDocument} doc - PDF文档实例
   * @param {Object} product - 商品信息
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} width - 卡片宽度
   * @param {number} height - 卡片高度
   * @param {Buffer} imageBuffer - 图片Buffer
   */
  static async addProductCard(doc, product, x, y, width, height, imageBuffer) {
    const cardPadding = 5;
    
    // 根据卡片高度动态计算图片高度（图片占卡片高度的60%）
    const imageHeightPoints = height * 0.6;
    const textAreaHeight = height - imageHeightPoints - cardPadding * 2;
    
    const imageWidth = width - cardPadding * 2;
    const imageX = x + cardPadding;
    const imageY = y + cardPadding;
    const textStartY = y + imageHeightPoints + cardPadding;

    // 添加图片
    if (imageBuffer) {
      try {
        doc.image(imageBuffer, imageX, imageY, {
          width: imageWidth,
          height: imageHeightPoints,
          fit: [imageWidth, imageHeightPoints],
          align: 'center',
          valign: 'center'
        });
      } catch (error) {
        console.error('添加图片失败:', error.message);
        // 如果图片加载失败，显示占位文本
        const fontName = doc._chineseFontRegistered ? 'ChineseFont' : 'Helvetica';
        doc.fontSize(10)
           .font(fontName)
           .fillColor('#999999')
           .text('图片加载失败', imageX, imageY, {
             width: imageWidth,
             height: imageHeightPoints,
             align: 'center',
             valign: 'center'
           });
      }
    }

    // 计算文本区域可用高度
    const nameHeight = Math.min(18, textAreaHeight * 0.4);
    const categoryHeight = Math.min(14, textAreaHeight * 0.3);
    const paramsHeight = Math.min(12, textAreaHeight * 0.3);

    // 尝试使用中文字体，如果未注册则使用默认字体
    const fontName = doc._chineseFontRegistered ? 'ChineseFontBold' : 'Helvetica-Bold';
    const fontNameRegular = doc._chineseFontRegistered ? 'ChineseFont' : 'Helvetica';

    // 添加商品名称（居中，字体更大）
    doc.fontSize(14)
       .font(fontName)
       .fillColor('#000000')
       .text(product.name || '未命名商品', x + cardPadding, textStartY, {
         width: width - cardPadding * 2,
         height: nameHeight,
         align: 'center',
         ellipsis: true
       });

    // 添加分类信息（居中，字体更大）
    const categoryY = textStartY + nameHeight + 2;
    doc.fontSize(11)
       .font(fontNameRegular)
       .fillColor('#592620')
       .text(`分类: ${product.category_name || '未分类'}`, x + cardPadding, categoryY, {
         width: width - cardPadding * 2,
         height: categoryHeight,
         align: 'center',
         ellipsis: true
       });

    // 添加参数信息
    if (product.params && product.params.length > 0) {
      const paramsY = categoryY + categoryHeight + 2;
      let paramsText = '参数: ';
      const maxParams = 2; // 最多显示2个参数（因为空间有限）
      
      product.params.slice(0, maxParams).forEach((param, index) => {
        if (index > 0) paramsText += ' | ';
        paramsText += `${param.param_key}: ${param.param_value}`;
      });
      
      if (product.params.length > maxParams) {
        paramsText += ' ...';
      }

      // 尝试使用中文字体，如果未注册则使用默认字体
      const fontNameRegular = doc._chineseFontRegistered ? 'ChineseFont' : 'Helvetica';
      
      doc.fontSize(8)
         .font(fontNameRegular)
         .fillColor('#330302')
         .text(paramsText, x + cardPadding, paramsY, {
           width: width - cardPadding * 2,
           height: paramsHeight,
           align: 'center',
           ellipsis: true
         });
    }
  }

  /**
   * 添加页脚
   * @param {PDFDocument} doc - PDF文档实例
   * @param {number} currentPage - 当前页
   * @param {number} totalPages - 总页数
   */
  static addFooter(doc, currentPage, totalPages) {
    const footerY = doc.page.height - doc.page.margins.bottom - 10;
    
    // 尝试使用中文字体，如果未注册则使用默认字体
    const fontName = doc._chineseFontRegistered ? 'ChineseFont' : 'Helvetica';
    
    doc.fontSize(9)
       .font(fontName)
       .fillColor('#999999')
       .text(
         `第 ${currentPage} 页 / 共 ${totalPages} 页`,
         doc.page.margins.left,
         footerY,
         {
           width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
           align: 'center'
         }
       );
  }

  /**
   * 检查是否需要新页面
   * @param {PDFDocument} doc - PDF文档实例
   * @param {number} cardHeight - 卡片高度（点）
   * @returns {boolean} 是否需要新页面
   */
  static needsNewPage(doc, cardHeight) {
    const availableHeight = doc.page.height - doc.y - doc.page.margins.bottom - 20; // 20是页脚高度
    return availableHeight < cardHeight;
  }

  /**
   * 添加新页面
   * @param {PDFDocument} doc - PDF文档实例
   * @param {number} currentPage - 当前页
   * @param {number} totalPages - 总页数
   */
  static addNewPage(doc, currentPage, totalPages) {
    doc.addPage();
  }

  /**
   * 添加背景图片
   * @param {PDFDocument} doc - PDF文档实例
   * @param {Buffer} imageBuffer - 背景图片Buffer
   * @param {number} pageWidth - 页面宽度
   * @param {number} pageHeight - 页面高度
   */
  static addBackgroundImage(doc, imageBuffer, pageWidth, pageHeight) {
    try {
      if (!imageBuffer) {
        console.warn('背景图片Buffer为空，跳过添加');
        return;
      }
      
      // 将背景图片添加到页面底部（作为背景层）
      // 使用save()和restore()确保不影响后续绘制
      doc.save();
      
      // 设置透明度（1.0 = 完全不透明，用于测试）
      // 如果需要半透明效果，可以设置为0.3-0.7之间的值
      doc.opacity(1.0); // 完全不透明，确保背景图可见
      
      // 将图片添加到整个页面（从0,0开始，覆盖整个页面）
      // PDFKit的image方法使用页面坐标系统，从左上角(0,0)开始
      doc.image(imageBuffer, 0, 0, {
        width: pageWidth,
        height: pageHeight,
        fit: [pageWidth, pageHeight], // 使用fit参数确保图片填充整个区域
        align: 'center',
        valign: 'center'
      });
      
      console.log(`背景图片已添加，位置: (0, 0), 尺寸: ${pageWidth}x${pageHeight}, 透明度: 1.0`);
      
      doc.restore();
      
    } catch (error) {
      console.error('添加背景图片失败:', error.message);
      console.error(error.stack);
    }
  }
}

module.exports = PDFHelper;

