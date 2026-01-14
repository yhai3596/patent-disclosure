/**
 * Chrome扩展后台服务工作者
 * 处理扩展的生命周期事件和核心功能
 */

// 扩展安装时初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('专利技术交底书助手已安装');

  // 初始化默认设置
  chrome.storage.sync.set({
    disclosureTemplate: 'default',
    autoSave: true,
    exportFormat: 'markdown'
  });

  // 创建上下文菜单（如果需要）
  chrome.contextMenus.create({
    id: 'createDisclosure',
    title: '创建技术交底书',
    contexts: ['page']
  });
});

// 监听键盘快捷键
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open_disclosure_assistant') {
    chrome.action.openPopup();
  }
});

// 监听来自popup或content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('收到消息:', request);

  switch (request.action) {
    case 'generateDisclosure':
      // 生成技术交底书
      generateDisclosureDocument(request.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // 保持消息通道开放

    case 'saveDisclosure':
      // 保存技术交底书
      saveDisclosureDocument(request.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'exportDisclosure':
      // 导出技术交底书
      exportDisclosureDocument(request.data, request.format)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getDisclosures':
      // 获取所有保存的文档
      getStoredDisclosures()
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getDisclosure':
      // 获取单个文档
      getStoredDisclosure(request.id)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'deleteDisclosure':
      // 删除文档
      deleteDisclosure(request.id)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'saveDraft':
      // 保存草稿
      saveDraft(request.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getDraft':
      // 获取草稿
      getDraft()
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'clearAllData':
      // 清除所有数据
      clearAllData()
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'saveSettings':
      // 保存设置
      saveSettings(request.settings)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getSettings':
      // 获取设置
      getSettings()
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
  }
});

// 生成技术交底书文档
async function generateDisclosureDocument(data) {
  // 获取模板类型
  const settings = await getSettings();
  const template = getTemplateByType(settings.template || 'default');

  // 应用数据到模板
  return generateFormattedDocument(template, data);
}

// 根据类型获取模板
function getTemplateByType(templateType) {
  const templates = {
    default: {
      name: '默认模板',
      sections: [
        { key: 'title', title: '文档标题', required: true },
        { key: 'documentId', title: '文档编号', required: false },
        { key: 'technicalField', title: '技术领域', required: true },
        { key: 'inventor', title: '发明人', required: true },
        { key: 'backgroundTechnology', title: '背景技术', required: true },
        { key: 'currentProblems', title: '现有技术存在的问题', required: true },
        { key: 'technicalProblem', title: '技术问题', required: true },
        { key: 'technicalSolution', title: '技术方案', required: true },
        { key: 'beneficialEffects', title: '有益效果', required: true },
        { key: 'embodimentDescription', title: '具体实施方式', required: false }
      ]
    },
    detailed: {
      name: '详细模板',
      sections: [
        { key: 'title', title: '文档标题', required: true },
        { key: 'documentId', title: '文档编号', required: false },
        { key: 'technicalField', title: '技术领域', required: true },
        { key: 'inventor', title: '发明人', required: true },
        { key: 'backgroundTechnology', title: '背景技术', required: true },
        { key: 'currentProblems', title: '现有技术存在的问题', required: true },
        { key: 'technicalProblem', title: '技术问题', required: true },
        { key: 'technicalSolution', title: '技术方案', required: true },
        { key: 'keyFeatures', title: '关键技术特征', required: false },
        { key: 'beneficialEffects', title: '有益效果', required: true },
        { key: 'performanceData', title: '性能提升数据', required: false },
        { key: 'embodimentDescription', title: '具体实施方式', required: false }
      ]
    },
    simple: {
      name: '简化模板',
      sections: [
        { key: 'title', title: '文档标题', required: true },
        { key: 'technicalField', title: '技术领域', required: true },
        { key: 'technicalProblem', title: '技术问题', required: true },
        { key: 'technicalSolution', title: '技术方案', required: true },
        { key: 'beneficialEffects', title: '有益效果', required: true }
      ]
    }
  };

  return templates[templateType] || templates.default;
}

// 生成格式化的文档
function generateFormattedDocument(template, data) {
  let document = `# ${data.title || '技术交底书'}\n\n`;

  // 添加文档元数据
  document += `**文档编号**: ${data.documentId || '未填写'}\n`;
  document += `**技术领域**: ${data.technicalField || '未填写'}\n`;
  document += `**发明人**: ${data.inventor || '未填写'}\n`;
  document += `**日期**: ${data.date || new Date().toLocaleDateString()}\n\n`;
  document += '---\n\n';

  // 生成各个章节
  template.sections.forEach(section => {
    const content = data[section.key];
    if (content || section.required) {
      switch (section.key) {
        case 'backgroundTechnology':
          document += `## 1. 【发现问题】背景技术\n\n${formatSection(content, section.title)}\n\n`;
          break;
        case 'currentProblems':
          document += `### 现有技术存在的问题\n\n${formatSection(content, section.title)}\n\n`;
          break;
        case 'technicalProblem':
          document += `## 2. 【简述方案核心，整体技术效果】发明摘要\n\n${formatSection(data.technicalProblem, section.title)}\n\n`;
          break;
        case 'technicalSolution':
          document += `## 3. 【设计方案】技术方案详细阐述\n\n${formatSection(content, section.title)}\n\n`;
          break;
        case 'keyFeatures':
          if (Array.isArray(content) && content.length > 0) {
            document += `### 关键技术特征\n\n`;
            content.forEach((feature, index) => {
              document += `${index + 1}. ${feature}\n`;
            });
            document += '\n';
          }
          break;
        case 'beneficialEffects':
          document += `## 4. 【技术效果】有益效果\n\n${formatSection(content, section.title)}\n\n`;
          if (data.performanceData) {
            document += `### 性能提升数据\n\n${data.performanceData}\n\n`;
          }
          break;
        case 'embodimentDescription':
          document += `## 5. 具体实施方式\n\n${formatSection(content, section.title)}\n\n`;
          break;
        default:
          if (section.key !== 'title' && section.key !== 'documentId' &&
              section.key !== 'inventor' && section.key !== 'date') {
            document += `## ${section.title}\n\n${formatSection(content, section.title)}\n\n`;
          }
          break;
      }
    }
  });

  return document;
}

// 格式化章节内容
function formatSection(content, title) {
  if (!content) {
    return `（${title}未填写）`;
  }
  return content;
}

// 保存技术交底书到本地存储
async function saveDisclosureDocument(data) {
  const disclosures = await getStoredDisclosures();
  const id = Date.now().toString();

  disclosures[id] = {
    id,
    name: data.title || `技术交底书_${new Date().toLocaleDateString()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data
  };

  await chrome.storage.local.set({ disclosures });
  return { id, name: disclosures[id].name };
}

// 获取存储的技术交底书列表
async function getStoredDisclosures() {
  const result = await chrome.storage.local.get(['disclosures']);
  return result.disclosures || {};
}

// 获取单个存储的技术交底书
async function getStoredDisclosure(id) {
  const disclosures = await getStoredDisclosures();
  return disclosures[id] || null;
}

// 删除技术交底书
async function deleteDisclosure(id) {
  const disclosures = await getStoredDisclosures();
  delete disclosures[id];
  await chrome.storage.local.set({ disclosures });
  return { success: true };
}

// 保存草稿
async function saveDraft(data) {
  await chrome.storage.local.set({ draft: data });
  return { success: true };
}

// 获取草稿
async function getDraft() {
  const result = await chrome.storage.local.get(['draft']);
  return result.draft || null;
}

// 清除所有数据
async function clearAllData() {
  await chrome.storage.local.clear();
  await chrome.storage.sync.clear();
  return { success: true };
}

// 保存设置
async function saveSettings(settings) {
  await chrome.storage.sync.set(settings);
  return { success: true };
}

// 获取设置
async function getSettings() {
  const result = await chrome.storage.sync.get({
    autoSave: true,
    exportFormat: 'markdown',
    template: 'default'
  });
  return result;
}

// 获取技术交底书模板
async function getDisclosureTemplate() {
  const result = await chrome.storage.local.get(['disclosureTemplate']);
  return result.disclosureTemplate || 'default';
}

// 将数据应用到模板
function applyDataToTemplate(template, data) {
  // 简单的模板替换逻辑
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || '';
  });
}

// 导出技术交底书文档
async function exportDisclosureDocument(data, format) {
  let content = '';
  let filename = `技术交底书_${new Date().toISOString().split('T')[0]}`;
  let mimeType = '';
  let shouldUseDownloadAPI = true;

  switch (format) {
    case 'markdown':
      content = generateMarkdownContent(data);
      filename += '.md';
      mimeType = 'text/markdown';
      break;
    case 'html':
      content = generateHTMLContent(data);
      filename += '.html';
      mimeType = 'text/html';
      break;
    case 'pdf':
      content = generateHTMLContent(data);
      filename += '.pdf';
      mimeType = 'application/pdf';
      // PDF需要特殊处理
      shouldUseDownloadAPI = false;
      await downloadPDF(content, filename);
      return { success: true, filename };
    case 'docx':
      content = generateMarkdownContent(data);
      filename += '.docx';
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      break;
    case 'txt':
      content = generatePlainTextContent(data);
      filename += '.txt';
      mimeType = 'text/plain';
      break;
    default:
      throw new Error('不支持的导出格式');
  }

  if (shouldUseDownloadAPI) {
    // 使用Chrome下载API
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    await chrome.downloads.download({
      url,
      filename: filename,
      saveAs: true
    });

    URL.revokeObjectURL(url);
  } else {
    // 直接下载
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return { success: true, filename };
}

// 下载PDF文件
async function downloadPDF(htmlContent, filename) {
  // 创建一个新的窗口来生成PDF
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // 等待内容加载完成后生成PDF
  printWindow.onload = () => {
    printWindow.print();
    setTimeout(() => {
      printWindow.close();
    }, 1000);
  };
}

// 生成纯文本内容
function generatePlainTextContent(data) {
  let content = `${data.title || '技术交底书'}\n`;
  content += `${'='.repeat(50)}\n\n`;
  content += `文档编号: ${data.documentId || '未填写'}\n`;
  content += `技术领域: ${data.technicalField || '未填写'}\n`;
  content += `发明人: ${data.inventor || '未填写'}\n`;
  content += `日期: ${data.date || new Date().toLocaleDateString()}\n\n`;

  content += `【发现问题】背景技术\n`;
  content += `${'-'.repeat(30)}\n`;
  content += `${data.backgroundTechnology || '未填写'}\n\n`;

  if (data.currentProblems) {
    content += `现有技术存在的问题\n`;
    content += `${'-'.repeat(30)}\n`;
    content += `${data.currentProblems}\n\n`;
  }

  content += `【简述方案核心，整体技术效果】发明摘要\n`;
  content += `${'-'.repeat(30)}\n`;
  content += `${data.technicalProblem || '未填写'}\n\n`;

  content += `【设计方案】技术方案详细阐述\n`;
  content += `${'-'.repeat(30)}\n`;
  content += `${data.technicalSolution || '未填写'}\n\n`;

  if (data.keyFeatures && data.keyFeatures.length > 0) {
    content += `关键技术特征\n`;
    content += `${'-'.repeat(30)}\n`;
    data.keyFeatures.forEach((feature, index) => {
      content += `${index + 1}. ${feature}\n`;
    });
    content += '\n';
  }

  content += `【技术效果】有益效果\n`;
  content += `${'-'.repeat(30)}\n`;
  content += `${data.beneficialEffects || '未填写'}\n\n`;

  if (data.performanceData) {
    content += `性能提升数据\n`;
    content += `${'-'.repeat(30)}\n`;
    content += `${data.performanceData}\n\n`;
  }

  content += `具体实施方式\n`;
  content += `${'-'.repeat(30)}\n`;
  content += `${data.embodimentDescription || '未填写'}\n\n`;

  return content;
}

// 生成Markdown内容
function generateMarkdownContent(data) {
  return `# ${data.title || '技术交底书'}

**文档编号**: ${data.documentId || ''}
**技术领域**: ${data.technicalField || ''}
**发明人**: ${data.inventor || ''}
**日期**: ${data.date || new Date().toLocaleDateString()}

## 1. 技术领域

${data.technicalField || ''}

## 2. 背景技术

${data.backgroundTechnology || ''}

## 3. 技术问题

${data.technicalProblem || ''}

## 4. 技术方案

${data.technicalSolution || ''}

## 5. 有益效果

${data.beneficialEffects || ''}

## 6. 具体实施方式

${data.embodimentDescription || ''}
`;
}

// 生成HTML内容
function generateHTMLContent(data) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title || '技术交底书'}</title>
    <style>
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; }
        h2 { color: #34495e; margin-top: 30px; }
        .metadata { background: #ecf0f1; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>${data.title || '技术交底书'}</h1>
    <div class="metadata">
        <p><strong>文档编号</strong>: ${data.documentId || ''}</p>
        <p><strong>技术领域</strong>: ${data.technicalField || ''}</p>
        <p><strong>发明人</strong>: ${data.inventor || ''}</p>
        <p><strong>日期</strong>: ${data.date || new Date().toLocaleDateString()}</p>
    </div>

    <h2>1. 技术领域</h2>
    <p>${data.technicalField || ''}</p>

    <h2>2. 背景技术</h2>
    <p>${data.backgroundTechnology || ''}</p>

    <h2>3. 技术问题</h2>
    <p>${data.technicalProblem || ''}</p>

    <h2>4. 技术方案</h2>
    <p>${data.technicalSolution || ''}</p>

    <h2>5. 有益效果</h2>
    <p>${data.beneficialEffects || ''}</p>

    <h2>6. 具体实施方式</h2>
    <p>${data.embodimentDescription || ''}</p>
</body>
</html>
`;
}