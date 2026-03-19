import pymysql
import pandas as pd

# 1. 数据库配置
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '060701',
    'database': 'career_ai',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}


def get_job_recommendations(student_rag_profile):
    """
    根据学生画像计算所有岗位的竞争力得分
    :param student_rag_profile: RagFlow 输出的系数，例如 {'skill_depth': 1.3, 'quality_match': 1.1, 'base_match': 1.0}
    """
    conn = pymysql.connect(**db_config)
    try:
        with conn.cursor() as cursor:
            # SQL 逻辑：
            # 1. 以 job_portrait 为主表获取维度数值 (basic, skill, quality)
            # 2. 关联 job_skill 和 skill_dictionary 获取技能名称字符串
            # 3. 关联 weight_config (这里假设你已经按 id 或 category 建立了权重)
            # 如果目前没有 category 关联，我们先用程序内置的默认权重
            sql = """
                  SELECT p.job_id, \
                         p.basic_requirement, \
                         p.professional_skill, \
                         p.professional_quality, \
                         GROUP_CONCAT(d.skill_name SEPARATOR ' / ') as skill_tags
                  FROM job_portrait p
                           LEFT JOIN job_skill js ON p.job_id = js.job_id
                           LEFT JOIN skill_dictionary d ON js.skill_id = d.id
                  GROUP BY p.job_id \
                  """
            cursor.execute(sql)
            jobs = cursor.fetchall()

            # --- 设置权重配置 (若数据库 weight_config 已写好，可改为 SQL Join 获取) ---
            # 这里先定义一套默认权重
            W_BASIC = 0.2
            W_SKILL = 0.5
            W_QUALITY = 0.3
            MIN_BUFFER = 3  # 补偿常数，解决你提到的 0 值不准确问题

            results = []
            for job in jobs:
                # 核心公式计算：(数据库数量 + 补偿) * RagFlow深度系数 * 维度权重

                # 基础要求分 (处理 0 值)
                score_b = (job['basic_requirement'] + MIN_BUFFER) * student_rag_profile['base_match'] * W_BASIC

                # 专业技能分 (处理 0 值)
                score_s = (job['professional_skill'] + MIN_BUFFER) * student_rag_profile['skill_depth'] * W_SKILL

                # 职业素质分 (处理 0 值)
                score_q = (job['professional_quality'] + MIN_BUFFER) * student_rag_profile['quality_match'] * W_QUALITY

                final_score = score_b + score_s + score_q

                results.append({
                    "岗位ID": job['job_id'],
                    "竞争力得分": round(final_score, 2),
                    "基础/技能/素质(原始)": f"{job['basic_requirement']}/{job['professional_skill']}/{job['professional_quality']}",
                    "技能标签": job['skill_tags'] if job['skill_tags'] else "无标签数据"
                })

            # 排序
            df = pd.DataFrame(results).sort_values(by="竞争力得分", ascending=False)
            return df

    finally:
        conn.close()


# --- 模拟运行 ---
# 假设 RagFlow 对学生简历的评估结果
student_eval = {
    'base_match': 1.2,  # 学历或经验超标
    'skill_depth': 1.5,  # 技术极其资深
    'quality_match': 1.0  # 素质匹配一般
}

recommend_df = get_job_recommendations(student_eval)

print("=== 基于 Job_Portrait 的匹配结果（前5名） ===")
print(recommend_df.head(5))