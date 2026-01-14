#!/usr/bin/env python3
"""
Review technical disclosure draft against specifications.
Identify areas requiring improvement or correction.
"""

import json
import re
from pathlib import Path

def load_specifications():
    """Load specification summary from references directory."""
    script_dir = Path(__file__).parent
    references_dir = script_dir.parent / "references"

    spec_json_path = references_dir / "specification.json"

    specifications = {
        "document_structure": [],
        "formatting_rules": [],
        "required_sections": [],
        "content_requirements": []
    }

    # Try to load from JSON
    if spec_json_path.exists():
        try:
            with open(spec_json_path, 'r', encoding='utf-8') as f:
                spec_data = json.load(f)
                if "comprehensive_specs" in spec_data:
                    specs = spec_data["comprehensive_specs"]
                    specifications["document_structure"] = specs.get("document_structure", [])
                    specifications["formatting_rules"] = specs.get("formatting_rules", [])
                    specifications["required_sections"] = specs.get("required_sections", [])
                if "writing_requirements" in spec_data:
                    specifications["content_requirements"] = spec_data["writing_requirements"].get("content", [])
        except Exception as e:
            print(f"Error loading specification JSON: {e}")

    return specifications

def load_latest_draft():
    """Load the most recent draft document from outputs directory."""
    script_dir = Path(__file__).parent
    drafts_dir = script_dir.parent / "outputs" / "drafts"

    if not drafts_dir.exists():
        return None, None

    # Find all draft files
    draft_files = list(drafts_dir.glob("technical_disclosure_draft_*.md"))
    if not draft_files:
        return None, None

    # Get the most recent file
    latest_file = max(draft_files, key=lambda x: x.stat().st_mtime)

    try:
        with open(latest_file, 'r', encoding='utf-8') as f:
            content = f.read()
        return content, latest_file
    except Exception as e:
        print(f"Error loading draft file: {e}")
        return None, latest_file

def check_section_completeness(draft_content, required_sections):
    """Check if all required sections are present in the draft."""
    missing_sections = []
    present_sections = []

    for section in required_sections:
        # Look for section headers (## or ### followed by section name)
        pattern = f"#{{2,3}}\\s+\\d+\\.\\s*{re.escape(section)}"
        if re.search(pattern, draft_content):
            present_sections.append(section)
        else:
            # Also check without numbering
            pattern2 = f"#{{2,3}}\\s+{re.escape(section)}"
            if re.search(pattern2, draft_content):
                present_sections.append(section)
            else:
                missing_sections.append(section)

    return present_sections, missing_sections

def check_content_quality(draft_content):
    """Check content quality and completeness."""
    issues = []

    # Check for placeholder content
    placeholder_patterns = [
        r"待补充",
        r"待完善",
        r"TODO",
        r"FIXME",
        r"<!--.*?需要补充.*?-->"
    ]

    for pattern in placeholder_patterns:
        matches = re.findall(pattern, draft_content, re.IGNORECASE)
        if matches:
            issues.append({
                "type": "placeholder_content",
                "count": len(matches),
                "description": f"发现 {len(matches)} 处占位符内容需要补充"
            })

    # Check section length
    sections = re.findall(r"#+\s+.*?\n\n(.*?)(?=#+\s+|$)", draft_content, re.DOTALL)
    for i, section_content in enumerate(sections):
        word_count = len(re.findall(r'[\u4e00-\u9fa5]', section_content))
        if word_count < 20:
            issues.append({
                "type": "short_section",
                "section_index": i,
                "word_count": word_count,
                "description": f"第 {i+1} 个章节内容过短 ({word_count} 字)"
            })

    # Check technical terms consistency
    technical_terms = re.findall(r'[\u4e00-\u9fa5]{2,6}技术|[\u4e00-\u9fa5]{2,6}方法|[\u4e00-\u9fa5]{2,6}系统', draft_content)
    if len(set(technical_terms)) < 3 and len(technical_terms) > 5:
        issues.append({
            "type": "term_consistency",
            "description": "技术术语使用不一致或重复"
        })

    return issues

def check_formatting_compliance(draft_content, formatting_rules):
    """Check compliance with formatting rules."""
    violations = []

    # Check for basic formatting issues
    if "字体" in str(formatting_rules) and "宋体" in str(formatting_rules):
        if "<!-- 字体: 宋体 -->" not in draft_content:
            violations.append("未指定字体为宋体")

    if "字号" in str(formatting_rules) and ("小四" in str(formatting_rules) or "12pt" in str(formatting_rules)):
        if "<!-- 字号: 小四 -->" not in draft_content and "<!-- 字号: 12pt -->" not in draft_content:
            violations.append("未指定字号")

    # Check heading hierarchy
    heading_levels = re.findall(r"^(#+)\s", draft_content, re.MULTILINE)
    if heading_levels:
        levels = [len(level) for level in heading_levels]
        if max(levels) - min(levels) > 2:
            violations.append("标题层级跳跃过大")

    # Check for proper spacing
    consecutive_blank_lines = re.findall(r"\n\s*\n\s*\n", draft_content)
    if consecutive_blank_lines:
        violations.append(f"发现 {len(consecutive_blank_lines)} 处连续空行")

    return violations

def generate_review_report(draft_content, specifications, draft_path):
    """Generate comprehensive review report."""
    # Perform all checks
    present_sections, missing_sections = check_section_completeness(
        draft_content, specifications.get("required_sections", [])
    )
    content_issues = check_content_quality(draft_content)
    formatting_violations = check_formatting_compliance(
        draft_content, specifications.get("formatting_rules", [])
    )

    # Calculate overall score
    total_checks = 4
    passed_checks = 0

    if not missing_sections:
        passed_checks += 1
    if not content_issues:
        passed_checks += 1
    if not formatting_violations:
        passed_checks += 1
    if draft_content:
        passed_checks += 1  # Basic document check

    score_percentage = (passed_checks / total_checks) * 100

    # Generate report
    report = f"# 技术交底书审核报告\n\n"
    report += f"**审核文件**: {draft_path.name if draft_path else '未知文件'}\n"
    report += f"**审核时间**: {Path(__file__).parent.parent.name}\n"
    report += f"**总体评分**: {score_percentage:.1f}% ({passed_checks}/{total_checks})\n\n"

    report += "## 1. 章节完整性检查\n"
    if present_sections:
        report += f"✅ 已包含章节 ({len(present_sections)}/{len(specifications.get('required_sections', []))}):\n"
        for section in present_sections:
            report += f"  - {section}\n"
    else:
        report += "❌ 未识别到任何章节\n"

    if missing_sections:
        report += f"\n❌ 缺失章节 ({len(missing_sections)}):\n"
        for section in missing_sections:
            report += f"  - {section}\n"
    else:
        report += "\n✅ 所有必需章节完整\n"

    report += "\n## 2. 内容质量检查\n"
    if content_issues:
        report += f"⚠️ 发现 {len(content_issues)} 个内容问题:\n"
        for issue in content_issues:
            report += f"  - {issue['description']}\n"
    else:
        report += "✅ 内容质量良好\n"

    report += "\n## 3. 格式规范检查\n"
    if formatting_violations:
        report += f"⚠️ 发现 {len(formatting_violations)} 个格式问题:\n"
        for violation in formatting_violations:
            report += f"  - {violation}\n"
    else:
        report += "✅ 格式规范符合要求\n"

    report += "\n## 4. 改进建议\n"
    if missing_sections:
        report += f"1. 补充缺失章节: {', '.join(missing_sections)}\n"

    if content_issues:
        for issue in content_issues:
            if issue["type"] == "placeholder_content":
                report += "2. 替换所有'待补充'占位符为具体内容\n"
                break

    if formatting_violations:
        report += "3. 根据格式要求调整文档格式\n"

    if not missing_sections and not content_issues and not formatting_violations:
        report += "✅ 文档质量良好，可以直接使用或进行最终润色\n"

    report += "\n## 5. 详细检查项\n"
    report += "- [ ] 所有必需章节完整\n"
    report += "- [ ] 技术内容准确无误\n"
    report += "- [ ] 无占位符内容\n"
    report += "- [ ] 格式符合规范\n"
    report += "- [ ] 术语使用一致\n"
    report += "- [ ] 段落长度适中\n"

    return report, score_percentage

def save_review_report(report_content, output_dir, draft_filename):
    """Save review report to file."""
    output_dir.mkdir(exist_ok=True)

    # Generate report filename
    report_filename = f"review_report_{draft_filename.stem}.md"
    report_path = output_dir / report_filename

    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report_content)

    return report_path

def main():
    """Main function for document review."""
    print("=" * 60)
    print("技术交底书审核工具")
    print("=" * 60)

    # Load specifications
    print("\n加载审核规范...")
    specifications = load_specifications()
    if not specifications["required_sections"]:
        print("警告: 未加载到审核规范，使用默认标准")
        specifications["required_sections"] = [
            "技术领域",
            "背景技术",
            "技术问题",
            "技术方案",
            "有益效果",
            "附图说明",
            "具体实施方式"
        ]

    print(f"基于 {len(specifications['required_sections'])} 个规范要求进行审核")

    # Load draft document
    print("\n查找最新草稿文件...")
    draft_content, draft_path = load_latest_draft()

    if not draft_content or not draft_path:
        print("错误: 未找到草稿文件")
        print("请确保已生成草稿文件在 outputs/drafts/ 目录中")
        return

    print(f"找到草稿文件: {draft_path.name}")
    print(f"文件大小: {len(draft_content)} 字符")

    # Generate review report
    print("\n进行文档审核...")
    review_report, score = generate_review_report(
        draft_content, specifications, draft_path
    )

    # Save report
    script_dir = Path(__file__).parent
    output_dir = script_dir.parent / "outputs" / "reviews"
    report_path = save_review_report(review_report, output_dir, draft_path)

    print(f"\n✅ 审核完成!")
    print(f"审核报告保存至: {report_path}")
    print(f"文档评分: {score:.1f}%")

    # Show summary
    print("\n审核摘要:")
    print("-" * 40)

    # Count issues from report
    missing_sections = re.findall(r"❌ 缺失章节 \(\d+\)", review_report)
    content_issues = re.findall(r"⚠️ 发现 \d+ 个内容问题", review_report)
    format_issues = re.findall(r"⚠️ 发现 \d+ 个格式问题", review_report)

    if missing_sections:
        print("❌ 存在缺失章节")
    if content_issues:
        print("⚠️  存在内容问题")
    if format_issues:
        print("⚠️  存在格式问题")

    if not missing_sections and not content_issues and not format_issues:
        print("✅ 文档通过所有检查")

    print("\n建议:")
    if score < 80:
        print("文档需要较大改进，请根据审核报告进行修改")
    elif score < 95:
        print("文档基本合格，建议进行细节优化")
    else:
        print("文档质量优秀，可以进行最终确认")

if __name__ == "__main__":
    main()