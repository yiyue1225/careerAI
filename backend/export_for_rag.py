import pymysql

# 数据库配置
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '060701',
    'db': 'career_ai',
    'charset': 'utf8mb4'
}


def generate_rag_final():
    try:
        conn = pymysql.connect(**db_config)
        cursor = conn.cursor()

        # 1. 自动探测 job_portrait 的列名
        cursor.execute("SELECT * FROM job_portrait LIMIT 1")
        portrait_cols = [i[0] for i in cursor.description]
        print(f"✅ 探测到 portrait 列名: {portrait_cols}")

        # 2. 自动探测 job_core_skills 的列名
        cursor.execute("SELECT * FROM job_core_skills LIMIT 1")
        core_skill_cols = [i[0] for i in cursor.description]
        print(f"✅ 探测到 core_skills 列名: {core_skill_cols}")

        # 这里的逻辑：portrait 的第1列 关联 core_skills 的第1列
        p_id = portrait_cols[0]
        c_id = core_skill_cols[0]
        # 获取 portrait 的分数名
        p_basic = portrait_cols[1]
        p_pro_skill = portrait_cols[2]
        p_pro_qual = portrait_cols[3]

        # 3. 缝合查询
        sql = f"""
        SELECT 
            jp.{p_id},
            jp.{p_basic},
            jp.{p_pro_skill},
            jp.{p_pro_qual},
            GROUP_CONCAT(DISTINCT sd.skill_name SEPARATOR '、')
        FROM job_portrait jp
        LEFT JOIN job_core_skills jcs ON jp.{p_id} = jcs.{c_id}
        LEFT JOIN skill_dictionary sd ON jcs.skill_id = sd.id
        GROUP BY jp.{p_id}
        LIMIT 100;
        """

        print("正在进行多表缝合，请稍候...")
        cursor.execute(sql)
        rows = cursor.fetchall()

        with open("Career_Knowledge_A13.txt", "w", encoding="utf-8") as f:
            for row in rows:
                content = f"""
岗位识别码：ID_{row[0]}

【A13 维度画像数据】
- 维度1（基础要求评分）：{row[1]}
- 维度2（专业技能评分）：{row[2]}
- 维度3（职业素质评分）：{row[3]}

【核心技能清单】
- 技能详情：{row[4] if row[4] else '通用素质要求'}

【专家分析报告】
该岗位(ID:{row[0]})在专业技能维度的分值为 {row[2]}。
系统检测到该岗位的核心考察点包含：{row[4]}。
建议学生在准备面试时，重点结合上述技能清单进行项目经验的回顾。

################################################################
"""
                f.write(content)

        print(f"🎉 缝合成功！生成的知识库文件在：Career_Knowledge_A13.txt")

    except Exception as e:
        print(f"❌ 还是报错了，请把这一行发给我: {e}")
    finally:
        if 'conn' in locals():
            conn.close()


if __name__ == "__main__":
    generate_rag_final()