import tkinter as tk
from tkinter import ttk, scrolledtext, filedialog, messagebox
from bs4 import BeautifulSoup
import json
import re

class SkillJsonGenerator:
    def __init__(self, root):
        self.root = root
        self.root.title("技能台词JSON生成器")
        self.root.geometry("1000x700")

        # 初始化变量
        self.hero_name = tk.StringVar()
        self.skin_name = tk.StringVar(value="经典形象")  # 默认值
        self.generated_data = None  # 存储生成的JSON数据

        # 构建界面
        self._create_widgets()

    def _create_widgets(self):
        # 整体布局框架
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # 1. 基础信息输入区域
        info_frame = ttk.LabelFrame(main_frame, text="基础信息", padding="10")
        info_frame.pack(fill=tk.X, pady=(0, 10))

        # 英雄名
        ttk.Label(info_frame, text="英雄名：").grid(row=0, column=0, sticky=tk.W, padx=(0, 5))
        hero_entry = ttk.Entry(info_frame, textvariable=self.hero_name, width=30)
        hero_entry.grid(row=0, column=1, sticky=tk.W, pady=(0, 5))

        # 皮肤名
        ttk.Label(info_frame, text="皮肤名：").grid(row=1, column=0, sticky=tk.W, padx=(0, 5))
        skin_entry = ttk.Entry(info_frame, textvariable=self.skin_name, width=30)
        skin_entry.grid(row=1, column=1, sticky=tk.W, pady=(0, 5))

        # 2. HTML内容输入区域
        html_frame = ttk.LabelFrame(main_frame, text="HTML内容", padding="10")
        html_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))

        # 按钮组（读取文件、清空）
        btn_frame = ttk.Frame(html_frame)
        btn_frame.pack(fill=tk.X, pady=(0, 5))

        ttk.Button(btn_frame, text="读取HTML文件", command=self._load_html_file).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(btn_frame, text="清空内容", command=self._clear_html).pack(side=tk.LEFT)

        # HTML文本框
        self.html_text = scrolledtext.ScrolledText(html_frame, wrap=tk.WORD, height=15)
        self.html_text.pack(fill=tk.BOTH, expand=True)

        # 3. 操作按钮区域
        op_frame = ttk.Frame(main_frame)
        op_frame.pack(fill=tk.X, pady=(0, 10))

        ttk.Button(op_frame, text="生成JSON", command=self._generate_json).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(op_frame, text="保存JSON文件", command=self._save_json).pack(side=tk.LEFT)

        # 4. JSON结果预览区域
        json_frame = ttk.LabelFrame(main_frame, text="JSON结果预览", padding="10")
        json_frame.pack(fill=tk.BOTH, expand=True)

        self.json_text = scrolledtext.ScrolledText(json_frame, wrap=tk.WORD, height=15)
        self.json_text.pack(fill=tk.BOTH, expand=True)

    def _load_html_file(self):
        """读取本地HTML文件内容到文本框"""
        file_path = filedialog.askopenfilename(
            title="选择HTML文件",
            filetypes=[("HTML文件", "*.html;*.htm"), ("所有文件", "*.*")]
        )
        if file_path:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                self.html_text.delete(1.0, tk.END)
                self.html_text.insert(tk.INSERT, content)
            except Exception as e:
                messagebox.showerror("错误", f"读取文件失败：{str(e)}")

    def _clear_html(self):
        """清空HTML文本框"""
        self.html_text.delete(1.0, tk.END)
        self.json_text.delete(1.0, tk.END)
        self.generated_data = None

    def _parse_html(self, html_content):
        """解析HTML内容，提取技能名、台词、音频URL（兼容不同class的音频标签）"""
        soup = BeautifulSoup(html_content, "html.parser")
        skills = {}  # 存储技能：{技能名: [{"text": 台词, "audio": 链接}, ...]}

        # 匹配所有技能项的flex-container（核心选择器）
        skill_items = soup.select("div.flex-container[style*='gap: 5px;']")
        for item in skill_items:
            # 提取技能名
            name_elem = item.find("div", class_="basic-info-row-label")
            if not name_elem:
                continue

            # 处理技能名中的特殊字符（如☆&nbsp;）
            skill_name = re.sub(r"☆\s*", "", name_elem.get_text(strip=True))
            if not skill_name:
                # 尝试从a标签提取
                a_elem = name_elem.find("a")
                if a_elem:
                    skill_name = a_elem.get_text(strip=True)
            if not skill_name:
                continue

            # 提取台词和音频区域
            content_elem = item.find("div", style=lambda s: s and "align-self: center" in s)
            if not content_elem:
                continue

            # 提取所有音频链接（关键：匹配包含bikited-audio的span标签，忽略前缀class）
            audio_elems = content_elem.select("span[class*='bikited-audio']")
            audio_srcs = []
            for audio in audio_elems:
                # 优先取data-src，其次取audio标签的src
                src = audio.get("data-src")
                if not src:
                    audio_tag = audio.find("audio")
                    if audio_tag:
                        src = audio_tag.get("src")
                if src:
                    audio_srcs.append(src)

            # 提取纯文本台词（去除HTML标签）
            raw_text = content_elem.get_text(strip=True)
            # 拆分被/分割的台词（处理中文/英文/全角/半角斜杠）
            text_parts = re.split(r"[/／]", raw_text)
            text_parts = [t.strip() for t in text_parts if t.strip()]  # 过滤空值和空格

            # 配对台词和音频（保证一一对应，数量不一致时音频留空）
            quotes = []
            for idx, text in enumerate(text_parts):
                quote = {
                    "text": text,
                    "audio": audio_srcs[idx] if idx < len(audio_srcs) else "",
                    "explanation": ""  # 预留空的解释字段
                }
                quotes.append(quote)

            # 存入技能字典
            if skill_name in skills:
                skills[skill_name].extend(quotes)
            else:
                skills[skill_name] = quotes

        return skills

    def _generate_json(self):
        """生成指定格式的JSON数据"""
        # 清空之前的结果
        self.json_text.delete(1.0, tk.END)
        self.generated_data = None

        # 获取输入内容
        hero = self.hero_name.get().strip()
        skin = self.skin_name.get().strip()
        html_content = self.html_text.get(1.0, tk.END).strip()

        # 验证输入
        if not hero:
            messagebox.showwarning("警告", "请输入英雄名！")
            return
        if not html_content:
            messagebox.showwarning("警告", "请输入或读取HTML内容！")
            return

        try:
            # 解析HTML
            skills_dict = self._parse_html(html_content)

            # 关键：判断是否匹配到技能数据
            if not skills_dict:
                messagebox.showerror("解析失败", "未匹配到任何技能数据，请检查HTML格式是否符合要求！")
                return

            # 构建skills列表（阵亡排最后）
            skills_list = []
            death_skill = None
            for name, quotes in skills_dict.items():
                if name == "阵亡":
                    death_skill = {"name": name, "quotes": quotes}
                else:
                    skills_list.append({"name": name, "quotes": quotes})
            # 追加阵亡技能
            if death_skill:
                skills_list.append(death_skill)

            # 构建最终JSON结构
            final_data = {
                "hero": hero,
                "skin": skin,
                "skills": skills_list
            }
            self.generated_data = final_data

            # 格式化JSON并显示
            json_str = json.dumps(final_data, ensure_ascii=False, indent=2)
            self.json_text.insert(tk.INSERT, json_str)

        except Exception as e:
            messagebox.showerror("错误", f"生成JSON失败：{str(e)}")
            return None

    def _save_json(self):
        """保存生成的JSON到文件"""
        if not self.generated_data:
            messagebox.showwarning("警告", "暂无有效JSON内容可保存！")
            return

        # 选择保存路径
        file_path = filedialog.asksaveasfilename(
            title="保存JSON文件",
            defaultextension=".json",
            filetypes=[("JSON文件", "*.json"), ("所有文件", "*.*")]
        )
        if file_path:
            try:
                # 格式化写入
                json_str = json.dumps(self.generated_data, ensure_ascii=False, indent=2)
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(json_str)
                messagebox.showinfo("成功", f"JSON文件已保存至：{file_path}")
            except Exception as e:
                messagebox.showerror("错误", f"保存文件失败：{str(e)}")

if __name__ == "__main__":
    root = tk.Tk()
    app = SkillJsonGenerator(root)
    root.mainloop()