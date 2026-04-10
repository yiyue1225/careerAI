const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// --- 模拟数据库数据 ---
const positionsData = [
  {
    id: "1",
    name: 'AI 算法工程师',
    company: '百度',
    location: '北京',
    salary: '35k-60k',
    industry: '人工智能',
    description: '负责大语言模型（LLM）的微调、量化与私有化部署。要求熟悉 Transformer 架构，有 RAG 开发经验者优先。',
    requirements: {
      professionalSkills: ['Python', 'PyTorch', 'Transformer', 'NLP', 'Docker'],
      certificates: ['英语六级', '软考高级'],
      innovation: 5,
      learningAbility: 5,
      stressTolerance: 4,
      communication: 4,
      internship: ['有头部互联网公司 AI 实验室实习经历']
    },
    dimensions: {
      professional: 95,
      certificate: 70,
      innovation: 90,
      learning: 95,
      stress: 80,
      communication: 75,
      internship: 85
    }
  },
  {
    id: "2",
    name: '嵌入式软件开发',
    company: '大疆 (DJI)',
    location: '深圳',
    salary: '25k-45k',
    industry: '智能硬件',
    description: '负责无人机飞控系统的底层驱动开发（STM32/RTOS），优化系统功耗与实时性。',
    requirements: {
      professionalSkills: ['C/C++', 'STM32', 'FreeRTOS', 'SPI/IIC', '汇编'],
      certificates: ['电子设计竞赛奖项', '计算机三级'],
      innovation: 4,
      learningAbility: 4,
      stressTolerance: 5,
      communication: 3,
      internship: ['有嵌入式硬件项目完整开发周期经验']
    },
    dimensions: {
      professional: 90,
      certificate: 85,
      innovation: 75,
      learning: 80,
      stress: 90,
      communication: 65,
      internship: 75
    }
  }
];

// --- API 路由 ---

// 1. 获取所有岗位（用于列表页和详情页的匹配）
app.get('/api/positions', (req, res) => {
  try {
    // 模拟成功返回
    res.json({
      code: 0,
      data: positionsData,
      message: "success"
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

// 2. 预留：AI 测评接口（A13 赛题核心 - Dify 接口调用处）
app.post('/api/analyze', (req, res) => {
  const { resumeData, positionId } = req.body;
  console.log(`收到岗位 ${positionId} 的简历分析请求`);
  
  // 这里未来对接 Dify API
  res.json({ 
    code: 0, 
    data: { score: 85, advice: "建议加强算法理论基础" },
    message: "分析完成" 
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`---------------------------------`);
  console.log(`A13 后端转接头启动成功！`);
  console.log(`地址: http://localhost:${PORT}/api/positions`);
  console.log(`---------------------------------`);
});