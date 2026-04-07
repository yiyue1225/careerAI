import dashscope
from dashscope import Generation
import requests

# ====================== 第一步：配置关键参数（你只需要改这2处！） ======================
# 1. 你的通义千问 API-KEY（获取地址：https://dashscope.console.aliyun.com/apiKey）
DASHSCOPE_API_KEY = "sk-de170b55d9b24b74919fb1b1e69c97e6"

# 2. 你的 RagFlow 知识库问答接口（获取方式：RagFlow→智能助手→设置→API调用→复制问答接口地址）
RAGFLOW_API_URL = "替换成你的RagFlow智能助手API地址"

# ====================== 第二步：调用 RagFlow 知识库（获取精准回答素材） ======================
def get_ragflow_knowledge(question):
    """
    调用RagFlow知识库，获取和问题相关的精准数据（替代直接查数据库）
    :param question: 用户的职业规划问题（比如"Java开发工程师要学什么"）
    :return: 知识库返回的精准素材
    """
    # RagFlow API 请求参数（不用改）
    ragflow_params = {
        "question": question,
        "stream": False,  # 非流式输出，直接返回完整结果
        "rerank_top_k": 3,  # 取知识库中最相关的3条内容
        "score_threshold": 0.5  # 只取相似度≥0.5的内容，保证精准
    }
    
    try:
        # 发送请求到RagFlow
        response = requests.post(RAGFLOW_API_URL, json=ragflow_params)
        response.raise_for_status()  # 检查请求是否成功
        rag_data = response.json()
        
        # 提取知识库返回的核心内容
        if "answer" in rag_data:
            return rag_data["answer"]
        else:
            return "未在知识库中找到相关信息"
    except Exception as e:
        return f"知识库调用失败：{str(e)}"

# ====================== 第三步：调用通义千问大模型 ======================
def call_qwen_model(question):
    """
    调用通义千问大模型，结合RagFlow知识库内容生成回答
    :param question: 用户的职业规划问题
    :return: 大模型生成的最终回答
    """
    # 1. 先从RagFlow获取知识库素材（替代查数据库）
    knowledge_content = get_ragflow_knowledge(question)
    
    # 2. 构造大模型的提示词（让大模型基于知识库回答）
    prompt = f"""
    你是大学生职业规划智能顾问，仅基于以下知识库内容回答问题，禁止编造信息：
    【知识库内容】
    {knowledge_content}
    
    【用户问题】
    {question}
    
    【回答要求】
    1. 语言通俗易懂，分点说明；
    2. 只讲知识库中有的内容，没有的话直接说"暂无相关信息"；
    3. 结尾加1条针对性的学习建议。
    """
    
    # 3. 调用通义千问大模型
    dashscope.api_key = DASHSCOPE_API_KEY
    try:
        # 调用千问轻量版（免费、速度快，适合演示）
        response = Generation.call(
            model='qwen-turbo',  # 千问免费版模型
            messages=[{'role': 'user', 'content': prompt}],
            result_format='message',
            temperature=0.1,  # 温度越低，回答越精准（避免编造）
            top_p=0.8
        )
        
        # 提取大模型的回答
        if response.status_code == 200:
            return response.output.choices[0].message.content
        else:
            return f"大模型调用失败：{response.code} - {response.message}"
    except Exception as e:
        return f"大模型调用异常：{str(e)}"

# ====================== 第四步：测试运行（直接执行） ======================
if __name__ == "__main__":
    # 测试问题（你可以换成任意职业规划问题）
    test_question = "我是计算机专业大三学生，想做人工智能工程师，需要学什么技能？"
    
    # 调用大模型获取回答
    final_answer = call_qwen_model(test_question)
    
    # 打印结果
    print("="*50)
    print("用户问题：", test_question)
    print("="*50)
    print("大模型回答：\n", final_answer)