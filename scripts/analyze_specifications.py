#!/usr/bin/env python3
"""
Analyze technical disclosure writing guidelines and sample documents.
Extract key requirements and formatting standards for disclosure documents.
"""

import os
import re
import json
from pathlib import Path

def read_file(file_path):
    """Read file content with error handling."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        with open(file_path, 'r', encoding='gbk') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return ""

def extract_requirements_from_guidelines(content):
    """Extract writing requirements from guidelines."""
    requirements = {
        "structure": [],
        "formatting": [],
        "content": [],
        "terminology": [],
        "sections": []
    }

    # Common patterns for disclosure document requirements
    structure_patterns = [
        r"文档结构[：:]\s*(.*)",
        r"应包括[：:]\s*(.*)",
        r"必须包含[：:]\s*(.*)",
        r"章节[：:]\s*(.*)"
    ]

    formatting_patterns = [
        r"格式要求[：:]\s*(.*)",
        r"字体[：:]\s*(.*)",
        r"字号[：:]\s*(.*)",
        r"间距[：:]\s*(.*)",
        r"标题[：:]\s*(.*)"
    ]

    # Extract structure requirements
    for pattern in structure_patterns:
        matches = re.findall(pattern, content)
        requirements["structure"].extend(matches)

    # Extract formatting requirements
    for pattern in formatting_patterns:
        matches = re.findall(pattern, content)
        requirements["formatting"].extend(matches)

    # Extract common sections
    section_pattern = r"[一二三四五六七八九十]、\s*(.*?)[\n\r]"
    sections = re.findall(section_pattern, content)
    if sections:
        requirements["sections"] = sections

    return requirements

def analyze_sample_structure(content):
    """Analyze sample document structure."""
    structure = {
        "title": "",
        "sections": [],
        "subsections": [],
        "formatting": {}
    }

    # Extract title
    title_match = re.search(r"^#\s+(.*)$", content, re.MULTILINE)
    if title_match:
        structure["title"] = title_match.group(1)

    # Extract section headers
    section_pattern = r"^#{2,3}\s+(.*)$"
    sections = re.findall(section_pattern, content, re.MULTILINE)
    structure["sections"] = sections

    # Count formatting elements
    structure["formatting"]["tables"] = len(re.findall(r"\|.*\|", content))
    structure["formatting"]["lists"] = len(re.findall(r"^\s*[-*]\s+", content, re.MULTILINE))
    structure["formatting"]["code_blocks"] = len(re.findall(r"```", content))

    return structure

def generate_specification_summary(guidelines_content, sample_content):
    """Generate comprehensive specification summary."""
    requirements = extract_requirements_from_guidelines(guidelines_content)
    sample_structure = analyze_sample_structure(sample_content)

    specification = {
        "writing_requirements": requirements,
        "sample_analysis": sample_structure,
        "comprehensive_specs": {
            "document_structure": [],
            "required_sections": [],
            "formatting_rules": [],
            "content_guidelines": []
        }
    }

    # Combine requirements from guidelines and sample
    if requirements["sections"]:
        specification["comprehensive_specs"]["required_sections"] = requirements["sections"]
    elif sample_structure["sections"]:
        specification["comprehensive_specs"]["required_sections"] = sample_structure["sections"]

    # Add formatting rules
    if requirements["formatting"]:
        specification["comprehensive_specs"]["formatting_rules"] = requirements["formatting"]

    # Generate document structure template
    if sample_structure["sections"]:
        specification["comprehensive_specs"]["document_structure"] = [
            {"section": section, "required": True, "description": f"标准章节：{section}"}
            for section in sample_structure["sections"]
        ]

    return specification

def save_specification_summary(specification, output_path):
    """Save specification summary to file."""
    # Save as JSON for programmatic use
    json_path = output_path / "specification.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(specification, f, ensure_ascii=False, indent=2)

    # Save as Markdown for human reading
    md_path = output_path / "specification_summary.md"
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write("# 技术交底书撰写规范摘要\n\n")

        f.write("## 文档结构要求\n")
        for item in specification["comprehensive_specs"]["document_structure"]:
            f.write(f"- {item['section']}: {'必需' if item['required'] else '可选'}\n")

        f.write("\n## 格式要求\n")
        for rule in specification["comprehensive_specs"]["formatting_rules"]:
            f.write(f"- {rule}\n")

        f.write("\n## 内容要求\n")
        for req in specification["writing_requirements"]["content"]:
            f.write(f"- {req}\n")

        f.write("\n## 样本分析\n")
        f.write(f"- 标题: {specification['sample_analysis']['title']}\n")
        f.write(f"- 章节数量: {len(specification['sample_analysis']['sections'])}\n")
        f.write(f"- 表格数量: {specification['sample_analysis']['formatting']['tables']}\n")
        f.write(f"- 列表数量: {specification['sample_analysis']['formatting']['lists']}\n")

    print(f"Specification saved to {json_path} and {md_path}")

def main():
    """Main analysis function."""
    # Paths to reference files
    script_dir = Path(__file__).parent
    references_dir = script_dir.parent / "references"

    guidelines_path = references_dir / "writing_guidelines.md"
    sample_path = references_dir / "sample_disclosure.md"

    # Check if files exist
    if not guidelines_path.exists():
        print(f"Warning: Guidelines file not found at {guidelines_path}")
        print("Please ensure writing_guidelines.md is in the references directory.")
        guidelines_content = ""
    else:
        guidelines_content = read_file(guidelines_path)

    if not sample_path.exists():
        print(f"Warning: Sample file not found at {sample_path}")
        print("Please ensure sample_disclosure.md is in the references directory.")
        sample_content = ""
    else:
        sample_content = read_file(sample_path)

    if not guidelines_content and not sample_content:
        print("Error: No guideline or sample content available for analysis.")
        return

    # Generate specification
    specification = generate_specification_summary(guidelines_content, sample_content)

    # Save results
    save_specification_summary(specification, references_dir)

    print("\nAnalysis complete. Specification summary generated.")
    print(f"Total sections identified: {len(specification['comprehensive_specs']['required_sections'])}")
    print(f"Formatting rules extracted: {len(specification['comprehensive_specs']['formatting_rules'])}")

if __name__ == "__main__":
    main()