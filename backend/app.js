const express = require('express');
const cors = require('cors');
const axios = require('axios'); // 留着以后调 Dify 用
require('dotenv').config();    // 留着读取 API Key 用

const app = express();

// --- 中间件配置 ---
app.use(cors());              // 开启跨域，允许 Vue 访问
app.use(express.json());      // 允许后端接收前端发来的 JSON 数据


// --- API 路由 ---

// 1. 测试接口：岗位列表
app.get('/api/positions', (req, res) => {
  try {
    // 这里的字段名（name, city, salary）必须和 Vue 模板里的 {{ item.xxx }} 一致
    const data = [
      { id: 1, name: 'AI 算法工程师', category: '技术', city: '北京', salary: '30k', industry: '人工智能' },
      { id: 2, name: '产品经理', category: '产品', city: '上海', salary: '20k', industry: '互联网' },
      { id: 3, name: '嵌入式开发', category: '硬件', city: '深圳', salary: '18k', industry: '智能硬件' }
    ];
    console.log('📅 收到前端请求：返回了', data.length, '条岗位数据');
    res.json(data); 
  } catch (error) {
    console.error('后端报错:', error);
    res.status(500).json({ message: "后端数据处理异常" });
  }
});

// 2. 预留：AI 测评接口（A13 赛题核心）
app.post('/api/analyze', (req, res) => {
    // 这里以后写调用 Dify 的逻辑
    res.json({ message: "收到简历，正在分析..." });
});

// --- 启动服务器 ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`-----------------------------------------`);
  console.log(`A13 后端转接头启动成功！`);
  console.log(`本地访问地址: http://localhost:${PORT}`);
  console.log(`API 测试地址: http://localhost:${PORT}/api/positions`);
  console.log(`-----------------------------------------`);
});