#!/usr/bin/env python3
"""
Guide collection of background information for technical disclosure documents.
Validate completeness and clarity of provided information.
"""

import json
import re
from pathlib import Path

def get_required_fields():
    """Define required information fields for technical disclosure."""
    return {
        "technical_field": {
            "description": "技术领域",
            "required": True,
            "prompt": "请描述本专利所属的技术领域",
            "validation": lambda x: len(x.strip()) > 10
        },
        "background_technology": {
            "description": "背景技术",
            "required": True,
            "prompt": "请描述现有技术的现状、存在的问题或不足",
            "validation": lambda x: len(x.strip()) > 20
        },
        "technical_problem": {
            "description": "技术问题",
            "required": True,
            "prompt": "本专利要解决的技术问题是什么？",
            "validation": lambda x: len(x.strip()) > 10
        },
        "technical_solution": {
            "description": "技术方案",
            "required": True,
            "prompt": "详细描述本专利的技术方案，包括核心创新点",
            "validation": lambda x: len(x.strip()) > 50
        },
        "beneficial_effects": {
            "description": "有益效果",
            "required": True,
            "prompt": "本专利带来的有益效果或优势是什么？",
            "validation": lambda x: len(x.strip()) > 20
        },
        "embodiment_description": {
            "description": "实施例描述",
            "required": False,
            "prompt": "请提供具体的实施例描述（可选）",
            "validation": lambda x: True
        },
        "drawings_description": {
            "description": "附图说明",
            "required": False,
            "prompt": "请描述附图内容（如有）",
            "validation": lambda x: True
        },
        "implementation_examples": {
            "description": "具体实施方式",
            "required": False,
            "prompt": "请描述具体实施方式（可选）",
            "validation": lambda x: True
        }
    }

def generate_information_guide():
    """Generate comprehensive information collection guide."""
    required_fields = get_required_fields()

    guide = "# 技术交底书信息收集指南\n\n"
    guide += "请根据以下提示提供相关信息：\n\n"

    for field_id, field_info in required_fields.items():
        required_mark = "（必需）" if field_info["required"] else "（可选）"
        guide += f"## {field_info['description']}{required_mark}\n"
        guide += f"{field_info['prompt']}\n\n"

    guide += "## 信息验证标准\n"
    guide += "1. 技术领域：至少10个字符，明确技术范畴\n"
    guide += "2. 背景技术：至少20个字符，描述现有技术问题\n"
    guide += "3. 技术问题：至少10个字符，明确要解决的问题\n"
    guide += "4. 技术方案：至少50个字符，详细描述创新点\n"
    guide += "5. 有益效果：至少20个字符，说明技术优势\n\n"

    guide += "请确保信息准确、完整，这将直接影响技术交底书的质量。"

    return guide

def validate_information(info_dict):
    """Validate collected information for completeness."""
    required_fields = get_required_fields()
    validation_results = {
        "valid": True,
        "missing_fields": [],
        "incomplete_fields": [],
        "suggestions": []
    }

    for field_id, field_info in required_fields.items():
        if field_info["required"]:
            if field_id not in info_dict or not info_dict[field_id]:
                validation_results["valid"] = False
                validation_results["missing_fields"].append(field_info["description"])
            else:
                # Validate content
                if not field_info["validation"](info_dict[field_id]):
                    validation_results["valid"] = False
                    validation_results["incomplete_fields"].append(field_info["description"])

    # Generate suggestions
    if validation_results["missing_fields"]:
        validation_results["suggestions"].append(
            f"请补充以下必需信息：{', '.join(validation_results['missing_fields'])}"
        )

    if validation_results["incomplete_fields"]:
        validation_results["suggestions"].append(
            f"以下信息需要更详细：{', '.join(validation_results['incomplete_fields'])}"
        )

    return validation_results

def parse_user_input(user_input):
    """Parse user input to extract structured information."""
    # This is a simple implementation - in practice, this would use more
    # sophisticated NLP techniques or structured input forms
    parsed_info = {}

    # Look for common patterns in user input
    patterns = {
        "technical_field": r"技术领域[：:]\s*(.*?)(?=\n|$)",
        "background_technology": r"背景技术[：:]\s*(.*?)(?=\n|$)",
        "technical_problem": r"技术问题[：:]\s*(.*?)(?=\n|$)",
        "technical_solution": r"技术方案[：:]\s*(.*?)(?=\n|$)",
        "beneficial_effects": r"有益效果[：:]\s*(.*?)(?=\n|$)"
    }

    for field_id, pattern in patterns.items():
        match = re.search(pattern, user_input, re.DOTALL)
        if match:
            parsed_info[field_id] = match.group(1).strip()

    return parsed_info

def generate_collection_report(info_dict, validation_results):
    """Generate collection status report."""
    report = "# 信息收集状态报告\n\n"

    required_fields = get_required_fields()

    report += "## 收集状态\n"
    for field_id, field_info in required_fields.items():
        status = "✅ 已收集" if field_id in info_dict and info_dict[field_id] else "❌ 未收集"
        required_mark = "（必需）" if field_info["required"] else "（可选）"
        report += f"- {field_info['description']}{required_mark}: {status}\n"

    report += "\n## 验证结果\n"
    if validation_results["valid"]:
        report += "✅ 信息收集完整，可以生成技术交底书草稿\n"
    else:
        report += "⚠️ 信息收集不完整，需要补充以下内容：\n"
        if validation_results["missing_fields"]:
            report += f"- 缺失字段: {', '.join(validation_results['missing_fields'])}\n"
        if validation_results["incomplete_fields"]:
            report += f"- 不完整字段: {', '.join(validation_results['incomplete_fields'])}\n"

    report += "\n## 建议\n"
    if validation_results["suggestions"]:
        for suggestion in validation_results["suggestions"]:
            report += f"- {suggestion}\n"
    else:
        report += "- 所有必需信息已收集完整，可以继续下一步\n"

    return report

def save_collected_info(info_dict, output_dir):
    """Save collected information to JSON file."""
    output_path = Path(output_dir) / "collected_information.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(info_dict, f, ensure_ascii=False, indent=2)
    print(f"Collected information saved to {output_path}")

def main():
    """Main function for information collection."""
    print("=" * 60)
    print("技术交底书信息收集工具")
    print("=" * 60)

    # Generate and display information guide
    guide = generate_information_guide()
    print("\n" + guide)

    # In a real implementation, this would collect user input
    # For now, we'll demonstrate the validation functionality
    print("\n" + "=" * 60)
    print("信息验证演示")
    print("=" * 60)

    # Example collected information
    example_info = {
        "technical_field": "人工智能自然语言处理领域",
        "background_technology": "现有技术在处理长文本时效率较低，准确性有待提高",
        "technical_problem": "如何提高长文本处理的效率和准确性",
        "technical_solution": "采用分层注意力机制和上下文压缩技术，结合深度学习模型优化处理流程",
        "beneficial_effects": "处理速度提高30%，准确性提升15%，资源消耗降低20%"
    }

    print("\n示例收集的信息：")
    for key, value in example_info.items():
        print(f"- {key}: {value[:50]}...")

    # Validate example information
    validation_results = validate_information(example_info)

    print("\n验证结果：")
    if validation_results["valid"]:
        print("✅ 信息收集完整")
    else:
        print("❌ 信息收集不完整")
        if validation_results["missing_fields"]:
            print(f"缺失字段: {validation_results['missing_fields']}")
        if validation_results["incomplete_fields"]:
            print(f"不完整字段: {validation_results['incomplete_fields']}")

    # Generate and save report
    script_dir = Path(__file__).parent
    output_dir = script_dir.parent / "references"
    output_dir.mkdir(exist_ok=True)

    report = generate_collection_report(example_info, validation_results)
    report_path = output_dir / "collection_report.md"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)

    save_collected_info(example_info, output_dir)

    print(f"\n报告已保存至: {report_path}")

if __name__ == "__main__":
    main()