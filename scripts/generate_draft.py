#!/usr/bin/env python3
"""
Generate initial technical disclosure draft based on collected information.
Apply formatting and structural requirements from specifications.
"""

import json
import re
from datetime import datetime
from pathlib import Path

def load_specifications():
    """Load specification summary from references directory."""
    script_dir = Path(__file__).parent
    references_dir = script_dir.parent / "references"

    spec_path = references_dir / "specification_summary.md"
    spec_json_path = references_dir / "specification.json"

    specifications = {
        "document_structure": [],
        "formatting_rules": [],
        "required_sections": []
    }

    # Try to load from JSON first
    if spec_json_path.exists():
        try:
            with open(spec_json_path, 'r', encoding='utf-8') as f:
                spec_data = json.load(f)
                if "comprehensive_specs" in spec_data:
                    specs = spec_data["comprehensive_specs"]
                    specifications["document_structure"] = specs.get("document_structure", [])
                    specifications["formatting_rules"] = specs.get("formatting_rules", [])
                    specifications["required_sections"] = specs.get("required_sections", [])
        except Exception as e:
            print(f"Error loading specification JSON: {e}")

    # Fallback to default structure if no specifications found
    if not specifications["required_sections"]:
        specifications["required_sections"] = [
            "技术领域",
            "背景技术",
            "技术问题",
            "技术方案",
            "有益效果",
            "附图说明",
            "具体实施方式"
        ]

    return specifications

def load_collected_information():
    """Load collected information from references directory."""
    script_dir = Path(__file__).parent
    references_dir = script_dir.parent / "references"

    info_path = references_dir / "collected_information.json"

    if info_path.exists():
        try:
            with open(info_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading collected information: {e}")

    # Return empty dict if no information found
    return {}

def generate_document_title(info_dict):
    """Generate document title based on technical field and solution."""
    tech_field = info_dict.get("technical_field", "").strip()
    tech_solution = info_dict.get("technical_solution", "").strip()

    if tech_field and tech_solution:
        # Extract key terms
        field_keywords = re.findall(r"[\u4e00-\u9fa5]{2,4}", tech_field)[:2]
        solution_keywords = re.findall(r"[\u4e00-\u9fa5]{2,4}", tech_solution)[:3]

        if field_keywords and solution_keywords:
            return f"{''.join(field_keywords)}技术领域的{''.join(solution_keywords)}方法及系统"

    return "技术交底书"

def apply_formatting_rules(content, formatting_rules):
    """Apply formatting rules to document content."""
    formatted_content = content

    # Apply basic formatting rules
    for rule in formatting_rules:
        if "字体" in rule and "宋体" in rule:
            formatted_content = formatted_content.replace(
                "# 技术交底书",
                "# 技术交底书\n<!-- 字体: 宋体 -->"
            )
        elif "字号" in rule and ("小四" in rule or "12pt" in rule):
            formatted_content = formatted_content.replace(
                "# 技术交底书",
                "# 技术交底书\n<!-- 字号: 小四 -->"
            )
        elif "间距" in rule and ("1.5倍" in rule or "1.5" in rule):
            formatted_content = formatted_content.replace(
                "# 技术交底书",
                "# 技术交底书\n<!-- 行距: 1.5倍 -->"
            )

    return formatted_content

def generate_section_content(section_name, info_dict):
    """Generate content for specific section based on collected information."""
    section_mapping = {
        "技术领域": "technical_field",
        "背景技术": "background_technology",
        "技术问题": "technical_problem",
        "技术方案": "technical_solution",
        "有益效果": "beneficial_effects",
        "附图说明": "drawings_description",
        "具体实施方式": "implementation_examples",
        "实施例描述": "embodiment_description"
    }

    field_id = section_mapping.get(section_name)
    if field_id and field_id in info_dict:
        content = info_dict[field_id].strip()
        if content:
            return content

    # Default content for missing sections
    default_content = {
        "技术领域": "待补充技术领域描述",
        "背景技术": "待补充背景技术描述",
        "技术问题": "待补充技术问题描述",
        "技术方案": "待补充技术方案描述",
        "有益效果": "待补充有益效果描述",
        "附图说明": "无附图",
        "具体实施方式": "待补充具体实施方式",
        "实施例描述": "待补充实施例描述"
    }

    return default_content.get(section_name, "待补充内容")

def generate_draft_document(info_dict, specifications):
    """Generate complete draft document."""
    # Generate title
    title = generate_document_title(info_dict)

    # Start document
    document = f"# {title}\n\n"

    # Add metadata
    current_date = datetime.now().strftime("%Y年%m月%d日")
    document += f"**文档生成日期**: {current_date}\n"
    document += f"**技术领域**: {info_dict.get('technical_field', '待补充')}\n"
    document += f"**状态**: 草稿\n\n"

    document += "---\n\n"

    # Generate sections
    sections = specifications.get("required_sections", [])
    if not sections:
        sections = [
            "技术领域",
            "背景技术",
            "技术问题",
            "技术方案",
            "有益效果",
            "附图说明",
            "具体实施方式"
        ]

    for i, section_name in enumerate(sections, 1):
        # Use appropriate heading level
        if i == 1:
            heading_level = "##"
        else:
            heading_level = "###"

        document += f"{heading_level} {i}. {section_name}\n\n"

        # Generate section content
        content = generate_section_content(section_name, info_dict)
        document += f"{content}\n\n"

        # Add placeholder for missing required content
        if content.startswith("待补充"):
            document += f"<!-- 需要补充{section_name}的具体内容 -->\n\n"

    # Add document footer
    document += "---\n\n"
    document += "## 文档说明\n\n"
    document += "1. 本文件为技术交底书草稿，基于收集的信息生成\n"
    document += "2. 请仔细核对技术内容的准确性和完整性\n"
    document += "3. 标记为'待补充'的部分需要进一步完善\n"
    document += "4. 建议进行技术审核和格式检查\n\n"

    document += f"**生成工具**: Patent Disclosure Assistant\n"
    document += f"**版本**: 1.0\n"

    # Apply formatting rules
    formatted_document = apply_formatting_rules(
        document,
        specifications.get("formatting_rules", [])
    )

    return formatted_document

def save_draft_document(document_content, output_dir):
    """Save draft document to file."""
    # Create output directory if it doesn't exist
    output_dir.mkdir(exist_ok=True)

    # Generate filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"technical_disclosure_draft_{timestamp}.md"
    filepath = output_dir / filename

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(document_content)

    return filepath

def main():
    """Main function for draft generation."""
    print("=" * 60)
    print("技术交底书草稿生成工具")
    print("=" * 60)

    # Load specifications and collected information
    print("\n加载规范和要求...")
    specifications = load_specifications()
    print(f"识别到 {len(specifications['required_sections'])} 个必需章节")

    print("\n加载收集的技术信息...")
    info_dict = load_collected_information()

    if not info_dict:
        print("警告: 未找到收集的技术信息")
        print("请确保已运行信息收集工具或提供技术信息")
        return

    print(f"加载到 {len(info_dict)} 个信息字段")

    # Validate information completeness
    required_fields = ["technical_field", "background_technology", "technical_problem",
                      "technical_solution", "beneficial_effects"]

    missing_fields = [field for field in required_fields if field not in info_dict or not info_dict[field]]

    if missing_fields:
        print(f"\n警告: 以下必需信息缺失: {', '.join(missing_fields)}")
        print("草稿中将使用占位符内容")

    # Generate draft document
    print("\n生成技术交底书草稿...")
    draft_document = generate_draft_document(info_dict, specifications)

    # Save draft
    script_dir = Path(__file__).parent
    output_dir = script_dir.parent / "outputs" / "drafts"
    output_dir.mkdir(parents=True, exist_ok=True)

    filepath = save_draft_document(draft_document, output_dir)

    print(f"\n✅ 草稿生成完成!")
    print(f"文件保存至: {filepath}")

    # Show document statistics
    word_count = len(re.findall(r'[\u4e00-\u9fa5]', draft_document))
    section_count = len(specifications['required_sections'])

    print(f"\n文档统计:")
    print(f"- 总字数: {word_count} 字")
    print(f"- 章节数: {section_count}")
    print(f"- 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Show missing content warnings
    placeholder_count = draft_document.count("待补充")
    if placeholder_count > 0:
        print(f"\n⚠️ 警告: 文档中包含 {placeholder_count} 处'待补充'内容")
        print("请完善这些部分以确保文档完整性")

if __name__ == "__main__":
    main()