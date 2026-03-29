import pymysql
import pandas as pd
import os

# 1. 数据库配置
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '060701',
    'database': 'career_ai',
    'charset': 'utf8mb4'
}


def export_all_for_ragflow():
    # 创建输出目录
    txt_dir = "rag_job_descriptions"
    csv_dir = "rag_job_tables"
    for d in [txt_dir, csv_dir]:
        if not os.path.exists(d):
            os.makedirs(d)

    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # --- 1. 确保 SQL 里的别名是 job_name ---
            sql_txt = """
                      SELECT p.job_id, \
                             MAX(ji.job_name)                                  AS job_name, \
                             p.basic_requirement, \
                             p.professional_skill, \
                             p.professional_quality, \
                             GROUP_CONCAT(DISTINCT d.skill_name SEPARATOR '、') AS skill_list
                      FROM job_portrait p
                               LEFT JOIN job_info ji ON p.job_id = ji.id
                               LEFT JOIN job_skill js ON p.job_id = js.job_id
                               LEFT JOIN skill_dictionary d ON js.skill_id = d.id
                      GROUP BY p.job_id \
                      """

            cursor.execute(sql_txt)
            jobs = cursor.fetchall()

            print(f"开始生成 {len(jobs)} 个增强型岗位说明书...")

            for job in jobs:
                # --- 2. 修正：这里必须使用 job_name，因为 SQL 别名改了 ---
                name = job['job_name'] if job['job_name'] else f"岗位_{job['job_id']}"

                content = f"""
岗位识别码：ID_{job['job_id']}
【官方岗位名称】：{name}

【A13 维度画像数据】
- 基础评分：{job['basic_requirement']}
- 专业评分：{job['professional_skill']}
- 素质评分：{job['professional_quality']}

【核心技能清单】
- 详情：{job['skill_list'] if job['skill_list'] else '通用能力'}

【专家分析报告】
该岗位({name})要求专业技能分为 {job['professional_skill']}。
核心考察：{job['skill_list'] if job['skill_list'] else '基础通用素质'}。
################################################################
"""
                # 执行写入
                file_path = os.path.join(txt_dir, f"job_{job['job_id']}.txt")
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content.strip())

            # --- 3. 导出 CSV (用于上传 RagFlow Table 模式) ---
            print("正在同步导出 CSV 数据表...")
            # 导出带名称的画像全表
            df_portrait = pd.read_sql(
                "SELECT p.*, ji.job_name FROM job_portrait p LEFT JOIN job_info ji ON p.job_id = ji.id", conn)
            df_portrait.to_csv(os.path.join(csv_dir, "job_portrait_data.csv"), index=False, encoding='utf-8-sig')

            # 导出原始 job_info 全表 (即你说的“原件”)
            df_info = pd.read_sql("SELECT * FROM job_info", conn)
            df_info.to_csv(os.path.join(csv_dir, "job_info_original.csv"), index=False, encoding='utf-8-sig')

            print("✅ 全部生成成功！")

    except Exception as e:
        print(f"❌ 运行出错: {e}")
    finally:
        conn.close()
        print("Info: 数据库连接已安全关闭")


if __name__ == "__main__":
    export_all_for_ragflow()