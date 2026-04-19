# 数据库 ER 图说明文档

## 概述

CareerAI 系统的数据库采用关系型设计，主要存储岗位信息、技能要求、维度评分等数据。本文档详细说明各表之间的关系和数据流向。

## 数据库名称

```
career_ai
```

## 核心表结构

### 1. job_info（工作原始信息表）

**用途**：存储从招聘网站爬取的原始工作信息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| job_name | VARCHAR | 岗位名称 |
| company_name | VARCHAR | 公司名称 |
| city | VARCHAR | 工作城市 |
| salary | VARCHAR | 薪资范围 |
| industry | VARCHAR | 行业 |
| ... | ... | 其他原始字段 |

**关系**：一对一 → `job_standard_profile`

---

### 2. job_standard_profile（标准岗位画像表）

**用途**：存储标准化的岗位信息，包含所有技能名称、类型和维度数据

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| job_name | VARCHAR | 岗位名称 |
| company_name | VARCHAR | 公司名称 |
| city | VARCHAR | 城市 |
| salary | VARCHAR | 薪资 |
| industry | VARCHAR | 行业 |
| requirements | JSON | 技能要求（JSON 格式） |
| dimensions | JSON | 维度评分（JSON 格式） |
| clean_industry | JSON | 清洗后的行业标签 |

**关系**：
- 一对多 ← `job_info`
- 一对多 → `skill_dictionary`
- 一对多 → `job_portrait`
- 一对多 → `weight_config`

---

### 3. skill_dictionary（工作-技能对应表）

**用途**：记录每个岗位需要的具体技能

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| job_id | INT | 岗位 ID（外键 → job_standard_profile） |
| skill_id | INT | 技能 ID（外键 → job_skill） |
| skill_name | VARCHAR | 技能名称 |
| skill_type | VARCHAR | 技能类型（专业技能/证书/其他） |
| ... | ... | 其他字段 |

**关系**：
- 多对一 ← `job_standard_profile`
- 多对一 ← `job_skill`

---

### 4. job_skill（技能权重表）

**用途**：记录每个技能的权重和重要程度

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| skill_name | VARCHAR | 技能名称 |
| skill_type | VARCHAR | 技能类型 |
| weight | FLOAT | 权重值 |
| dimension | VARCHAR | 所属维度 |
| ... | ... | 其他字段 |

**关系**：
- 一对多 ← `skill_dictionary`

---

### 5. job_portrait（岗位维度数量表）

**用途**：记录每个岗位在各个维度上需要的技能数量

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| job_id | INT | 岗位 ID（外键 → job_standard_profile） |
| professional_count | INT | 专业技能数量 |
| certificate_count | INT | 证书数量 |
| innovation_count | INT | 创新能力数量 |
| learning_count | INT | 学习能力数量 |
| stress_count | INT | 抗压能力数量 |
| communication_count | INT | 沟通能力数量 |
| internship_count | INT | 实习经验数量 |

**关系**：
- 多对一 ← `job_standard_profile`

---

### 6. weight_config（岗位维度权重配置表）

**用途**：记录每个岗位各维度的权重配置

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| job_id | INT | 岗位 ID（外键 → job_standard_profile） |
| professional | INT | 专业技能权重（0-100） |
| certificate | INT | 证书权重（0-100） |
| innovation | INT | 创新能力权重（0-100） |
| learning | INT | 学习能力权重（0-100） |
| stress | INT | 抗压能力权重（0-100） |
| communication | INT | 沟通能力权重（0-100） |
| internship | INT | 实习经验权重（0-100） |

**关系**：
- 多对一 ← `job_standard_profile`

---

## ER 图关系图

```
┌──────────────────┐
│   job_info       │
│  (原始工作信息)   │
└────────┬─────────┘
         │ 1:1
         ↓
┌──────────────────────────────┐
│  job_standard_profile        │
│  (标准岗位画像)               │
│  - 岗位名称                   │
│  - 技能要求 (JSON)            │
│  - 维度评分 (JSON)            │
└────┬──────────┬──────────┬───┘
     │ 1:N      │ 1:N      │ 1:N
     ↓          ↓          ↓
┌─────────────┐ ┌──────────────┐ ┌──────────────┐
│skill_       │ │job_portrait  │ │weight_config │
│dictionary   │ │(维度数量)    │ │(维度权重)    │
│(工作-技能)  │ └──────────────┘ └──────────────┘
└────┬────────┘
     │ N:1
     ↓
┌──────────────┐
│  job_skill   │
│ (技能权重)   │
└──────────────┘
```

## 数据流向

### 1. 岗位数据导入流程

```
招聘网站数据
    ↓
job_info (原始数据)
    ↓
数据清洗 & 标准化
    ↓
job_standard_profile (标准岗位画像)
    ↓
├─→ skill_dictionary (技能对应)
├─→ job_portrait (维度数量统计)
└─→ weight_config (维度权重配置)
```

### 2. 岗位匹配查询流程

```
学生能力画像
    ↓
查询 job_standard_profile
    ↓
获取 skill_dictionary (所需技能)
    ↓
获取 job_skill (技能权重)
    ↓
获取 weight_config (维度权重)
    ↓
计算匹配度
    ↓
返回推荐岗位
```

## 关键设计说明

### 为什么分离 job_info 和 job_standard_profile？

- **job_info**：保留原始数据，便于数据溯源和重新处理
- **job_standard_profile**：标准化数据，用于系统业务逻辑

### 为什么使用 JSON 字段存储 requirements 和 dimensions？

- 灵活性高，不同岗位的技能要求差异大
- 避免过度规范化导致表结构复杂
- 便于扩展新的维度或技能类型

### 为什么分离 job_portrait 和 weight_config？

- **job_portrait**：记录维度的**数量**（有多少个技能）
- **weight_config**：记录维度的**权重**（这个维度有多重要）
- 两者独立，便于分别调整

## 查询示例

### 查询某岗位的所有技能

```sql
SELECT sd.skill_name, sd.skill_type, js.weight
FROM skill_dictionary sd
JOIN job_skill js ON sd.skill_id = js.id
WHERE sd.job_id = 1;
```

### 查询某岗位的维度权重

```sql
SELECT professional, certificate, innovation, learning, stress, communication, internship
FROM weight_config
WHERE job_id = 1;
```

### 查询某岗位的维度技能数量

```sql
SELECT professional_count, certificate_count, innovation_count, learning_count, stress_count, communication_count, internship_count
FROM job_portrait
WHERE job_id = 1;
```

## 数据统计

| 表名 | 用途 | 记录数 |
|------|------|--------|
| job_info | 原始工作信息 | ~5000+ |
| job_standard_profile | 标准岗位画像 | ~5000+ |
| skill_dictionary | 工作-技能对应 | ~50000+ |
| job_skill | 技能权重 | ~1000+ |
| job_portrait | 岗位维度数量 | ~5000+ |
| weight_config | 岗位维度权重 | ~5000+ |

## 性能优化建议

### 已有的索引

```sql
-- job_standard_profile 主要查询字段
CREATE INDEX idx_job_name ON job_standard_profile(job_name);
CREATE INDEX idx_city ON job_standard_profile(city);
CREATE INDEX idx_industry ON job_standard_profile(industry);

-- skill_dictionary 外键查询
CREATE INDEX idx_skill_dict_job ON skill_dictionary(job_id);
CREATE INDEX idx_skill_dict_skill ON skill_dictionary(skill_id);

-- job_portrait 和 weight_config 外键查询
CREATE INDEX idx_portrait_job ON job_portrait(job_id);
CREATE INDEX idx_weight_job ON weight_config(job_id);
```

### 建议添加的索引

```sql
-- 如果经常按技能类型查询
CREATE INDEX idx_skill_type ON job_skill(skill_type);

-- 如果经常按维度查询
CREATE INDEX idx_skill_dimension ON job_skill(dimension);
```

## 备份和恢复

### 备份整个数据库

```bash
mysqldump -u root -p career_ai > career_ai_backup.sql
```

### 恢复数据库

```bash
mysql -u root -p career_ai < career_ai_backup.sql
```

## 相关文件

| 文件 | 说明 |
|------|------|
| `ER_Diagram.png` | ER 图图片 |
| `database_schema.sql` | 数据库建表脚本 |
| `backend/app.js` | 数据库查询逻辑 |

## 更新日志

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0 | 2025-04-18 | 初始版本 |
