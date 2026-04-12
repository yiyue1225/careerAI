const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

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
    const { search = '', industry = '', city = '', salary = '' } = reqQuery;
    let whereParts = [];
    let queryParams = [];

    // 关键词搜索：这会决定“这个岗位”的范围
    if (search.trim()) {
        whereParts.push(`(job_name LIKE ? OR company_name LIKE ?)`);
        queryParams.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    // 只有当下拉框选择了行业，才进行行业过滤
    if (industry) {
        whereParts.push(`JSON_CONTAINS(clean_industry, JSON_QUOTE(?))`);
        queryParams.push(industry);
    }

    if (city) {
        whereParts.push(`city = ?`);
        queryParams.push(city);
    }

    // 薪资逻辑统一
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

// 4. 简历分析 (预留)
app.post('/api/analyze', async (req, res) => {
    res.json({ code: 0, data: { score: 85, advice: "建议加强算法理论基础" } });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 服务启动成功: http://localhost:${PORT}`);
});