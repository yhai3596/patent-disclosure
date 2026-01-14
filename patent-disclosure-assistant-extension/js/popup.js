/**
 * 专利技术交底书助手 - 弹出窗口脚本
 * 处理用户界面交互、表单验证、数据管理等功能
 */

class DisclosureAssistant {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = {};
        this.autoSaveTimer = null;
        this.currentDocumentId = null;
        this.performance = window.getPerformanceOptimizer?.() || null;

        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        const initOperation = async () => {
            await this.loadSettings();
            this.setupEventListeners();
            this.loadSavedData();
            this.updateStepIndicator();
            this.showToast('专利技术交底书助手已启动', 'success');
        };

        if (this.performance) {
            await this.performance.wrapAsync(initOperation, { context: 'app_init' });
        } else {
            await initOperation();
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 标签页切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // 步骤导航
        document.getElementById('prev-step').addEventListener('click', () => this.prevStep());
        document.getElementById('next-step').addEventListener('click', () => this.nextStep());
        document.getElementById('generate-doc').addEventListener('click', () => this.generateDocument());

        // 表单输入自动保存
        document.querySelectorAll('#disclosure-form input, #disclosure-form textarea').forEach(input => {
            input.addEventListener('input', () => this.handleAutoSave());
        });

        // 技术特征管理
        document.getElementById('add-feature').addEventListener('click', () => this.addFeature());
        document.getElementById('key-features-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-feature')) {
                e.target.parentElement.remove();
            }
        });

        // 文档管理
        document.getElementById('new-doc').addEventListener('click', () => this.newDocument());
        document.getElementById('edit-doc').addEventListener('click', () => this.editDocument());
        document.getElementById('quality-check').addEventListener('click', () => this.performQualityCheck());
        document.getElementById('export-md').addEventListener('click', (e) => {
            e.preventDefault();
            this.exportDocument('markdown');
        });
        document.getElementById('export-html').addEventListener('click', (e) => {
            e.preventDefault();
            this.exportDocument('html');
        });
        document.getElementById('export-pdf').addEventListener('click', (e) => {
            e.preventDefault();
            this.exportDocument('pdf');
        });
        document.getElementById('export-txt').addEventListener('click', (e) => {
            e.preventDefault();
            this.exportDocument('txt');
        });

        // 设置
        document.getElementById('clear-data').addEventListener('click', () => this.clearAllData());
        document.getElementById('export-settings').addEventListener('click', () => this.exportSettings());

        // 加载设置
        document.getElementById('auto-save').addEventListener('change', (e) => this.saveSettings());
        document.getElementById('export-format').addEventListener('change', (e) => this.saveSettings());
        document.getElementById('template-select').addEventListener('change', (e) => this.saveSettings());

        // AI功能设置
        this.setupAIEventListeners();
    }

    /**
     * 设置AI相关事件监听器
     */
    setupAIEventListeners() {
        // AI提供商选择
        const aiProvider = document.getElementById('ai-provider');
        if (aiProvider) {
            aiProvider.addEventListener('change', (e) => this.handleAIProviderChange(e.target.value));
        }

        // AI模型选择
        const aiModel = document.getElementById('ai-model');
        if (aiModel) {
            aiModel.addEventListener('change', (e) => this.saveAISettings());
        }

        // API Key输入
        const aiApiKey = document.getElementById('ai-api-key');
        if (aiApiKey) {
            aiApiKey.addEventListener('change', (e) => this.saveAISettings());
        }

        // 测试AI连接
        const testAiBtn = document.getElementById('test-ai');
        if (testAiBtn) {
            testAiBtn.addEventListener('click', () => this.testAIConnection());
        }

        // AI启用开关
        const aiEnabled = document.getElementById('ai-enabled');
        if (aiEnabled) {
            aiEnabled.addEventListener('change', (e) => this.saveAISettings());
        }

        // AI智能生成按钮
        const aiGenerateBtn = document.getElementById('ai-generate');
        if (aiGenerateBtn) {
            aiGenerateBtn.addEventListener('click', () => this.aiGenerateDocument());
        }

        // AI优化按钮
        const aiOptimizeBtn = document.getElementById('ai-optimize');
        if (aiOptimizeBtn) {
            aiOptimizeBtn.addEventListener('click', () => this.aiOptimizeDocument());
        }

        // AI审核按钮
        const aiReviewBtn = document.getElementById('ai-review');
        if (aiReviewBtn) {
            aiReviewBtn.addEventListener('click', () => this.aiReviewDocument());
        }

        // AI对话面板
        const closeAiChat = document.getElementById('close-ai-chat');
        if (closeAiChat) {
            closeAiChat.addEventListener('click', () => this.toggleAIChat(false));
        }

        const aiChatSend = document.getElementById('ai-chat-send');
        if (aiChatSend) {
            aiChatSend.addEventListener('click', () => this.sendAIMessage());
        }

        const aiChatInput = document.getElementById('ai-chat-input-field');
        if (aiChatInput) {
            aiChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendAIMessage();
                }
            });
        }
    }

    /**
     * 切换标签页
     */
    switchTab(tabName) {
        // 更新标签按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 显示对应内容
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // 加载标签页数据
        if (tabName === 'manage') {
            this.loadDocumentList();
        }
    }

    /**
     * 上一步
     */
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
            this.updateNavigationButtons();
        }
    }

    /**
     * 下一步
     */
    nextStep() {
        if (this.validateCurrentStep()) {
            this.currentStep++;
            this.updateStepDisplay();
            this.updateNavigationButtons();

            if (this.currentStep === this.totalSteps) {
                document.getElementById('generate-doc').style.display = 'inline-block';
                document.getElementById('next-step').style.display = 'none';
            }
        }
    }

    /**
     * 更新步骤显示
     */
    updateStepDisplay() {
        // 更新步骤指示器
        document.querySelectorAll('.step').forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index + 1 < this.currentStep) {
                step.classList.add('completed');
            } else if (index + 1 === this.currentStep) {
                step.classList.add('active');
            }
        });

        // 更新表单部分
        document.querySelectorAll('.form-section').forEach((section, index) => {
            section.classList.remove('active');
            if (index + 1 === this.currentStep) {
                section.classList.add('active');
            }
        });
    }

    /**
     * 更新导航按钮
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');

        prevBtn.disabled = this.currentStep === 1;

        if (this.currentStep === this.totalSteps) {
            nextBtn.style.display = 'none';
            document.getElementById('generate-doc').style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            document.getElementById('generate-doc').style.display = 'none';
        }
    }

    /**
     * 更新步骤指示器
     */
    updateStepIndicator() {
        this.updateStepDisplay();
        this.updateNavigationButtons();
    }

    /**
     * 验证当前步骤
     */
    validateCurrentStep() {
        const currentSection = document.querySelector(`.form-section[data-step="${this.currentStep}"]`);
        const requiredFields = currentSection.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.highlightInvalidField(field);
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        if (!isValid) {
            this.showToast('请填写所有必填字段', 'error');
        }

        return isValid;
    }

    /**
     * 高亮无效字段
     */
    highlightInvalidField(field) {
        field.style.borderColor = 'var(--danger-color)';
        field.addEventListener('input', () => {
            this.clearFieldError(field);
        }, { once: true });
    }

    /**
     * 清除字段错误
     */
    clearFieldError(field) {
        field.style.borderColor = 'var(--border-color)';
    }

    /**
     * 添加技术特征
     */
    addFeature() {
        const container = document.getElementById('key-features-list');
        const newItem = document.createElement('div');
        newItem.className = 'feature-item';
        newItem.innerHTML = `
            <input type="text" placeholder="关键技术特征" name="keyFeatures[]">
            <button type="button" class="remove-feature">×</button>
        `;
        container.appendChild(newItem);
    }

    /**
     * 生成文档
     */
    async generateDocument() {
        if (!this.validateCurrentStep()) {
            return;
        }

        try {
            this.showLoading(true);
            this.updateStatus('正在生成文档...');

            // 收集表单数据
            this.collectFormData();

            // 调用后台服务生成文档
            const response = await this.sendMessage({
                action: 'generateDisclosure',
                data: this.formData
            });

            if (response.success) {
                this.displayPreview(response.data);
                this.showToast('文档生成成功', 'success');
                this.switchTab('preview');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('生成文档失败:', error);
            this.showToast('生成文档失败: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
            this.updateStatus('就绪');
        }
    }

    /**
     * 收集表单数据
     */
    collectFormData() {
        const form = document.getElementById('disclosure-form');
        const formData = new FormData(form);

        // 基础字段
        this.formData = {
            title: formData.get('title'),
            documentId: formData.get('documentId'),
            technicalField: formData.get('technicalField'),
            inventor: formData.get('inventor'),
            backgroundTechnology: formData.get('backgroundTechnology'),
            currentProblems: formData.get('currentProblems'),
            technicalProblem: formData.get('technicalProblem'),
            technicalSolution: formData.get('technicalSolution'),
            beneficialEffects: formData.get('beneficialEffects'),
            performanceData: formData.get('performanceData'),
            embodimentDescription: formData.get('embodimentDescription')
        };

        // 技术特征
        const keyFeatures = [];
        document.querySelectorAll('input[name="keyFeatures[]"]').forEach(input => {
            if (input.value.trim()) {
                keyFeatures.push(input.value.trim());
            }
        });
        this.formData.keyFeatures = keyFeatures;

        // 添加日期
        this.formData.date = new Date().toLocaleDateString();
    }

    /**
     * 显示预览
     */
    displayPreview(content) {
        const preview = document.getElementById('document-preview');
        preview.innerHTML = `
            <div class="preview-content">
                <div class="preview-actions-top">
                    <button class="action-btn primary" onclick="app.openPreviewWindow()">在新窗口中打开</button>
                    <button class="action-btn" onclick="app.printPreview()">打印预览</button>
                </div>
                <div class="preview-document">
                    ${this.formatPreviewContent(content)}
                </div>
            </div>
        `;
    }

    /**
     * 格式化预览内容
     */
    formatPreviewContent(content) {
        // 将Markdown转换为HTML
        return content
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.+)$/gm, '<p>$1</p>');
    }

    /**
     * 在新窗口中打开预览
     */
    openPreviewWindow() {
        const data = encodeURIComponent(JSON.stringify(this.formData));
        const previewUrl = `html/preview.html?data=${data}`;
        window.open(previewUrl, '_blank', 'width=1000,height=800');
    }

    /**
     * 打印预览
     */
    printPreview() {
        const printWindow = window.open('', '_blank');
        const content = document.querySelector('.preview-document').innerHTML;
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>技术交底书打印</title>
                <style>
                    body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; margin: 40px; }
                    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                    h2 { color: #34495e; margin-top: 30px; }
                    h3 { color: #34495e; }
                    p { margin-bottom: 15px; text-align: justify; }
                    strong { color: #2c3e50; }
                </style>
            </head>
            <body>
                <h1>${this.formData.title || '技术交底书'}</h1>
                ${content}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    /**
     * 编辑文档
     */
    editDocument() {
        this.switchTab('collect');
        this.showToast('切换到编辑模式', 'success');
    }

    /**
     * 执行质量检查
     */
    performQualityCheck() {
        if (Object.keys(this.formData).length === 0) {
            this.showToast('请先填写文档信息', 'warning');
            return;
        }

        this.showLoading(true);
        this.updateStatus('正在执行质量检查...');

        try {
            // 加载质量检查器
            if (typeof QualityChecker === 'undefined') {
                this.loadQualityChecker();
            }

            const checker = new QualityChecker();
            const results = checker.checkDocument(this.formData);
            const report = checker.generateReport(results);

            // 显示质量检查结果
            this.displayQualityReport(results, report);
            this.showToast('质量检查完成', 'success');
        } catch (error) {
            console.error('质量检查失败:', error);
            this.showToast('质量检查失败: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
            this.updateStatus('就绪');
        }
    }

    /**
     * 加载质量检查器
     */
    loadQualityChecker() {
        const script = document.createElement('script');
        script.src = '../js/quality-checker.js';
        document.head.appendChild(script);
    }

    /**
     * 显示质量检查报告
     */
    displayQualityReport(results, report) {
        const preview = document.getElementById('document-preview');
        const statusClass = results.overall === 'pass' ? 'success' :
                          results.overall === 'warning' ? 'warning' : 'error';

        preview.innerHTML = `
            <div class="quality-report">
                <div class="quality-header">
                    <h3>质量检查报告</h3>
                    <div class="quality-score ${statusClass}">
                        <span class="score-number">${results.score}</span>
                        <span class="score-label">分</span>
                    </div>
                </div>

                <div class="quality-summary">
                    <div class="summary-item">
                        <span class="summary-label">总体状态:</span>
                        <span class="summary-value ${statusClass}">
                            ${results.overall === 'pass' ? '✅ 通过' :
                              results.overall === 'warning' ? '⚠️ 有警告' : '❌ 未通过'}
                        </span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">检查项目:</span>
                        <span class="summary-value">${results.passedChecks}/${results.totalChecks} 通过</span>
                    </div>
                </div>

                ${results.errors.length > 0 ? `
                    <div class="quality-section error">
                        <h4>❌ 错误 (${results.errors.length})</h4>
                        <ul>
                            ${results.errors.map(error => `
                                <li>
                                    <strong>${error.name}:</strong>
                                    ${error.suggestion}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${results.warnings.length > 0 ? `
                    <div class="quality-section warning">
                        <h4>⚠️ 警告 (${results.warnings.length})</h4>
                        <ul>
                            ${results.warnings.map(warning => `
                                <li>
                                    <strong>${warning.name}:</strong>
                                    ${warning.suggestion}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${results.suggestions.length > 0 ? `
                    <div class="quality-section suggestion">
                        <h4>💡 建议 (${results.suggestions.length})</h4>
                        <ul>
                            ${results.suggestions.map(suggestion => `
                                <li>
                                    <strong>${suggestion.name}:</strong>
                                    ${suggestion.suggestion}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                <div class="quality-actions">
                    <button class="action-btn primary" onclick="app.showDetailedReport()">查看详细报告</button>
                    <button class="action-btn" onclick="app.editDocument()">返回编辑</button>
                </div>
            </div>
        `;

        // 添加质量报告样式
        this.addQualityReportStyles();
    }

    /**
     * 添加质量报告样式
     */
    addQualityReportStyles() {
        if (document.getElementById('quality-report-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'quality-report-styles';
        style.textContent = `
            .quality-report {
                font-size: 13px;
            }

            .quality-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 12px;
                border-bottom: 2px solid var(--border-color);
            }

            .quality-header h3 {
                margin: 0;
                font-size: 16px;
                color: var(--text-color);
            }

            .quality-score {
                display: flex;
                align-items: baseline;
                gap: 4px;
                padding: 8px 16px;
                border-radius: 20px;
                font-weight: 600;
            }

            .quality-score.success {
                background: rgba(39, 174, 96, 0.1);
                color: var(--success-color);
            }

            .quality-score.warning {
                background: rgba(243, 156, 18, 0.1);
                color: var(--warning-color);
            }

            .quality-score.error {
                background: rgba(231, 76, 60, 0.1);
                color: var(--danger-color);
            }

            .score-number {
                font-size: 24px;
            }

            .score-label {
                font-size: 14px;
            }

            .quality-summary {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 20px;
                padding: 12px;
                background: var(--bg-secondary);
                border-radius: var(--border-radius);
            }

            .summary-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .summary-label {
                font-weight: 500;
                color: var(--text-color);
            }

            .summary-value {
                font-weight: 600;
            }

            .summary-value.success {
                color: var(--success-color);
            }

            .summary-value.warning {
                color: var(--warning-color);
            }

            .summary-value.error {
                color: var(--danger-color);
            }

            .quality-section {
                margin-bottom: 16px;
                padding: 12px;
                border-radius: var(--border-radius);
                border-left: 4px solid;
            }

            .quality-section.error {
                background: rgba(231, 76, 60, 0.05);
                border-left-color: var(--danger-color);
            }

            .quality-section.warning {
                background: rgba(243, 156, 18, 0.05);
                border-left-color: var(--warning-color);
            }

            .quality-section.suggestion {
                background: rgba(52, 152, 219, 0.05);
                border-left-color: var(--primary-color);
            }

            .quality-section h4 {
                margin: 0 0 8px 0;
                font-size: 14px;
                color: var(--text-color);
            }

            .quality-section ul {
                margin: 0;
                padding-left: 20px;
            }

            .quality-section li {
                margin-bottom: 6px;
                line-height: 1.5;
            }

            .quality-actions {
                display: flex;
                gap: 8px;
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid var(--border-color);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 导出文档
     */
    async exportDocument(format) {
        try {
            this.showLoading(true);
            this.updateStatus('正在导出文档...');

            const response = await this.sendMessage({
                action: 'exportDisclosure',
                data: this.formData,
                format
            });

            if (response.success) {
                this.showToast(`文档已导出为 ${format.toUpperCase()} 格式`, 'success');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('导出文档失败:', error);
            this.showToast('导出文档失败: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
            this.updateStatus('就绪');
        }
    }

    /**
     * 加载文档列表
     */
    async loadDocumentList() {
        try {
            const response = await this.sendMessage({
                action: 'getDisclosures'
            });

            const docList = document.getElementById('doc-list');

            if (response.success && Object.keys(response.data).length > 0) {
                docList.innerHTML = '';
                Object.values(response.data).forEach(doc => {
                    const docElement = this.createDocElement(doc);
                    docList.appendChild(docElement);
                });
            } else {
                docList.innerHTML = `
                    <div class="empty-state">
                        <p>暂无保存的文档</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('加载文档列表失败:', error);
        }
    }

    /**
     * 创建文档元素
     */
    createDocElement(doc) {
        const element = document.createElement('div');
        element.className = 'doc-item';
        element.innerHTML = `
            <div class="doc-title">${doc.name}</div>
            <div class="doc-meta">
                <span>创建于 ${new Date(doc.createdAt).toLocaleDateString()}</span>
                <span>更新于 ${new Date(doc.updatedAt).toLocaleDateString()}</span>
            </div>
            <div class="doc-actions">
                <button class="action-btn edit-btn" data-id="${doc.id}">编辑</button>
                <button class="action-btn export-btn" data-id="${doc.id}">导出</button>
                <button class="danger-btn" data-id="${doc.id}">删除</button>
            </div>
        `;

        // 添加事件监听器
        element.querySelector('.edit-btn').addEventListener('click', () => this.editSavedDoc(doc.id));
        element.querySelector('.export-btn').addEventListener('click', () => this.exportSavedDoc(doc.id));
        element.querySelector('.danger-btn').addEventListener('click', () => this.deleteSavedDoc(doc.id));

        return element;
    }

    /**
     * 编辑保存的文档
     */
    async editSavedDoc(docId) {
        try {
            const response = await this.sendMessage({
                action: 'getDisclosure',
                id: docId
            });

            if (response.success) {
                this.loadDocumentData(response.data);
                this.currentDocumentId = docId;
                this.switchTab('collect');
                this.showToast('已加载文档数据', 'success');
            }
        } catch (error) {
            this.showToast('加载文档失败: ' + error.message, 'error');
        }
    }

    /**
     * 导出保存的文档
     */
    async exportSavedDoc(docId) {
        try {
            const response = await this.sendMessage({
                action: 'getDisclosure',
                id: docId
            });

            if (response.success) {
                const format = document.getElementById('export-format').value;
                await this.sendMessage({
                    action: 'exportDisclosure',
                    data: response.data,
                    format
                });
                this.showToast('文档导出成功', 'success');
            }
        } catch (error) {
            this.showToast('导出文档失败: ' + error.message, 'error');
        }
    }

    /**
     * 删除保存的文档
     */
    async deleteSavedDoc(docId) {
        if (confirm('确定要删除这个文档吗？')) {
            try {
                await this.sendMessage({
                    action: 'deleteDisclosure',
                    id: docId
                });
                this.loadDocumentList();
                this.showToast('文档已删除', 'success');
            } catch (error) {
                this.showToast('删除文档失败: ' + error.message, 'error');
            }
        }
    }

    /**
     * 新建文档
     */
    newDocument() {
        if (confirm('确定要新建文档吗？当前未保存的数据将丢失。')) {
            this.resetForm();
            this.currentDocumentId = null;
            this.switchTab('collect');
        }
    }

    /**
     * 重置表单
     */
    resetForm() {
        document.getElementById('disclosure-form').reset();
        document.getElementById('key-features-list').innerHTML = `
            <div class="feature-item">
                <input type="text" placeholder="关键技术特征1" name="keyFeatures[]">
                <button type="button" class="remove-feature">×</button>
            </div>
        `;
        this.currentStep = 1;
        this.updateStepIndicator();
    }

    /**
     * 加载文档数据
     */
    loadDocumentData(data) {
        Object.keys(data).forEach(key => {
            const field = document.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = data[key];
            }
        });

        // 处理技术特征
        if (data.keyFeatures && data.keyFeatures.length > 0) {
            const container = document.getElementById('key-features-list');
            container.innerHTML = '';
            data.keyFeatures.forEach(feature => {
                const item = document.createElement('div');
                item.className = 'feature-item';
                item.innerHTML = `
                    <input type="text" value="${feature}" name="keyFeatures[]">
                    <button type="button" class="remove-feature">×</button>
                `;
                container.appendChild(item);
            });
        }
    }

    /**
     * 自动保存
     */
    handleAutoSave() {
        const autoSave = document.getElementById('auto-save').checked;
        if (!autoSave) return;

        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
            this.collectFormData();
            this.saveDraft();
        }, 1000);
    }

    /**
     * 保存草稿
     */
    async saveDraft() {
        try {
            await this.sendMessage({
                action: 'saveDraft',
                data: this.formData
            });
        } catch (error) {
            console.error('保存草稿失败:', error);
        }
    }

    /**
     * 加载保存的数据
     */
    async loadSavedData() {
        try {
            const response = await this.sendMessage({
                action: 'getDraft'
            });

            if (response.success && response.data) {
                this.loadDocumentData(response.data);
                this.showToast('已恢复上次编辑的内容', 'success');
            }
        } catch (error) {
            console.error('加载保存数据失败:', error);
        }
    }

    /**
     * 清除所有数据
     */
    async clearAllData() {
        if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
            try {
                await this.sendMessage({
                    action: 'clearAllData'
                });
                this.resetForm();
                this.loadDocumentList();
                this.showToast('所有数据已清除', 'success');
            } catch (error) {
                this.showToast('清除数据失败: ' + error.message, 'error');
            }
        }
    }

    /**
     * 导出设置
     */
    exportSettings() {
        const settings = {
            autoSave: document.getElementById('auto-save').checked,
            exportFormat: document.getElementById('export-format').value,
            template: document.getElementById('template-select').value,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'disclosure-assistant-settings.json';
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('设置已导出', 'success');
    }

    /**
     * 加载设置
     */
    async loadSettings() {
        try {
            const response = await this.sendMessage({
                action: 'getSettings'
            });

            if (response.success) {
                const settings = response.data;
                document.getElementById('auto-save').checked = settings.autoSave ?? true;
                document.getElementById('export-format').value = settings.exportFormat ?? 'markdown';
                document.getElementById('template-select').value = settings.template ?? 'default';
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    /**
     * 保存设置
     */
    async saveSettings() {
        const settings = {
            autoSave: document.getElementById('auto-save').checked,
            exportFormat: document.getElementById('export-format').value,
            template: document.getElementById('template-select').value
        };

        try {
            await this.sendMessage({
                action: 'saveSettings',
                settings
            });
        } catch (error) {
            console.error('保存设置失败:', error);
        }
    }

    /**
     * 发送消息到后台脚本
     */
    sendMessage(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    }

    /**
     * 显示加载指示器
     */
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.add('active');
        } else {
            loading.classList.remove('active');
        }
    }

    /**
     * 显示消息提示
     */
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * 更新状态栏
     */
    updateStatus(message) {
        document.getElementById('status-text').textContent = message;
    }

    /**
     * 更新进度条
     */
    updateProgress(percentage) {
        document.getElementById('progress-fill').style.width = `${percentage}%`;
    }

    // ============================================================
    // AI功能方法
    // ============================================================

    /**
     * 初始化AI服务
     */
    async initAIService() {
        try {
            await aiService.init();
            await this.loadAISettings();
            this.updateAIUI();
        } catch (error) {
            console.error('AI服务初始化失败:', error);
        }
    }

    /**
     * 加载AI设置
     */
    async loadAISettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['aiProvider', 'aiApiKey', 'aiModel', 'aiEnabled'], (result) => {
                if (result.aiProvider) {
                    document.getElementById('ai-provider').value = result.aiProvider;
                    this.handleAIProviderChange(result.aiProvider);
                }
                if (result.aiModel) {
                    document.getElementById('ai-model').value = result.aiModel;
                }
                if (result.aiApiKey) {
                    document.getElementById('ai-api-key').value = result.aiApiKey;
                }
                if (result.aiEnabled !== undefined) {
                    document.getElementById('ai-enabled').checked = result.aiEnabled;
                }
                resolve();
            });
        });
    }

    /**
     * 保存AI设置
     */
    async saveAISettings() {
        const provider = document.getElementById('ai-provider').value;
        const model = document.getElementById('ai-model').value;
        const apiKey = document.getElementById('ai-api-key').value;
        const enabled = document.getElementById('ai-enabled').checked;

        await aiService.saveSettings(provider, apiKey, model);
        await this.updateAIUI();
        this.showToast('AI设置已保存', 'success');
    }

    /**
     * 处理AI提供商变更
     */
    async handleAIProviderChange(provider) {
        const models = aiService.getProviderInfo(provider)?.models || [];
        const modelSelect = document.getElementById('ai-model');
        modelSelect.innerHTML = models.map(model => `<option value="${model}">${model}</option>`).join('');
    }

    /**
     * 测试AI连接
     */
    async testAIConnection() {
        const provider = document.getElementById('ai-provider').value;
        const model = document.getElementById('ai-model').value;
        const apiKey = document.getElementById('ai-api-key').value;
        const statusEl = document.getElementById('ai-status');

        if (!apiKey) {
            statusEl.textContent = '请先输入API Key';
            statusEl.className = 'ai-status error';
            return;
        }

        statusEl.textContent = '测试中...';
        statusEl.className = 'ai-status loading';

        try {
            const result = await aiService.testConnection(provider, apiKey, model);
            if (result.success) {
                statusEl.textContent = '连接成功';
                statusEl.className = 'ai-status success';
                this.showToast('AI服务连接成功', 'success');
            } else {
                statusEl.textContent = '连接失败';
                statusEl.className = 'ai-status error';
                this.showToast('AI服务连接失败: ' + result.error, 'error');
            }
        } catch (error) {
            statusEl.textContent = '连接失败';
            statusEl.className = 'ai-status error';
            this.showToast('连接测试出错: ' + error.message, 'error');
        }
    }

    /**
     * 更新AI相关UI
     */
    async updateAIUI() {
        const settings = await aiService.getSettings();
        const aiGenerateBtn = document.getElementById('ai-generate');
        const aiEnabled = settings.apiKey && settings.enabled;

        if (aiGenerateBtn) {
            aiGenerateBtn.style.display = aiEnabled ? 'inline-block' : 'none';
        }
    }

    /**
     * AI智能生成文档
     */
    async aiGenerateDocument() {
        try {
            await this.initAIService();
            this.showLoading(true);
            this.updateStatus('AI正在生成文档...');

            const formData = this.collectFormData();
            const content = await aiService.generateDraft(formData);

            this.generatedDocument = content;
            this.displayDocument(content);

            this.updateStatus('文档生成完成');
            this.showToast('AI文档生成成功', 'success');
        } catch (error) {
            this.showToast('AI生成失败: ' + error.message, 'error');
            console.error('AI生成错误:', error);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * AI优化文档
     */
    async aiOptimizeDocument() {
        if (!this.generatedDocument) {
            this.showToast('请先生成文档', 'warning');
            return;
        }

        try {
            await this.initAIService();
            this.showLoading(true);
            this.updateStatus('AI正在优化文档...');

            const result = await aiService.optimizeContent('fullDocument', this.generatedDocument);

            // 显示优化结果对话框
            this.showAIResultDialog('AI优化建议', result);

            this.updateStatus('优化完成');
        } catch (error) {
            this.showToast('AI优化失败: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * AI审核文档
     */
    async aiReviewDocument() {
        if (!this.generatedDocument) {
            this.showToast('请先生成文档', 'warning');
            return;
        }

        try {
            await this.initAIService();
            this.showLoading(true);
            this.updateStatus('AI正在审核文档...');

            const reviewResult = await aiService.reviewDocument(this.generatedDocument, this.formData);

            // 解析审核结果
            let resultData;
            try {
                resultData = JSON.parse(reviewResult);
            } catch {
                resultData = { summary: reviewResult };
            }

            this.showAIReviewDialog(resultData);
            this.updateStatus('审核完成');
        } catch (error) {
            this.showToast('AI审核失败: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 发送AI对话消息
     */
    async sendAIMessage() {
        const input = document.getElementById('ai-chat-input-field');
        const message = input.value.trim();

        if (!message) return;

        // 显示用户消息
        this.addChatMessage(message, 'user');
        input.value = '';

        try {
            await this.initAIService();
            const formData = this.collectFormData();
            const response = await aiService.collectInformation(message, formData, aiService.getConversationHistory());

            // 显示AI回复
            this.addChatMessage(response, 'ai');
        } catch (error) {
            this.addChatMessage('抱歉，AI服务出现错误: ' + error.message, 'ai');
        }
    }

    /**
     * 添加聊天消息
     */
    addChatMessage(message, type) {
        const messagesContainer = document.getElementById('ai-chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${type === 'user' ? 'user-message' : ''}`;
        messageDiv.innerHTML = `<strong>${type === 'user' ? '您' : 'AI助手'}：</strong><p>${message}</p>`;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * 切换AI对话面板
     */
    toggleAIChat(show) {
        const panel = document.getElementById('ai-chat-panel');
        if (show) {
            panel.style.display = 'flex';
        } else {
            panel.style.display = 'none';
        }
    }

    /**
     * 显示AI结果对话框
     */
    showAIResultDialog(title, content) {
        // 简单实现，后续可以优化为模态对话框
        this.showAIReviewDialog({ summary: content });
    }

    /**
     * 显示AI审核对话框
     */
    showAIReviewDialog(resultData) {
        const dialog = document.createElement('div');
        dialog.className = 'ai-result-panel show';
        dialog.innerHTML = `
            <div class="ai-result-content">
                <h3>AI审核结果 ${resultData.totalScore ? `(总分: ${resultData.totalScore}/150)` : ''}</h3>
                ${this.formatAIReviewResult(resultData)}
                <div class="ai-result-actions">
                    <button class="action-btn" onclick="this.closest('.ai-result-panel').remove()">关闭</button>
                    ${resultData.issues ? '<button class="action-btn ai-optimize-btn" id="apply-ai-suggestions">应用建议</button>' : ''}
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // 应用建议按钮
        const applyBtn = dialog.querySelector('#apply-ai-suggestions');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applyAISuggestions(resultData);
                dialog.remove();
            });
        }

        // 点击背景关闭
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
    }

    /**
     * 格式化AI审核结果
     */
    formatAIReviewResult(resultData) {
        let html = '';

        if (resultData.scores) {
            html += '<div class="ai-result-section">';
            html += '<h4>评分详情</h4>';
            for (const [category, score] of Object.entries(resultData.scores)) {
                const categoryNames = {
                    basicInfo: '基本信息',
                    completeness: '内容完整性',
                    technicality: '技术准确性',
                    logic: '逻辑一致性',
                    quality: '文档质量',
                    format: '格式规范'
                };
                html += `<div class="ai-result-item">
                    <strong>${categoryNames[category] || category}:</strong> ${score}/25
                </div>`;
            }
            html += '</div>';
        }

        if (resultData.issues && resultData.issues.length > 0) {
            html += '<div class="ai-result-section">';
            html += '<h4>问题列表</h4>';
            resultData.issues.forEach(issue => {
                html += `<div class="ai-result-item ${issue.level}">
                    <strong>[${issue.level}] ${issue.category}:</strong>
                    <p>${issue.message}</p>
                    ${issue.suggestion ? `<p><strong>建议:</strong> ${issue.suggestion}</p>` : ''}
                </div>`;
            });
            html += '</div>';
        }

        if (resultData.summary) {
            html += `<div class="ai-result-item suggestion">
                <strong>总体评价:</strong>
                <p>${resultData.summary}</p>
            </div>`;
        }

        return html || '<p>无审核结果</p>';
    }

    /**
     * 应用AI建议
     */
    applyAISuggestions(resultData) {
        // TODO: 实现应用建议的逻辑
        this.showToast('AI建议已应用', 'success');
    }
}

// 等待DOM加载完成后初始化应用
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new DisclosureAssistant();
});