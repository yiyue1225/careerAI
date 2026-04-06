const express = require('express'); 
const axios = require('axios');
const cors = require('cors');
require('dotenv').config(); 

const app = express();

app.use(cors()); 
app.use(express.json()); 



app.get('/analyze-test', (req, res) => {

    const studentName = "小明"; 
    
    const scores = {
        basic: 85,      // 基础要求
        skill: 90,      // 职业技能
        soft: 80,       // 职业素养
        potential: 95   // 发展潜力
    };

    res.json({
        message: `你好 ${studentName}，你的 A13 职业规划报告已生成！`,
        data: scores,
        status: "success"
    });
});


const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`转接头已启动：请访问 http://172.27.148.3:${PORT}/test`);
});



// 请求 Dify 知识库中的数据
const mockPositions = [
    {
        id: "1",
        name: "后端开发工程师",
        company: "某大厂",
        location: "杭州",
        salary: "20k-30k",
        industry: "互联网",
        requirements: { professionalSkills: ["Java", "Node.js", "MySQL", "Redis"] },
        dimensions: { professional: 90, certificate: 80, innovation: 70, learning: 85, stress: 90, communication: 75, internship: 80 }
    }
];


app.get('/api/positions', (req, res) => {
    // A13 赛题：这里可以加入筛选逻辑
    console.log("前端正在请求岗位列表...");
    res.json(mockPositions); 
});