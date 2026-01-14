/**
 * 质量审核和检查清单模块
 * 检查技术交底书的完整性、准确性和规范性
 */

class QualityChecker {
    constructor() {
        this.checkRules = this.initCheckRules();
    }

    /**
     * 初始化检查规则
     */
    initCheckRules() {
        return {
            // 基本信息检查
            basicInfo: [
                {
                    id: 'title',
                    name: '文档标题',
                    description: '文档标题是否填写且有意义',
                    check: (data) => data.title && data.title.trim().length > 0,
                    severity: 'error',
                    suggestion: '请填写文档标题'
                },
                {
                    id: 'technicalField',
                    name: '技术领域',
                    description: '技术领域是否明确具体',
                    check: (data) => data.technicalField && data.technicalField.trim().length >= 10,
                    severity: 'warning',
                    suggestion: '技术领域描述应至少10个字符，并明确具体'
                },
                {
                    id: 'inventor',
                    name: '发明人',
                    description: '发明人信息是否完整',
                    check: (data) => data.inventor && data.inventor.trim().length > 0,
                    severity: 'error',
                    suggestion: '请填写发明人姓名'
                }
            ],

            // 背景技术检查
            backgroundTech: [
                {
                    id: 'backgroundTechnology',
                    name: '背景技术描述',
                    description: '背景技术描述是否详细',
                    check: (data) => data.backgroundTechnology && data.backgroundTechnology.trim().length >= 50,
                    severity: 'warning',
                    suggestion: '背景技术描述应至少50个字符，详细说明现有技术状况'
                },
                {
                    id: 'currentProblems',
                    name: '现有技术问题',
                    description: '是否明确指出现有技术存在的问题',
                    check: (data) => data.currentProblems && data.currentProblems.trim().length >= 30,
                    severity: 'error',
                    suggestion: '请详细描述现有技术存在的问题，不少于30个字符'
                }
            ],

            // 技术方案检查
            technicalSolution: [
                {
                    id: 'technicalProblem',
                    name: '技术问题',
                    description: '要解决的技术问题是否明确',
                    check: (data) => data.technicalProblem && data.technicalProblem.trim().length >= 20,
                    severity: 'error',
                    suggestion: '请明确描述要解决的技术问题，至少20个字符'
                },
                {
                    id: 'technicalSolution',
                    name: '技术方案',
                    description: '技术方案是否详细可行',
                    check: (data) => data.technicalSolution && data.technicalSolution.trim().length >= 100,
                    severity: 'error',
                    suggestion: '技术方案描述应详细可行，至少100个字符'
                },
                {
                    id: 'keyFeatures',
                    name: '关键技术特征',
                    description: '是否列出了关键技术特征',
                    check: (data) => Array.isArray(data.keyFeatures) && data.keyFeatures.length >= 3,
                    severity: 'warning',
                    suggestion: '建议列出至少3个关键技术特征'
                }
            ],

            // 技术效果检查
            technicalEffects: [
                {
                    id: 'beneficialEffects',
                    name: '有益效果',
                    description: '是否说明了有益效果',
                    check: (data) => data.beneficialEffects && data.beneficialEffects.trim().length >= 30,
                    severity: 'error',
                    suggestion: '请详细描述有益效果，至少30个字符'
                },
                {
                    id: 'performanceData',
                    name: '性能数据',
                    description: '是否有性能数据支持',
                    check: (data) => data.performanceData && data.performanceData.trim().length > 0,
                    severity: 'info',
                    suggestion: '建议提供具体的性能数据以增强说服力'
                }
            ],

            // 实施方式检查
            implementation: [
                {
                    id: 'embodimentDescription',
                    name: '具体实施方式',
                    description: '实施方式是否描述清楚',
                    check: (data) => data.embodimentDescription && data.embodimentDescription.trim().length >= 50,
                    severity: 'warning',
                    suggestion: '具体实施方式应详细描述，至少50个字符'
                }
            ]
        };
    }

    /**
     * 执行质量检查
     */
    checkDocument(data) {
        const results = {
            overall: 'pass',
            score: 0,
            totalChecks: 0,
            passedChecks: 0,
            errors: [],
            warnings: [],
            suggestions: [],
            categories: {}
        };

        // 检查每个分类
        Object.keys(this.checkRules).forEach(category => {
            const categoryResults = this.checkCategory(data, this.checkRules[category]);
            results.categories[category] = categoryResults;

            // 统计
            results.totalChecks += categoryResults.total;
            results.passedChecks += categoryResults.passed;

            // 收集问题
            results.errors.push(...categoryResults.errors);
            results.warnings.push(...categoryResults.warnings);
            results.suggestions.push(...categoryResults.suggestions);
        });

        // 计算总分（0-100）
        results.score = results.totalChecks > 0
            ? Math.round((results.passedChecks / results.totalChecks) * 100)
            : 0;

        // 确定整体状态
        if (results.errors.length > 0) {
            results.overall = 'fail';
        } else if (results.warnings.length > 0) {
            results.overall = 'warning';
        } else {
            results.overall = 'pass';
        }

        return results;
    }

    /**
     * 检查单个分类
     */
    checkCategory(data, rules) {
        const result = {
            total: rules.length,
            passed: 0,
            errors: [],
            warnings: [],
            suggestions: []
        };

        rules.forEach(rule => {
            const isValid = rule.check(data);
            const checkResult = {
                id: rule.id,
                name: rule.name,
                description: rule.description,
                passed: isValid,
                severity: rule.severity,
                suggestion: rule.suggestion
            };

            if (isValid) {
                result.passed++;
            } else {
                if (rule.severity === 'error') {
                    result.errors.push(checkResult);
                } else if (rule.severity === 'warning') {
                    result.warnings.push(checkResult);
                } else {
                    result.suggestions.push(checkResult);
                }
            }
        });

        return result;
    }

    /**
     * 生成检查报告
     */
    generateReport(checkResults) {
        let report = `# 质量检查报告\n\n`;
        report += `## 总体评估\n\n`;
        report += `- **总分**: ${checkResults.score}/100\n`;
        report += `- **状态**: ${this.getStatusText(checkResults.overall)}\n`;
        report += `- **检查项目**: ${checkResults.passedChecks}/${checkResults.totalChecks} 通过\n\n`;

        if (checkResults.errors.length > 0) {
            report += `## ❌ 错误 (${checkResults.errors.length})\n\n`;
            report += `以下问题需要立即修复：\n\n`;
            checkResults.errors.forEach(error => {
                report += `- **${error.name}**: ${error.suggestion}\n`;
            });
            report += '\n';
        }

        if (checkResults.warnings.length > 0) {
            report += `## ⚠️ 警告 (${checkResults.warnings.length})\n\n`;
            report += `以下问题建议修复：\n\n`;
            checkResults.warnings.forEach(warning => {
                report += `- **${warning.name}**: ${warning.suggestion}\n`;
            });
            report += '\n';
        }

        if (checkResults.suggestions.length > 0) {
            report += `## 💡 建议 (${checkResults.suggestions.length})\n\n`;
            report += `以下改进建议供参考：\n\n`;
            checkResults.suggestions.forEach(suggestion => {
                report += `- **${suggestion.name}**: ${suggestion.suggestion}\n`;
            });
            report += '\n';
        }

        report += `## 分类详情\n\n`;
        Object.keys(checkResults.categories).forEach(category => {
            const categoryResult = checkResults.categories[category];
            report += `### ${this.getCategoryName(category)}\n\n`;
            report += `- 通过: ${categoryResult.passed}/${categoryResult.total}\n`;
            if (categoryResult.errors.length > 0) {
                report += `- 错误: ${categoryResult.errors.length}\n`;
            }
            if (categoryResult.warnings.length > 0) {
                report += `- 警告: ${categoryResult.warnings.length}\n`;
            }
            if (categoryResult.suggestions.length > 0) {
                report += `- 建议: ${categoryResult.suggestions.length}\n`;
            }
            report += '\n';
        });

        return report;
    }

    /**
     * 获取状态文本
     */
    getStatusText(status) {
        const statusMap = {
            'pass': '✅ 通过',
            'warning': '⚠️ 有警告',
            'fail': '❌ 未通过'
        };
        return statusMap[status] || status;
    }

    /**
     * 获取分类名称
     */
    getCategoryName(category) {
        const nameMap = {
            'basicInfo': '基本信息',
            'backgroundTech': '背景技术',
            'technicalSolution': '技术方案',
            'technicalEffects': '技术效果',
            'implementation': '实施方式'
        };
        return nameMap[category] || category;
    }

    /**
     * 自动修复建议
     */
    getAutoFixSuggestions(data) {
        const suggestions = [];

        // 检查标题格式
        if (!data.title || data.title.trim().length === 0) {
            suggestions.push({
                type: 'title',
                action: 'setTitle',
                value: `技术方案_${new Date().toLocaleDateString()}`
            });
        }

        // 检查文档编号格式
        if (!data.documentId) {
            suggestions.push({
                type: 'documentId',
                action: 'setDocumentId',
                value: `TD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
            });
        }

        // 添加默认日期
        if (!data.date) {
            suggestions.push({
                type: 'date',
                action: 'setDate',
                value: new Date().toLocaleDateString()
            });
        }

        return suggestions;
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QualityChecker;
} else {
    window.QualityChecker = QualityChecker;
}