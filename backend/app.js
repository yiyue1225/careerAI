const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// multer：文件存内存，不落盘
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'career_ai',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- 公用筛选逻辑函数 ---
function buildWhereClause(reqQuery) {
    const { search = '', industry = '', city = '', salary = '', skill = '' } = reqQuery;
    let whereParts = [];
    let queryParams = [];

    if (search.trim()) {
        whereParts.push(`(job_name LIKE ? OR company_name LIKE ?)`);
        queryParams.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    // 技能精确匹配（从 PositionDetail 点击技能跳转）
    if (skill.trim()) {
        whereParts.push(`JSON_CONTAINS(requirements->'$.professionalSkills', JSON_QUOTE(?))`);
        queryParams.push(skill.trim());
    }

    if (industry) {
        whereParts.push(`JSON_CONTAINS(clean_industry, JSON_QUOTE(?))`);
        queryParams.push(industry);
    }

    if (city) {
        whereParts.push(`city = ?`);
        queryParams.push(city);
    }

    if (salary) {
        if (salary === '30+') {
            whereParts.push(`CAST(SUBSTRING_INDEX(salary, '-', 1) AS UNSIGNED) >= 30`);
        } else {
            const [min, max] = salary.split('-');
            if (min) {
                whereParts.push(`CAST(SUBSTRING_INDEX(salary, '-', 1) AS UNSIGNED) >= ?`);
                queryParams.push(parseInt(min));
            }
            if (max) {
                whereParts.push(`CAST(SUBSTRING_INDEX(salary, '-', 1) AS UNSIGNED) <= ?`);
                queryParams.push(parseInt(max));
            }
        }
    }

    return { whereParts, queryParams };
}

// 1. 岗位列表接口
app.get('/api/positions', async (req, res) => {
    try {
        const { page = 1, size = 12 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(size);
        const { whereParts, queryParams } = buildWhereClause(req.query);

        const whereClause = whereParts.length > 0 ? ` WHERE ${whereParts.join(' AND ')}` : '';

        const countSql = `SELECT COUNT(*) as total FROM job_standard_profile${whereClause}`;
        const [[{ total }]] = await pool.query(countSql, queryParams);

        const dataSql = `SELECT id, job_name as name, company_name as company, city as location, 
                         salary, industry, requirements, dimensions 
                         FROM job_standard_profile${whereClause} 
                         ORDER BY id ASC LIMIT ? OFFSET ?`;
        
        const [rows] = await pool.query(dataSql, [...queryParams, parseInt(size), offset]);

        const formattedData = rows.map(row => ({
            ...row,
            requirements: typeof row.requirements === 'string' ? JSON.parse(row.requirements) : row.requirements || { professionalSkills: [] },
            dimensions: typeof row.dimensions === 'string' ? JSON.parse(row.dimensions) : row.dimensions || {}
        }));

        res.json({ code: 0, data: formattedData, total: total });
    } catch (error) {
        console.error('Positions Error:', error);
        res.status(500).json({ code: 500, message: '获取数据失败' });
    }
});

// 1b. 单个岗位详情接口（按 ID 直查，避免分页找不到）
app.get('/api/positions/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT id, job_name as name, company_name as company, city as location,
                    salary, industry, requirements, dimensions, clean_industry
             FROM job_standard_profile WHERE id = ?`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ code: 404, message: '岗位不存在' });
        const row = rows[0];
        res.json({
            code: 0,
            data: {
                ...row,
                requirements: typeof row.requirements === 'string' ? JSON.parse(row.requirements) : row.requirements || { professionalSkills: [] },
                dimensions: typeof row.dimensions === 'string' ? JSON.parse(row.dimensions) : row.dimensions || {},
                clean_industry: typeof row.clean_industry === 'string' ? JSON.parse(row.clean_industry) : row.clean_industry || [],
            }
        });
    } catch (error) {
        console.error('Position Detail Error:', error);
        res.status(500).json({ code: 500, message: '获取详情失败' });
    }
});

// 2. 筛选项接口
app.get('/api/position-filters', async (req, res) => {
    try {
        const [industryRows] = await pool.query(`SELECT clean_industry FROM job_standard_profile WHERE clean_industry IS NOT NULL`);
        const industrySet = new Set();
        industryRows.forEach(row => {
            try {
                const tags = typeof row.clean_industry === 'string' ? JSON.parse(row.clean_industry) : row.clean_industry;
                if (Array.isArray(tags)) tags.forEach(tag => industrySet.add(tag));
            } catch (e) {}
        });

        const [cities] = await pool.query(`SELECT DISTINCT city FROM job_standard_profile WHERE city IS NOT NULL`);
        res.json({
            code: 0,
            industries: Array.from(industrySet),
            cities: cities.map(c => c.city)
        });
    } catch (error) {
        res.status(500).json({ code: 500, message: '获取筛选项失败' });
    }
});

// 3. 图表统计接口
app.get('/api/industry-stats', async (req, res) => {
    try {
        const { search = '', city = '', salary = '', industry = '' } = req.query;
        const { whereParts, queryParams } = buildWhereClause(req.query);
        
        // 1. 基础过滤：必须有标签
        whereParts.push('clean_industry IS NOT NULL');

        // 2. 核心修复：如果你希望图中只显示搜索的那个行业
        // 我们需要单独处理这个特殊的过滤条件
        let finalSql;
        let finalParams = [...queryParams];

        if (industry) {
            // 如果有行业筛选，在 GROUP BY 之前强制过滤掉其他标签
            const whereClause = ` WHERE ${whereParts.join(' AND ')} AND jt.tag LIKE ?`;
            finalParams.push(`%${industry}%`);
            
            finalSql = `
                SELECT jt.tag AS name, COUNT(*) AS value
                FROM job_standard_profile
                CROSS JOIN JSON_TABLE(clean_industry, '$[*]' COLUMNS(tag VARCHAR(255) PATH '$')) AS jt
                ${whereClause}
                GROUP BY jt.tag
                ORDER BY value DESC
            `;
        } else {
            // 如果没有行业筛选（比如全局搜索），展示所有分布
            const whereClause = ` WHERE ${whereParts.join(' AND ')}`;
            finalSql = `
                SELECT jt.tag AS name, COUNT(*) AS value
                FROM job_standard_profile
                CROSS JOIN JSON_TABLE(clean_industry, '$[*]' COLUMNS(tag VARCHAR(255) PATH '$')) AS jt
                ${whereClause}
                GROUP BY jt.tag
                ORDER BY value DESC
                LIMIT 15
            `;
        }

        const [rows] = await pool.query(finalSql, finalParams);
        res.json({ code: 0, data: rows });
    } catch (error) {
        console.error('Stats Error:', error); // 💡 请查看 Node 终端这里的具体报错
        res.status(500).json({ code: 500, message: '统计失败' });
    }
});

// 4. 统计数据接口
app.get('/api/stats', async (req, res) => {
    try {
        const [[row]] = await pool.query(`
            SELECT COUNT(*) as totalPositions, COUNT(DISTINCT city) as totalCities
            FROM job_standard_profile
        `);
        res.json({ code: 0, data: { totalPositions: row.totalPositions, totalCities: row.totalCities } });
    } catch (error) {
        res.status(500).json({ code: 500, message: '获取统计数据失败' });
    }
});

// 5. 简历分析（接通 Dify Workflow，附规则引擎降级兜底）
const axios = require('axios');

function extractSkillsFromText(text) {
    const SKILLS = [
        // 编程语言
        'Java','Python','JavaScript','TypeScript','Go','Golang','C++','C#','PHP','Swift','Kotlin','Rust','Scala',
        // 前端
        'Vue','React','Angular','HTML','CSS','Webpack','Vite','jQuery','uni-app','微信小程序',
        // 后端/框架
        'Spring Boot','Spring','Spring Cloud','Django','Flask','FastAPI','Express','Node.js','MyBatis','Hibernate',
        // 数据库
        'MySQL','Redis','MongoDB','PostgreSQL','Oracle','SQLite','Elasticsearch','ClickHouse','HBase',
        // 云/运维
        'Docker','Kubernetes','Linux','Nginx','Jenkins','CI/CD','Git','AWS','阿里云','腾讯云',
        // 大数据/AI
        'Hadoop','Spark','Kafka','Flink','TensorFlow','PyTorch','机器学习','深度学习','数据分析','数据挖掘','NLP','计算机视觉',
        // 其他
        'REST','GraphQL','微服务','分布式','高并发','算法','数据结构','RabbitMQ','Zookeeper','gRPC',
        'Flutter','Android','iOS','React Native','Electron',
    ];
    return SKILLS.filter(s => text.includes(s));
}

function extractCertificates(text) {
    const CERTS = [
        'CET-4','CET-6','英语四级','英语六级','雅思','托福','软件设计师','系统分析师','软考','PMP',
        '计算机二级','计算机三级','普通话','驾照','证券从业','银行从业','会计从业','教师资格',
        'AWS认证','阿里云认证','华为认证','红帽认证','RHCE','CCNA','CCNP',
    ];
    return CERTS.filter(c => text.includes(c));
}

function extractName(text) {
    // 常见简历格式：第一行或"姓名：xxx"
    const namePattern = /姓\s*名[：:]\s*([^\s\n，,]{2,4})/;
    const m = text.match(namePattern);
    return m ? m[1] : '';
}

function extractMajor(text) {
    const MAJORS = ['计算机科学与技术','软件工程','信息工程','网络工程','数据科学','人工智能','信息安全',
        '电子信息','通信工程','自动化','大数据','物联网','数字媒体','信息管理','电气工程'];
    for (const m of MAJORS) {
        if (text.includes(m)) return m;
    }
    if (text.includes('计算机')) return '计算机科学与技术';
    if (text.includes('软件')) return '软件工程';
    if (text.includes('数据')) return '数据科学与大数据技术';
    if (text.includes('人工智能') || text.includes('AI')) return '人工智能';
    return '计算机相关专业';
}

function extractGrade(text) {
    // 匹配 "2024届" 或 "2025届" 或 "大三" 等
    const gradeYearMatch = text.match(/20(2[0-9])[届年]/);
    if (gradeYearMatch) return gradeYearMatch[0].replace(/年$/, '届');
    if (text.includes('大四') || text.includes('应届')) return '2025届';
    if (text.includes('大三')) return '2026届';
    if (text.includes('研究生') || text.includes('硕士')) return '研究生';
    return '2025届';
}

function buildMockProfile(resumeText) {
    const text = resumeText || '';
    const skills = extractSkillsFromText(text);
    const certs = extractCertificates(text);
    const name = extractName(text) || '同学';
    const major = extractMajor(text);
    const grade = extractGrade(text);

    const hasInternship = text.includes('实习') || text.includes('工作经历') || text.includes('工作经验');
    const hasProject = text.includes('项目经历') || text.includes('项目经验') || text.includes('项目介绍');
    const hasCommunication = text.includes('沟通') || text.includes('协作') || text.includes('团队') || text.includes('负责人');
    const hasAward = text.includes('奖') || text.includes('竞赛') || text.includes('比赛') || text.includes('荣誉');
    const hasGPA = /GPA|绩点|成绩/.test(text);

    // 基于内容丰富度打分
    const skillScore = Math.min(90, 45 + skills.length * 5);
    const certScore = Math.min(90, 30 + certs.length * 20);
    const innovationScore = hasProject ? (hasAward ? 80 : 65) : 50;
    const learningScore = hasGPA ? 82 : (skills.length >= 6 ? 75 : 65);
    const stressScore = hasInternship ? 75 : 60;
    const commScore = hasCommunication ? 78 : 65;
    const internshipScore = hasInternship ? Math.min(90, 60 + (text.match(/实习/g) || []).length * 10) : 35;

    const avgScore = Math.round((skillScore + certScore + innovationScore + learningScore + stressScore + commScore + internshipScore) / 7);
    const completeness = Math.min(95, 50
        + (name !== '同学' ? 5 : 0)
        + (certs.length > 0 ? 10 : 0)
        + (hasInternship ? 15 : 0)
        + (hasProject ? 15 : 0)
        + (skills.length > 0 ? 10 : 0)
    );

    return {
        name,
        major,
        grade,
        completeness,
        competitiveness: Math.round(avgScore * 0.9),
        skills: {
            professionalSkills: skills.length > 0 ? skills.slice(0, 10) : ['Java', 'MySQL', 'Spring Boot'],
            certificates: certs,
            internship: hasInternship ? ['有实习经历（规则识别）'] : [],
        },
        dimensions: {
            professional: skillScore,
            certificate: certScore,
            innovation: innovationScore,
            learning: learningScore,
            stress: stressScore,
            communication: commScore,
            internship: internshipScore,
        },
    };
}

app.post('/api/analyze', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ code: 400, message: '请上传简历文件' });

        const ext = req.file.originalname.split('.').pop()?.toLowerCase();
        let resumeText = '';

        // 提取文本
        if (ext === 'pdf') {
            const parsed = await pdfParse(req.file.buffer);
            resumeText = parsed.text;
        } else if (ext === 'doc' || ext === 'docx') {
            const result = await mammoth.extractRawText({ buffer: req.file.buffer });
            resumeText = result.value;
        } else {
            return res.status(400).json({ code: 400, message: '仅支持 PDF 或 Word 格式' });
        }

        if (!resumeText.trim()) {
            return res.status(400).json({ code: 400, message: '无法提取简历文字，请检查文件格式' });
        }

        // 尝试调用 Dify Agent API（流式）
        const difyKey = process.env.DIFY_API_KEY_RESUME_ANALYSIS;
        const difyUrl = process.env.DIFY_API_URL;

        if (difyKey && difyUrl) {
            try {
                // 文字模式：本地提取简历文字后通过 inputs.resume_text 发给 Dify
                // （Dify Agent 需在变量中添加名为 resume_text 的文本变量）
                const chatPayload = {
                    inputs: { resume_text: resumeText.substring(0, 4000) },
                    query: '请分析简历并严格按JSON格式返回结果',
                    response_mode: 'streaming',
                    user: 'resume-user-' + Date.now(),
                    conversation_id: '',
                };

                console.log('发送给 Dify，文字长度:', resumeText.length);

                // Agent 类型不支持 blocking，必须用 streaming 流式接收
                const difyRes = await axios({
                    method: 'post',
                    url: `${difyUrl}/chat-messages`,
                    data: chatPayload,
                    headers: {
                        Authorization: `Bearer ${difyKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 90000,
                    responseType: 'stream',
                });

                // 逐行收集 SSE 流，拼接 agent_message 事件的 answer 字段
                let fullAnswer = '';
                await new Promise((resolve, reject) => {
                    difyRes.data.on('data', (chunk) => {
                        const lines = chunk.toString().split('\n');
                        for (const line of lines) {
                            if (!line.startsWith('data: ')) continue;
                            const jsonStr = line.slice(6).trim();
                            if (!jsonStr || jsonStr === '[DONE]') continue;
                            try {
                                const parsed = JSON.parse(jsonStr);
                                if ((parsed.event === 'agent_message' || parsed.event === 'message') && parsed.answer) {
                                    fullAnswer += parsed.answer;
                                }
                            } catch {}
                        }
                    });
                    difyRes.data.on('end', resolve);
                    difyRes.data.on('error', reject);
                });

                console.log('Dify Agent answer (前300字):', fullAnswer.substring(0, 300));

                const jsonMatch = fullAnswer.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const analyzedData = JSON.parse(jsonMatch[0]);
                    if (analyzedData && analyzedData.dimensions) {
                        return res.json({ code: 0, data: analyzedData, source: 'ai' });
                    }
                }
                console.warn('Dify 返回内容无法解析为目标JSON，降级处理。原始内容：', fullAnswer.substring(0, 500));
            } catch (difyErr) {
                console.warn('Dify 调用失败：', difyErr.response?.data || difyErr.message);
            }
        }

        // 降级：用规则从简历文本提取基础信息
        const mockData = buildMockProfile(resumeText);
        return res.json({ code: 0, data: mockData, source: 'fallback' });

    } catch (error) {
        console.error('Analyze Error:', error.message);
        res.status(500).json({ code: 500, message: '简历解析失败：' + error.message });
    }
});

// 7. 技能热词统计接口
app.get('/api/skill-stats', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT jt.skill, COUNT(*) as count
            FROM job_standard_profile
            CROSS JOIN JSON_TABLE(
                JSON_EXTRACT(requirements, '$.professionalSkills'),
                '$[*]' COLUMNS(skill VARCHAR(100) PATH '$')
            ) AS jt
            WHERE requirements IS NOT NULL AND jt.skill IS NOT NULL AND jt.skill != ''
            GROUP BY jt.skill
            ORDER BY count DESC
            LIMIT 60
        `);
        res.json({ code: 0, data: rows });
    } catch (error) {
        console.error('Skill Stats Error:', error);
        res.status(500).json({ code: 500, message: '获取技能统计失败' });
    }
});

// 6. AI 聊天助手接口（代理 Dify Chatbot，支持可选文件上传）
app.post('/api/chat', upload.single('file'), async (req, res) => {
    try {
        const message = req.body.message;
        const conversationId = req.body.conversationId;
        if (!message) return res.status(400).json({ code: 400, message: '消息不能为空' });

        const difyKey = process.env.DIFY_API_KEY;
        const difyUrl = process.env.DIFY_API_URL;

        const payload = {
            inputs: {},
            query: message,
            response_mode: 'blocking',
            user: 'career-ai-user-' + Date.now(),
        };
        if (conversationId) payload.conversation_id = conversationId;

        // 如果携带了文件，先上传到 Dify，再把 file_id 附加到消息
        if (req.file) {
            try {
                const FormDataLib = require('form-data');
                const fileForm = new FormDataLib();
                fileForm.append('file', req.file.buffer, {
                    filename: req.file.originalname,
                    contentType: req.file.mimetype || 'application/octet-stream',
                });
                fileForm.append('user', payload.user);

                const uploadRes = await axios.post(`${difyUrl}/files/upload`, fileForm, {
                    headers: {
                        ...fileForm.getHeaders(),
                        Authorization: `Bearer ${difyKey}`,
                    },
                    timeout: 30000,
                });

                const fileId = uploadRes.data?.id;
                if (fileId) {
                    payload.files = [{
                        type: 'document',
                        transfer_method: 'local_file',
                        upload_file_id: fileId,
                    }];
                    console.log('Chat 文件上传成功:', fileId, req.file.originalname);
                }
            } catch (uploadErr) {
                // 文件上传失败不中断，只用文字继续
                console.warn('Chat 文件上传失败，仅用文字:', uploadErr.message);
                payload.query = `[附件：${req.file.originalname}]\n\n${message}`;
            }
        }

        // Agent 类型必须用 streaming，不支持 blocking
        payload.response_mode = 'streaming';

        const difyRes = await axios({
            method: 'post',
            url: `${difyUrl}/chat-messages`,
            data: payload,
            headers: { Authorization: `Bearer ${difyKey}`, 'Content-Type': 'application/json' },
            timeout: 60000,
            responseType: 'stream',
        });

        // 收集 SSE 流，拼接 answer
        let fullAnswer = '';
        let returnedConvId = '';
        await new Promise((resolve, reject) => {
            difyRes.data.on('data', (chunk) => {
                const lines = chunk.toString().split('\n');
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const jsonStr = line.slice(6).trim();
                    if (!jsonStr || jsonStr === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(jsonStr);
                        if ((parsed.event === 'agent_message' || parsed.event === 'message') && parsed.answer) {
                            fullAnswer += parsed.answer;
                        }
                        if (parsed.conversation_id) returnedConvId = parsed.conversation_id;
                    } catch {}
                }
            });
            difyRes.data.on('end', resolve);
            difyRes.data.on('error', reject);
        });

        res.json({
            code: 0,
            answer: fullAnswer || '抱歉，我没有生成回复，请重试。',
            conversationId: returnedConvId,
        });
    } catch (error) {
        console.error('Chat API Error:', error.response?.data || error.message);
        res.status(500).json({ code: 500, message: 'AI 助手暂时不可用，请稍后再试' });
    }
});

// 8. 管理后台：薪资最高的岗位排行
app.get('/api/top-salary', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT job_name as name,
                   COUNT(*) as count,
                   ROUND(AVG(CAST(SUBSTRING_INDEX(salary, '-', 1) AS UNSIGNED)), 1) as avg_salary
            FROM job_standard_profile
            WHERE salary IS NOT NULL AND CAST(SUBSTRING_INDEX(salary, '-', 1) AS UNSIGNED) > 0
            GROUP BY job_name
            HAVING count >= 3
            ORDER BY avg_salary DESC
            LIMIT 10
        `);
        res.json({ code: 0, data: rows });
    } catch (error) {
        console.error('Top Salary Error:', error);
        res.status(500).json({ code: 500, message: '获取薪资排行失败' });
    }
});

// ========== 管理员认证 ==========
const ADMIN_TOKEN = 'career-ai-admin-token-2025';

function adminAuth(req, res, next) {
    const auth = req.headers['authorization'] || '';
    if (auth === `Bearer ${ADMIN_TOKEN}`) return next();
    res.status(401).json({ code: 401, message: '未授权，请先登录' });
}

// 9. 管理员登录
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin123';
    if (username === adminUser && password === adminPass) {
        res.json({ code: 0, token: ADMIN_TOKEN, message: '登录成功' });
    } else {
        res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }
});

// 10. 管理员 CRUD - 岗位管理
// 10a. 获取岗位列表（带分页，管理用）
app.get('/api/admin/positions', adminAuth, async (req, res) => {
    try {
        const { page = 1, size = 15, search = '' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(size);
        let where = search ? `WHERE job_name LIKE ? OR company_name LIKE ?` : '';
        const params = search ? [`%${search}%`, `%${search}%`] : [];

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM job_standard_profile ${where}`, params
        );
        const [rows] = await pool.query(
            `SELECT id, job_name, company_name, city, salary, industry,
                    requirements, dimensions, clean_industry
             FROM job_standard_profile ${where}
             ORDER BY id DESC LIMIT ? OFFSET ?`,
            [...params, parseInt(size), offset]
        );
        const data = rows.map(r => ({
            ...r,
            requirements: typeof r.requirements === 'string' ? JSON.parse(r.requirements) : r.requirements || {},
            dimensions: typeof r.dimensions === 'string' ? JSON.parse(r.dimensions) : r.dimensions || {},
            clean_industry: typeof r.clean_industry === 'string' ? JSON.parse(r.clean_industry) : r.clean_industry || [],
        }));
        res.json({ code: 0, data, total });
    } catch (e) {
        res.status(500).json({ code: 500, message: e.message });
    }
});

// 10b. 新增岗位
app.post('/api/admin/positions', adminAuth, async (req, res) => {
    try {
        const { job_name, company_name, city, salary, industry, requirements, dimensions } = req.body;
        if (!job_name) return res.status(400).json({ code: 400, message: '岗位名称不能为空' });
        const reqJson = JSON.stringify(requirements || { professionalSkills: [], certificates: [] });
        const dimJson = JSON.stringify(dimensions || { professional: 60, certificate: 50, innovation: 60, learning: 70, stress: 65, communication: 70, internship: 40 });
        const [result] = await pool.query(
            `INSERT INTO job_standard_profile (job_name, company_name, city, salary, industry, requirements, dimensions)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [job_name, company_name || '', city || '', salary || '', industry || '', reqJson, dimJson]
        );
        res.json({ code: 0, id: result.insertId, message: '新增成功' });
    } catch (e) {
        res.status(500).json({ code: 500, message: e.message });
    }
});

// 10c. 更新岗位
app.put('/api/admin/positions/:id', adminAuth, async (req, res) => {
    try {
        const { job_name, company_name, city, salary, industry, requirements, dimensions } = req.body;
        const reqJson = JSON.stringify(requirements || {});
        const dimJson = JSON.stringify(dimensions || {});
        await pool.query(
            `UPDATE job_standard_profile
             SET job_name=?, company_name=?, city=?, salary=?, industry=?, requirements=?, dimensions=?
             WHERE id=?`,
            [job_name, company_name, city, salary, industry, reqJson, dimJson, req.params.id]
        );
        res.json({ code: 0, message: '更新成功' });
    } catch (e) {
        res.status(500).json({ code: 500, message: e.message });
    }
});

// 10d. 删除岗位
app.delete('/api/admin/positions/:id', adminAuth, async (req, res) => {
    try {
        await pool.query(`DELETE FROM job_standard_profile WHERE id=?`, [req.params.id]);
        res.json({ code: 0, message: '删除成功' });
    } catch (e) {
        res.status(500).json({ code: 500, message: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 服务启动成功: http://localhost:${PORT}`);
});