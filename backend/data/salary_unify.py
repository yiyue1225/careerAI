import re


def parse_salary_v2(salary_str):

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


# --- 测试部分 ---
test_cases = [
    "3000-4000元", "120-150元/天", "1-1.3万", "6000-8000元·14薪",
    "1.5-3万·14薪", "1.2-2.4万", "4.5-5万", "面议"
]

for tc in test_cases:
    l, h = parse_salary_v2(tc)
    print(f"原始: {tc.ljust(15)} -> 结果: 最低 {l}K, 最高 {h}K")