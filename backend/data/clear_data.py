import os
import re
import pymysql
from dotenv import load_dotenv

# 1. 环境加载
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)


def parse_salary(salary_str):

    if not salary_str or '面议' in salary_str or 'None' in salary_str:
        return 0, 0


    clean_str = re.sub(r'·\d+薪', '', salary_str)


    nums = re.findall(r'(\d+\.?\d*)', clean_str)
    if not nums:
        return 0, 0

    low = float(nums[0])
    high = float(nums[1]) if len(nums) > 1 else low


    if '元/天' in clean_str:
        low = (low * 21.75) / 1000  # 工业标准按每月21.75个工作日算
        high = (high * 21.75) / 1000


    elif '万' in clean_str:
        low = low * 10
        high = high * 10

    # 情况 C: 以“元”为单位且是大数字 (3000-4000元, 5000-8000元)
    elif '元' in clean_str and low > 100:
        low = low / 1000
        high = high / 1000

    # 情况 D: 只有数字没有单位（如 1.2-2.4，通常默认为万）
    elif low < 100 and '元' not in clean_str:
        low = low * 10
        high = high * 10

    return round(low, 2), round(high, 2)


def main():
    # 2. 连接数据库
    db = pymysql.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASS'),
        database=os.getenv('DB_NAME'),
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

    try:
        with db.cursor() as cursor:
            # 读取原表数据 (job_info)
            cursor.execute("SELECT id, job_name, address, salary_range, job_detail FROM job_info")
            rows = cursor.fetchall()
            print(f"找到 {len(rows)} 条原始数据，开始清洗...")

            for row in rows:
                # 清洗地址 (取第一个词作为城市)
                city = row['address'].split('-')[0] if row['address'] else "未知"

                # 清洗薪资
                min_k, max_k = parse_salary(row['salary_range'])

                # 清洗描述 (简单去除 URL)
                clean_desc = re.sub(r'https?://\S+', '', row['job_detail'])

                # 3. 写入新表 (INSERT 语句)
                sql_insert = """
                             INSERT INTO job_standard_profile
                                 (job_info_id, job_name, city, min_salary_k, max_salary_k, full_detail)
                             VALUES (%s, %s, %s, %s, %s, %s) \
                             """
                cursor.execute(sql_insert, (row['id'], row['job_name'], city, min_k, max_k, clean_desc))

            # 4. 核心：提交更改到数据库
            db.commit()
            print("🚀 清洗完成！数据已同步至 job_standard_profile 表。")

    finally:
        db.close()


if __name__ == "__main__":
    main()