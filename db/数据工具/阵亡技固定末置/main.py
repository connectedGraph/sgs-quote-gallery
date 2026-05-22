import json

def sort_skills(json_data):
    """
    处理JSON数据，将skills中name为"阵亡"的技能固定排在最后
    :param json_data: 原始JSON数据（列表形式，包含多个英雄对象）
    :return: 处理后的JSON数据
    """
    for item in json_data:
        # 检查是否存在skills字段
        if "skills" in item and isinstance(item["skills"], list):
            skills = item["skills"]
            # 分离阵亡技能和其他技能
            death_skill = []
            other_skills = []
            for skill in skills:
                if skill.get("name") == "阵亡":
                    death_skill.append(skill)
                else:
                    other_skills.append(skill)
            # 重新组合：其他技能在前，阵亡技能在后
            item["skills"] = other_skills + death_skill
    return json_data

def main():
    # 读取原始JSON文件
    input_file = "input.json"
    output_file = "output.json"  # 输出文件，可改为覆盖原文件（input_file）
    
    try:
        with open(input_file, "r", encoding="utf-8") as f:
            try:
                json_data = json.load(f)
            except json.JSONDecodeError as e:
                print(f"JSON解析错误：{e}")
                return
    except FileNotFoundError:
        print(f"错误：文件 {input_file} 未找到")
        return
    except Exception as e:
        print(f"读取文件时发生错误：{e}")
        return
    
    # 处理数据
    sorted_data = sort_skills(json_data)
    
    # 写入处理后的JSON文件
    try:
        with open(output_file, "w", encoding="utf-8") as f:
            # ensure_ascii=False 保留中文，indent=2 格式化输出
            json.dump(sorted_data, f, ensure_ascii=False, indent=2)
        print(f"处理完成！结果已保存至 {output_file}")
    except Exception as e:
        print(f"写入文件时发生错误：{e}")

if __name__ == "__main__":
    main()