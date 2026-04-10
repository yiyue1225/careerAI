# careerAI

本项目是一个全栈AI应用项目，旨在为用户提供职业生涯规划和AI驱动的建议。该项目采用现代化的前后端分离架构：

## Quick Start

本项目已集成前后端联合启动环境，只需简单几步即可运行。

**1. 环境准备**

* **Node.js**: v18.x+
* **Python**: 3.9+
* **Database**: MySQL 8.0 / PostgreSQL (已完成初始化)

**2. 克隆和安装**

```bash
# 克隆仓库
git clone https://github.com/your-username/careerAI.git
cd careerAI

# 安装依赖（一键完成前端与后端依赖配置）
npm run install-all
```

**3. 配置环境**

在根目录创建 `.env` 文件，配置你的 AI 接口与数据库：

```
PORT=3000
NODE_ENV=development
DIFY_API_KEY=

# Dify 的 API 基础地址
DIFY_API_URL=

# 数据库配置  
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=career_ai
```

**4. 一键启动**

```bash
# 同时启动 Vue 3 前端开发服务器与 Python 后端服务
npm run dev
```

## 技术栈

| 模块    | 技术                                                |
| ------- | --------------------------------------------------- |
| 前端    | Vue 3 + Vite + Element Plus + ECharts (Radar Chart) |
| 后端    | Python (FastAPI/Flask) + PyMySQL                    |
| AI 引擎 | Dify + Qwen-Turbo / GLM-4.5-Flash                   |
| 工具    | Docker + frp + npm-run-all                          |

