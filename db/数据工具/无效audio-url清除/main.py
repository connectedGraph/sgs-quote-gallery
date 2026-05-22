import json
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any

# 配置项
MAX_WORKERS = 10  # 线程池最大线程数
TIMEOUT = 5  # 请求超时时间（秒）
JSON_FILE_PATH = "input.json"  # JSON文件路径（根据实际情况修改）


def check_audio_url(url: str) -> bool:
    """
    检查音频链接是否有效
    :param url: 音频链接
    :return: 有效返回True，无效返回False
    """
    if not url:
        return False
    try:
        # 发送HEAD请求（比GET更轻量，仅获取响应头）
        response = requests.head(url, timeout=TIMEOUT, allow_redirects=True)
        # 检查状态码是否为200，且内容类型为音频
        return response.status_code == 200 and 'audio' in response.headers.get('Content-Type', '')
    except Exception as e:
        # 捕获所有异常，视为链接无效
        print(f"检查链接 {url} 时出错：{e}")
        return False


def process_quote(quote: Dict[str, Any]) -> Dict[str, Any]:
    """
    处理单个技能语录，验证音频链接并修改
    :param quote: 技能语录字典
    :return: 处理后的语录字典
    """
    audio_url = quote.get('audio', '')
    if audio_url and not check_audio_url(audio_url):
        quote['audio'] = ''
        print(f"链接 {audio_url} 无效，已置空")
    return quote


def process_skill(skill: Dict[str, Any]) -> Dict[str, Any]:
    """
    处理单个技能，使用多线程处理其下的所有语录
    :param skill: 技能字典
    :return: 处理后的技能字典
    """
    quotes = skill.get('quotes', [])
    if not quotes:
        return skill

    # 使用线程池处理所有语录
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # 提交任务并获取结果
        future_to_quote = {executor.submit(process_quote, quote): quote for quote in quotes}
        processed_quotes = []
        for future in as_completed(future_to_quote):
            processed_quotes.append(future.result())

    # 保持原顺序（可选，根据需求）
    skill['quotes'] = processed_quotes
    return skill


def process_hero(hero: Dict[str, Any]) -> Dict[str, Any]:
    """
    处理单个英雄，使用多线程处理其下的所有技能
    :param hero: 英雄字典
    :return: 处理后的英雄字典
    """
    skills = hero.get('skills', [])
    if not skills:
        return hero

    # 使用线程池处理所有技能
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_skill = {executor.submit(process_skill, skill): skill for skill in skills}
        processed_skills = []
        for future in as_completed(future_to_skill):
            processed_skills.append(future.result())

    # 保持原顺序（可选）
    hero['skills'] = processed_skills
    return hero


def main():
    """
    主函数：读取JSON，处理数据，保存结果
    """
    # 1. 读取JSON数据
    try:
        with open(JSON_FILE_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"文件 {JSON_FILE_PATH} 未找到")
        return
    except json.JSONDecodeError as e:
        print(f"JSON解析错误：{e}")
        return

    # 2. 处理所有英雄
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_hero = {executor.submit(process_hero, hero): hero for hero in data}
        processed_data = []
        for future in as_completed(future_to_hero):
            processed_data.append(future.result())

    # 3. 保存处理后的JSON数据
    output_file = "output.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(processed_data, f, ensure_ascii=False, indent=2)

    print(f"处理完成，结果已保存至 {output_file}")


if __name__ == "__main__":
    main()