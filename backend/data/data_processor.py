import os
import re
import json
import requests
import pymysql
from dotenv import load_dotenv

# 1. 环境加载
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)

# 从 .env 读取配置
DIFY_API_KEY = os.getenv('DIFY_API_KEY')
DIFY_BASE_URL = os.getenv('DIFY_API_URL')  # 确保是 http://ip:port/v1
DB_CONFIG = {
    "host": os.getenv('DB_HOST'),
    "user": os.getenv('DB_USER'),
    "password": os.getenv('DB_PASS'),
    "database": os.getenv('DB_NAME'),
    "charset": 'utf8mb4',
    "cursorclass": pymysql.cursors.DictCursor
}

import re
import json
import requests


def get_ai_analysis(title, desc):
    url = f"{DIFY_BASE_URL}/chat-messages"
    headers = {
        "Authorization": f"Bearer {DIFY_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "inputs": {"job_title": title, "job_description": desc[:500]},
        "query": "请直接输出该岗位的评分JSON，禁止任何文字说明和思考过程。",
        "response_mode": "blocking",
        "user": "processor"
    }

    # --- 关键修复：先初始化为 None ---
    response = None
    try:
        # 增加 timeout，防止内网穿透不稳定导致的挂起
        response = requests.post(url, json=payload, headers=headers, timeout=30)

        if response.status_code != 200:
            print(f" ❌ 接口报错: {response.status_code}")
            return None

        res_data = response.json()
        answer = res_data.get('answer', '').strip()

        # --- 核心修复：强力提取 JSON (兼容 Thinking 模型) ---
        # 无论前面有多少 <think>，只抓取最后那个 {}
        json_match = re.findall(r'\{[^{}]*\}', answer)
        if json_match:
            return json.loads(json_match[-1])
        else:
            print(f" ❌ AI 吐出的内容里没 JSON，它说：{answer[:30]}...")
            return None

    except Exception as e:
        print(f" ❌ 运行异常: {e}")
        # 安全地检查 response 是否存在
        if response is not None:
            print(f" ❌ 错误详情: {response.text[:100]}")
        return None


def main():
    # 2. 连接数据库
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            # 修改点 1: 查询清洗后的新表 job_standard_profile
            # 只处理 pro_score 为 0 (未标注) 的数据
            sql_select = "SELECT id, job_name, full_detail FROM job_standard_profile WHERE pro_score = 0"
            cursor.execute(sql_select)
            jobs = cursor.fetchall()

            if not jobs:
                print("✨ 任务已全部完成！没有需要标注的数据。")
                return

            print(f"🚀 正在为 {len(jobs)} 条清洗后的岗位生成画像...")

            for job in jobs:
                # 修改点 2: 传入清洗后的 clean_detail
                scores = get_ai_analysis(job['job_name'], job['full_detail'])

                if scores:
                    # 修改点 3: 更新到 job_standard_profile 表
                    sql_update = """
                                 UPDATE job_standard_profile \
                                 SET pro_score=%s, \
                                     inn_score=%s, \
                                     lea_score=%s, \
                                     str_score=%s, \
                                     com_score=%s, \
                                     cer_score=%s, \
                                     int_score=%s
                                 WHERE id = %s \
                                 """
                    cursor.execute(sql_update, (
                        scores.get('pro', 0), scores.get('inn', 0), scores.get('lea', 0),
                        scores.get('str', 0), scores.get('com', 0), scores.get('cer', 0),
                        scores.get('int', 0), job['id']
                    ))
                    connection.commit()
                    print(f"✅ 画像同步成功: {job['job_name']} (ID: {job['id']})")
                else:
                    print(f"⚠️ 跳过 ID {job['id']}, AI 未返回有效 JSON")

    finally:
        connection.close()


if __name__ == "__main__":
    main()