/**
 * Chrome扩展内容脚本
 * 在网页中注入辅助功能，可以从网页提取相关信息
 */

class ContentScript {
    constructor() {
        this.init();
    }

    /**
     * 初始化内容脚本
     */
    init() {
        console.log('专利技术交底书助手内容脚本已加载');

        // 监听来自后台脚本的消息
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
        });

        // 创建浮动工具栏
        this.createFloatingToolbar();
    }

    /**
     * 处理来自后台脚本的消息
     */
    handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'extractText':
                // 从当前页面提取文本
                sendResponse({
                    success: true,
                    text: this.extractPageText()
                });
                break;

            case 'analyzeContent':
                // 分析页面内容
                sendResponse({
                    success: true,
                    analysis: this.analyzePageContent()
                });
                break;

            case 'openAssistant':
                // 打开助手弹窗
                chrome.runtime.sendMessage({
                    action: 'openPopup'
                });
                sendResponse({ success: true });
                break;
        }
    }

    /**
     * 从页面提取文本
     */
    extractPageText() {
        // 移除脚本和样式元素
        const scripts = document.querySelectorAll('script, style, nav, header, footer, aside');
        scripts.forEach(el => el.remove());

        // 获取主要内容
        const mainContent = document.querySelector('main, article, .content, #content') || document.body;

        return mainContent.innerText.trim();
    }

    /**
     * 分析页面内容
     */
    analyzePageContent() {
        const analysis = {
            title: document.title,
            url: window.location.href,
            headings: [],
            keywords: [],
            summary: '',
            wordCount: 0
        };

        // 提取标题
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            analysis.headings.push({
                level: parseInt(heading.tagName.charAt(1)),
                text: heading.innerText.trim()
            });
        });

        // 统计字数
        const textContent = this.extractPageText();
        analysis.wordCount = textContent.split(/\s+/).length;

        // 提取关键词（简单的词频分析）
        const words = textContent.toLowerCase()
            .match(/\b\w{2,}\b/g) || [];
        const wordFreq = {};

        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });

        // 获取最高频的词作为关键词
        analysis.keywords = Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);

        // 生成摘要（前200个字符）
        analysis.summary = textContent.substring(0, 200) + '...';

        return analysis;
    }

    /**
     * 创建浮动工具栏
     */
    createFloatingToolbar() {
        // 检查是否已经存在工具栏
        if (document.getElementById('disclosure-assistant-toolbar')) {
            return;
        }

        // 创建工具栏容器
        const toolbar = document.createElement('div');
        toolbar.id = 'disclosure-assistant-toolbar';
        toolbar.className = 'disclosure-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-content">
                <span class="toolbar-icon">📄</span>
                <span class="toolbar-text">专利助手</span>
                <button class="toolbar-btn extract-btn" title="提取页面文本">提取文本</button>
                <button class="toolbar-btn analyze-btn" title="分析页面内容">分析内容</button>
                <button class="toolbar-btn assist-btn" title="打开助手">打开助手</button>
                <button class="toolbar-btn close-btn" title="关闭">×</button>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            #disclosure-assistant-toolbar {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #3498db;
                color: white;
                padding: 10px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
                font-size: 14px;
                transition: all 0.3s ease;
                max-width: 300px;
            }

            .toolbar-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .toolbar-icon {
                font-size: 16px;
            }

            .toolbar-text {
                font-weight: 600;
                margin-right: 8px;
            }

            .toolbar-btn {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: none;
                padding: 6px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.2s;
            }

            .toolbar-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .toolbar-btn.close-btn {
                background: rgba(231, 76, 60, 0.8);
                font-weight: bold;
                width: 24px;
                height: 24px;
                padding: 0;
                border-radius: 50%;
            }

            .toolbar-btn.close-btn:hover {
                background: rgba(231, 76, 60, 1);
            }

            @media (max-width: 768px) {
                #disclosure-assistant-toolbar {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }

                .toolbar-content {
                    flex-wrap: wrap;
                }

                .toolbar-text {
                    display: none;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(toolbar);

        // 添加事件监听器
        toolbar.querySelector('.extract-btn').addEventListener('click', () => {
            this.handleExtractText();
        });

        toolbar.querySelector('.analyze-btn').addEventListener('click', () => {
            this.handleAnalyzeContent();
        });

        toolbar.querySelector('.assist-btn').addEventListener('click', () => {
            this.handleOpenAssistant();
        });

        toolbar.querySelector('.close-btn').addEventListener('click', () => {
            toolbar.remove();
        });

        // 3秒后自动隐藏
        setTimeout(() => {
            if (toolbar.parentNode) {
                toolbar.style.opacity = '0.7';
            }
        }, 3000);
    }

    /**
     * 处理提取文本
     */
    handleExtractText() {
        const text = this.extractPageText();
        this.showNotification('页面文本已提取，可以粘贴到助手中使用', 'success');
        console.log('提取的文本:', text);
    }

    /**
     * 处理分析内容
     */
    handleAnalyzeContent() {
        const analysis = this.analyzePageContent();
        this.showNotification('页面内容分析完成，请查看控制台', 'success');
        console.log('页面内容分析:', analysis);
    }

    /**
     * 处理打开助手
     */
    handleOpenAssistant() {
        chrome.runtime.sendMessage({
            action: 'openPopup'
        });
        this.showNotification('正在打开专利技术交底书助手...', 'info');
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `disclosure-notification ${type}`;
        notification.textContent = message;

        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
            font-size: 14px;
            animation: slideDown 0.3s ease;
        `;

        // 添加动画样式
        if (!document.getElementById('disclosure-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'disclosure-notification-styles';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        transform: translateX(-50%) translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideDown 0.3s ease reverse';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 3000);
    }
}

// 当DOM加载完成后初始化内容脚本
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ContentScript();
    });
} else {
    new ContentScript();
}