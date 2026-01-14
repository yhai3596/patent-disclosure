#!/usr/bin/env python3
"""
Save final technical disclosure document to local storage.
Manage organization and versioning of generated documents.
"""

import json
import re
import shutil
from datetime import datetime
from pathlib import Path

def get_final_document():
    """Get the final document content from user or file."""
    script_dir = Path(__file__).parent
    drafts_dir = script_dir.parent / "outputs" / "drafts"
    reviews_dir = script_dir.parent / "outputs" / "reviews"

    # Look for the most recent draft
    draft_files = list(drafts_dir.glob("technical_disclosure_draft_*.md"))
    if not draft_files:
        print("错误: 未找到草稿文件")
        return None, None

    latest_draft = max(draft_files, key=lambda x: x.stat().st_mtime)

    # Check if there's a reviewed version
    review_pattern = f"review_report_{latest_draft.stem}.md"
    review_files = list(reviews_dir.glob(review_pattern))

    # Ask user for confirmation or modifications
    print(f"找到草稿文件: {latest_draft.name}")
    if review_files:
        print(f"找到审核报告: {review_files[0].name}")

    try:
        with open(latest_draft, 'r', encoding='utf-8') as f:
            content = f.read()
        return content, latest_draft.stem
    except Exception as e:
        print(f"读取文件错误: {e}")
        return None, None

def apply_final_formatting(document_content):
    """Apply final formatting to document."""
    formatted_content = document_content

    # Remove draft markers and comments
    draft_markers = [
        "<!-- 需要补充",
        "<!-- 字体:",
        "<!-- 字号:",
        "<!-- 行距:",
        "**状态**: 草稿",
        "本文件为技术交底书草稿",
        "标记为'待补充'的部分"
    ]

    for marker in draft_markers:
        if marker in formatted_content:
            # Remove entire comment block
            formatted_content = re.sub(r"<!--.*?-->", "", formatted_content, flags=re.DOTALL)

    # Update status
    formatted_content = formatted_content.replace(
        "**状态**: 草稿",
        "**状态**: 终稿"
    )

    # Update document description
    formatted_content = formatted_content.replace(
        "本文件为技术交底书草稿，基于收集的信息生成",
        "本文件为技术交底书终稿，已完成审核和确认"
    )

    # Add final document header
    final_header = """---
文档类型: 技术交底书
文档状态: 终稿
生成时间: {timestamp}
版本: 1.0
---
"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    final_header = final_header.format(timestamp=timestamp)

    # Insert header after title
    lines = formatted_content.split('\n')
    if lines and lines[0].startswith('# '):
        lines.insert(1, final_header)
        formatted_content = '\n'.join(lines)

    return formatted_content

def generate_final_filename(base_name, tech_field):
    """Generate appropriate filename for final document."""
    # Clean technical field for filename
    clean_field = re.sub(r'[\\/*?:"<>|]', "", tech_field)
    clean_field = clean_field.replace(" ", "_").replace("，", "_").replace(",", "_")
    if len(clean_field) > 30:
        clean_field = clean_field[:30]

    # Generate timestamp
    timestamp = datetime.now().strftime("%Y%m%d")

    # Create filename
    filename = f"技术交底书_{clean_field}_{timestamp}_v1.0.md"

    return filename

def save_to_final_location(document_content, filename, output_base):
    """Save document to final location with proper organization."""
    # Create output directory structure
    year = datetime.now().strftime("%Y")
    month = datetime.now().strftime("%m")
    output_dir = output_base / year / month
    output_dir.mkdir(parents=True, exist_ok=True)

    # Save document
    output_path = output_dir / filename
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(document_content)

    # Create backup copy
    backup_dir = output_base / "backups" / year / month
    backup_dir.mkdir(parents=True, exist_ok=True)
    backup_path = backup_dir / filename
    shutil.copy2(output_path, backup_path)

    return output_path, backup_path

def update_document_index(document_info, index_path):
    """Update document index for tracking."""
    index_data = []

    # Load existing index
    if index_path.exists():
        try:
            with open(index_path, 'r', encoding='utf-8') as f:
                index_data = json.load(f)
        except:
            index_data = []

    # Add new entry
    index_entry = {
        "filename": document_info["filename"],
        "technical_field": document_info["technical_field"],
        "save_date": document_info["save_date"],
        "file_path": str(document_info["file_path"]),
        "backup_path": str(document_info["backup_path"]),
        "version": document_info["version"]
    }

    index_data.append(index_entry)

    # Save index
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)

def generate_save_report(document_info, output_path, backup_path):
    """Generate save operation report."""
    report = f"# 文档保存报告\n\n"

    report += f"## 保存详情\n"
    report += f"- **文档名称**: {document_info['filename']}\n"
    report += f"- **技术领域**: {document_info['technical_field']}\n"
    report += f"- **保存时间**: {document_info['save_date']}\n"
    report += f"- **文档版本**: {document_info['version']}\n"
    report += f"- **主文件路径**: {output_path}\n"
    report += f"- **备份文件路径**: {backup_path}\n"

    report += f"\n## 文件信息\n"
    report += f"- **文件大小**: {document_info['file_size']} 字符\n"
    report += f"- **章节数量**: {document_info['section_count']}\n"
    report += f"- **保存状态**: ✅ 成功\n"

    report += f"\n## 目录结构\n"
    report += f"文档已按照以下结构保存:\n"
    report += f"```
{output_path.parent}
├── {output_path.name} (主文件)
└── backups/
    └── {backup_path.parent.name}/
        └── {backup_path.name} (备份文件)
```\n"

    report += f"\n## 后续操作建议\n"
    report += f"1. 验证文档内容的准确性和完整性\n"
    report += f"2. 根据需要打印或分享文档\n"
    report += f"3. 定期检查备份文件的完整性\n"
    report += f"4. 更新相关专利申报记录\n"

    return report

def main():
    """Main function for document saving."""
    print("=" * 60)
    print("技术交底书保存工具")
    print("=" * 60)

    # Get final document
    print("\n准备保存最终文档...")
    document_content, draft_stem = get_final_document()

    if not document_content:
        print("错误: 无法获取文档内容")
        return

    # Extract technical field from document
    tech_field_match = re.search(r"技术领域[：:]\s*(.*?)(?=\n|$)", document_content)
    tech_field = tech_field_match.group(1).strip() if tech_field_match else "未指定技术领域"

    print(f"技术领域: {tech_field}")
    print(f"文档长度: {len(document_content)} 字符")

    # Apply final formatting
    print("\n应用最终格式...")
    final_content = apply_final_formatting(document_content)

    # Count sections
    section_count = len(re.findall(r"^#+\s+\d+\.", final_content, re.MULTILINE))

    # Generate filename
    filename = generate_final_filename(draft_stem, tech_field)
    print(f"生成文件名: {filename}")

    # Determine save location
    script_dir = Path(__file__).parent
    save_base = script_dir.parent / "outputs" / "final_documents"

    # Save document
    print("\n保存文档...")
    output_path, backup_path = save_to_final_location(
        final_content, filename, save_base
    )

    # Prepare document info
    document_info = {
        "filename": filename,
        "technical_field": tech_field,
        "save_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "file_path": output_path,
        "backup_path": backup_path,
        "version": "1.0",
        "file_size": len(final_content),
        "section_count": section_count
    }

    # Update index
    index_path = save_base / "document_index.json"
    update_document_index(document_info, index_path)

    # Generate save report
    report_content = generate_save_report(document_info, output_path, backup_path)
    report_path = save_base / "reports" / f"save_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    report_path.parent.mkdir(parents=True, exist_ok=True)

    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report_content)

    print(f"\n✅ 文档保存完成!")
    print(f"主文件: {output_path}")
    print(f"备份文件: {backup_path}")
    print(f"索引文件: {index_path}")
    print(f"保存报告: {report_path}")

    # Show summary
    print("\n保存摘要:")
    print("-" * 40)
    print(f"文档: {filename}")
    print(f"技术领域: {tech_field}")
    print(f"大小: {len(final_content)} 字符")
    print(f"章节: {section_count} 个")
    print(f"版本: 1.0")
    print(f"状态: ✅ 已保存并备份")

    print("\n建议后续操作:")
    print("1. 验证保存的文档内容")
    print("2. 检查备份文件完整性")
    print("3. 更新相关专利申报流程")
    print("4. 归档相关技术资料")

if __name__ == "__main__":
    main()