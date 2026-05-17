#!/usr/bin/env python3
"""
深度前端代码分析工具
Deep Frontend Code Analysis Tool

分析未使用的组件、样式、翻译键以及重复代码
Analyzes unused components, styles, translation keys, and duplicate code
"""

import json
import re
from pathlib import Path
from collections import defaultdict


class FrontendAnalyzer:
    def __init__(self, src_dir="src"):
        self.src_dir = Path(src_dir)
        self.results = {
            "unused_translations": [],
            "unused_components": [],
            "unused_styles": [],
            "duplicate_code": [],
            "large_files": [],
            "complex_components": [],
            "import_analysis": defaultdict(list),
        }

    def get_all_files(self, extensions=None):
        """递归获取所有指定扩展名的文件"""
        if extensions is None:
            extensions = [".tsx", ".ts", ".jsx", ".js", ".css"]

        files = []
        for ext in extensions:
            files.extend(self.src_dir.rglob(f"*{ext}"))

        return [f for f in files if "node_modules" not in str(f)]

    def analyze_file_sizes(self):
        """分析文件大小，找出超大文件"""
        print("📏 Analyzing file sizes...")

        files = self.get_all_files()
        large_threshold = 500  # lines

        for file_path in files:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    lines = len(f.readlines())

                if lines > large_threshold:
                    self.results["large_files"].append(
                        {
                            "file": str(file_path.relative_to(self.src_dir.parent)),
                            "lines": lines,
                            "size_kb": file_path.stat().st_size / 1024,
                        }
                    )
            except Exception:
                pass

        self.results["large_files"].sort(key=lambda x: x["lines"], reverse=True)

    def analyze_component_complexity(self):
        """分析组件复杂度"""
        print("🧩 Analyzing component complexity...")

        component_files = [f for f in self.get_all_files([".tsx", ".jsx"]) if "components" in str(f)]

        for file_path in component_files:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                # 计算各种复杂度指标
                metrics = {
                    "file": str(file_path.relative_to(self.src_dir.parent)),
                    "lines": len(content.split("\n")),
                    "hooks_count": len(re.findall(r"use[A-Z]\w+", content)),
                    "state_count": len(re.findall(r"useState|useReducer", content)),
                    "effect_count": len(re.findall(r"useEffect", content)),
                    "props_drilling": content.count("props."),
                    "jsx_elements": content.count("<"),
                }

                # 复杂度评分 (简化版)
                complexity = (
                    metrics["hooks_count"] * 2
                    + metrics["state_count"] * 3
                    + metrics["effect_count"] * 4
                    + metrics["props_drilling"]
                    + (metrics["lines"] / 50)
                )

                if complexity > 50:  # 复杂度阈值
                    metrics["complexity_score"] = round(complexity, 2)
                    self.results["complex_components"].append(metrics)

            except Exception:
                pass

        self.results["complex_components"].sort(key=lambda x: x["complexity_score"], reverse=True)

    def analyze_imports(self):
        """分析导入关系，找出未使用的导入"""
        print("📦 Analyzing import relationships...")

        files = self.get_all_files([".tsx", ".ts", ".jsx", ".js"])

        for file_path in files:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                # 提取所有 import 语句
                imports = re.findall(r'import\s+(?:{([^}]+)}|(\w+))\s+from\s+[\'"]([^\'"]+)[\'"]', content)

                for imp in imports:
                    named_imports = imp[0]
                    from_path = imp[2]

                    # 检查命名导入
                    if named_imports:
                        for name in named_imports.split(","):
                            name = name.strip()
                            # 简单检查：在导入后的代码中是否使用
                            if name and not re.search(rf"\b{re.escape(name)}\b", content[content.find(str(imp)) :]):
                                self.results["import_analysis"]["potentially_unused"].append(
                                    {
                                        "file": str(file_path.relative_to(self.src_dir.parent)),
                                        "import": name,
                                        "from": from_path,
                                    }
                                )

            except Exception:
                pass

    def analyze_css_usage(self):
        """分析 CSS 类和样式的使用情况"""
        print("🎨 Analyzing CSS usage...")

        css_files = self.get_all_files([".css"])
        source_files = self.get_all_files([".tsx", ".jsx", ".ts", ".js"])

        # 读取所有源文件内容
        all_source_content = []
        for file_path in source_files:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    all_source_content.append(f.read())
            except Exception:
                pass

        all_sources = "\n".join(all_source_content)

        # 检查每个 CSS 文件
        for css_file in css_files:
            try:
                with open(css_file, "r", encoding="utf-8") as f:
                    content = f.read()

                # 提取所有 class 定义
                classes = re.findall(r"\.([a-zA-Z][\w-]*)\s*{", content)

                unused_classes = []
                for cls in classes:
                    # 检查是否在源文件中使用
                    if cls not in all_sources:
                        unused_classes.append(cls)

                if len(unused_classes) > 10:  # 如果有超过10个未使用的类
                    self.results["unused_styles"].append(
                        {
                            "file": str(css_file.relative_to(self.src_dir.parent)),
                            "unused_classes_count": len(unused_classes),
                            "sample_classes": unused_classes[:5],
                        }
                    )

            except Exception:
                pass

    def find_duplicate_code(self):
        """查找重复代码片段（简化版）"""
        print("🔍 Searching for duplicate code...")

        files = self.get_all_files([".tsx", ".jsx"])
        code_blocks = defaultdict(list)

        for file_path in files:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    lines = f.readlines()

                # 查找函数定义
                for i, line in enumerate(lines):
                    if re.match(r"\s*(const|function)\s+\w+.*=.*\(", line):
                        # 获取接下来的10行作为代码块
                        block = "".join(lines[i : i + 10])
                        # 移除空白进行比较
                        normalized = re.sub(r"\s+", "", block)

                        if len(normalized) > 100:  # 只检查较大的代码块
                            code_blocks[normalized].append(
                                {"file": str(file_path.relative_to(self.src_dir.parent)), "line": i + 1}
                            )
            except Exception:
                pass

        # 找出重复的代码块
        for block_hash, locations in code_blocks.items():
            if len(locations) > 1:
                self.results["duplicate_code"].append({"locations": locations, "count": len(locations)})

    def generate_report(self):
        """生成分析报告"""
        print("\n" + "=" * 60)
        print("📊 DEEP ANALYSIS REPORT")
        print("=" * 60 + "\n")

        # 1. 大文件报告
        if self.results["large_files"]:
            print(f"📏 Large Files ({len(self.results['large_files'])} files > 500 lines):")
            for item in self.results["large_files"][:5]:
                print(f"   • {item['file']}: {item['lines']} lines ({item['size_kb']:.1f} KB)")
            print()

        # 2. 复杂组件报告
        if self.results["complex_components"]:
            print(f"🧩 Complex Components ({len(self.results['complex_components'])} components):")
            for item in self.results["complex_components"][:5]:
                print(f"   • {item['file']} (score: {item['complexity_score']})")
                print(
                    f"     - {item['hooks_count']} hooks, {item['state_count']} states, {item['effect_count']} effects"
                )
            print()

        # 3. 未使用的样式
        if self.results["unused_styles"]:
            print("🎨 CSS Files with Many Unused Classes:")
            for item in self.results["unused_styles"]:
                print(f"   • {item['file']}: ~{item['unused_classes_count']} unused classes")
                print(f"     Sample: {', '.join(item['sample_classes'])}")
            print()

        # 4. 重复代码
        if self.results["duplicate_code"]:
            print(f"🔍 Duplicate Code Blocks ({len(self.results['duplicate_code'])} found):")
            for item in self.results["duplicate_code"][:3]:
                print(f"   • Found in {item['count']} locations:")
                for loc in item["locations"][:2]:
                    print(f"     - {loc['file']}:{loc['line']}")
            print()

        # 保存 JSON 报告
        with open("deep-analysis-report.json", "w") as f:
            json.dump(self.results, f, indent=2, default=str)

        print("=" * 60)
        print("✅ Full report saved to: deep-analysis-report.json")
        print("=" * 60 + "\n")

        # 生成建议
        self.generate_recommendations()

    def generate_recommendations(self):
        """生成优化建议"""
        print("\n💡 RECOMMENDATIONS:\n")

        if self.results["large_files"]:
            print("1. 📏 Large Files:")
            print("   Consider splitting large files into smaller, focused components")
            print()

        if self.results["complex_components"]:
            print("2. 🧩 Complex Components:")
            print("   Refactor complex components by:")
            print("   - Extracting custom hooks")
            print("   - Splitting into smaller sub-components")
            print("   - Using composition patterns")
            print()

        if self.results["duplicate_code"]:
            print("3. 🔍 Duplicate Code:")
            print("   Create reusable utilities or components for duplicated logic")
            print()

        print("4. 🎯 General Tips:")
        print("   - Use React.memo() for expensive components")
        print("   - Implement code splitting with dynamic imports")
        print("   - Consider using a state management library for complex state")
        print()


def main():
    print("╔════════════════════════════════════════════╗")
    print("║  Deep Frontend Code Analysis Tool         ║")
    print("║  AC215-HERM Project                        ║")
    print("╚════════════════════════════════════════════╝\n")

    analyzer = FrontendAnalyzer()

    # 运行所有分析
    analyzer.analyze_file_sizes()
    analyzer.analyze_component_complexity()
    analyzer.analyze_css_usage()
    analyzer.find_duplicate_code()
    # analyzer.analyze_imports()  # 可选，可能产生误报

    # 生成报告
    analyzer.generate_report()


if __name__ == "__main__":
    main()
