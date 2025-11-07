// 百度图像搜索API配置模块

const baiduConfig = {
  // API密钥配置
  apiKey: 'MValEd3Hf83E1cZMUYzIWg3e',
  secretKey: '5qfivf4D1KWK315aIVQUHTndT9BaRgRm',
  appId: '120696154',
  appName: 'jccool251107',
  
  // API端点
  tokenUrl: 'https://aip.baidubce.com/oauth/2.0/token',
  similarAddUrl: 'https://aip.baidubce.com/rest/2.0/image-classify/v1/realtime_search/similar/add',
  similarSearchUrl: 'https://aip.baidubce.com/rest/2.0/image-classify/v1/realtime_search/similar/search',
  similarDeleteUrl: 'https://aip.baidubce.com/rest/2.0/image-classify/v1/realtime_search/similar/delete'
};

module.exports = baiduConfig;

