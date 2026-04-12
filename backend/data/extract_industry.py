import os
import re
import json
import requests
import pymysql
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

# 1. 环境加载
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)

DIFY_API_KEY = os.getenv('DIFY_API_KEY_EXTRACT_INDUSTRY')  # 👈 确保用的是行业清洗的 KEY
DIFY_BASE_URL = os.getenv('DIFY_API_URL')
DB_CONFIG = {
    "host": os.getenv('DB_HOST'),
    "user": os.getenv('DB_USER'),
    "password": os.getenv('DB_PASS'),
    "database": os.getenv('DB_NAME'),
    "charset": 'utf8mb4',
    "cursorclass": pymysql.cursors.DictCursor
}


def clean_industry_task(job):
    """专门负责清洗行业标签的线程任务"""
    url = f"{DIFY_BASE_URL}/chat-messages"
    headers = {
        "Authorization": f"Bearer {DIFY_API_KEY}",
        "Content-Type": "application/json"
    }

    # 这里的 inputs 必须对应你 Dify 行业清洗应用的变量名
    payload = {
        "inputs": {"raw_industry": job['industry']},
        "query": f"提炼行业标签：{job['industry']}",
        "response_mode": "blocking",
        "user": "industry_cleaner"
    }

    try:
        # 增加 timeout 防止假死，绕过代理
        response = requests.post(url, json=payload, headers=headers, timeout=30, proxies={"http": None, "https": None})
        if response.status_code != 200:
            return job['id'], None

        answer = response.json().get('answer', '')
        # 抓取 AI 返回的 JSON 数组 [ "标签1", "标签2" ]
        json_match = re.search(r'\[.*\]', answer, re.DOTALL)
        if json_match:
            return job['id'], json.loads(json_match.group())
        return job['id'], None
    except Exception:
        return job['id'], None


def main():
    connection = pymysql.connect(**DB_CONFIG)
    success_count = 0  # 👈 提前初始化，解决报错

    try:
        with connection.cursor() as cursor:
            # 2. 核心 SQL 修改：筛选 clean_industry 为空的数据
            sql_select = "SELECT id, industry FROM job_standard_profile WHERE clean_industry IS NULL"
            cursor.execute(sql_select)
            jobs = cursor.fetchall()

            if not jobs:
                print("✨ 所有的 clean_industry 已经清洗完毕！")
                return

            print(f"🚀 发现 {len(jobs)} 条行业数据待清洗，启动多线程模式...")

            # 3. 开启并发处理
            with ThreadPoolExecutor(max_workers=10) as executor:
                future_to_job = {executor.submit(clean_industry_task, job): job for job in jobs}

                for future in as_completed(future_to_job):
                    job_id, tags = future.result()

                    if tags is not None:
                        # 即时更新数据库
                        with connection.cursor() as update_cursor:
                            sql_update = "UPDATE job_standard_profile SET clean_industry = %s WHERE id = %s"
                            update_cursor.execute(sql_update, (json.dumps(tags, ensure_ascii=False), job_id))
                        connection.commit()

                        success_count += 1
                        if success_count % 20 == 0:
                            print(f"📊 已清洗: {success_count}/{len(jobs)}")
                    else:
                        print(f"⚠️ ID {job_id} 行业提炼失败")

    finally:
        connection.close()
        print(f"✅ 行业清洗任务结束，本次共处理 {success_count} 条数据。")


if __name__ == "__main__":
    main()