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
DIFY_API_KEY = os.getenv('DIFY_API_KEY_EXTRACT_JOB_INFO')
DIFY_BASE_URL = os.getenv('DIFY_API_URL')
DIFY_API_URL = f"{DIFY_BASE_URL}/chat-messages"
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


def extract_job_requirements(title, min_s, max_s, desc):
    # 1. 确保 url 在这里被定义
    target_url = f"{DIFY_BASE_URL}/chat-messages"

    headers = {
        "Authorization": f"Bearer {DIFY_API_KEY}",
        "Content-Type": "application/json"
    }

    salary_str = f"{min_s}k - {max_s}k" if min_s and max_s else "面议"

    payload = {
        "inputs": {
            "job_title": title,
            "salary": salary_str,
            "job_description": desc[:1200]
        },
        "query": "请开始提取",
        "response_mode": "blocking",
        "user": "tag_filler"
    }

    try:
        # 2. 这里的第一个参数必须和上面定义的变量名一致
        response = requests.post(
            target_url,  # 👈 确保这里叫 target_url (或者都叫 url)
            json=payload,
            headers=headers,
            timeout=30,
            proxies={"http": None, "https": None}
        )

        if response.status_code != 200:
            return None

        answer = response.json().get('answer', '')
        json_match = re.search(r'\{.*\}', answer, re.DOTALL)
        return json.loads(json_match.group()) if json_match else None
    except Exception as e:
        # 打印具体的报错，方便我们调试
        print(f"❌ 提取解析内部异常: {e}")
        return None

def main():
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            # 这里的逻辑：分数已经跑完了（>0），但标签还没跑的（NULL）
            sql_select = """
                         SELECT id, job_name, min_salary_k, max_salary_k, full_detail
                         FROM job_standard_profile
                         WHERE pro_score > 0 \
                           AND requirements IS NULL \
                         """
            cursor.execute(sql_select)
            jobs = cursor.fetchall()

            if not jobs:
                print("✨ 所有的 Requirements 标签已就绪，无需补全。")
                return

            print(f"🚀 发现 {len(jobs)} 条待处理数据，开始提取标签...")

            for job in jobs:
                req_data = extract_job_requirements(
                    job['job_name'],
                    job['min_salary_k'],
                    job['max_salary_k'],
                    job['full_detail']
                )

                if req_data:
                    sql_update = "UPDATE job_standard_profile SET requirements = %s WHERE id = %s"
                    cursor.execute(sql_update, (json.dumps(req_data, ensure_ascii=False), job['id']))
                    connection.commit()
                    print(f"✅ ID {job['id']} ({job['job_name']}) 标签补全成功")
                else:
                    print(f"⚠️ ID {job['id']} 提取失败，可能是AI输出格式不对")


    finally:
        connection.close()


if __name__ == "__main__":
    main()