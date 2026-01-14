/**
 * AI Service for Patent Disclosure Assistant
 * 基于SKILL.md定义的六步工作流实现智能撰写功能
 *
 * 核心工作流程：
 * Step 1: 规范理解 (Understand Specifications)
 * Step 2: 信息收集 (Information Collection)
 * Step 3: 草稿生成 (Draft Generation)
 * Step 4: 文档审核 (Document Review)
 * Step 5: 最终文档生成 (Final Document Production)
 * Step 6: 文档管理 (Document Management)
 */

class AIService {
  constructor() {
    // 支持的免费AI提供商
    this.providers = {
      zhipu: {
        name: '智谱AI',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        models: ['glm-4-flash', 'glm-4-plus', 'glm-4-air'],
        defaultModel: 'glm-4-flash',
        free: true,
        requiresKey: true
      },
      qwen: {
        name: '通义千问',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
        defaultModel: 'qwen-turbo',
        free: true,
        requiresKey: true
      },
      deepseek: {
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/chat/completions',
        models: ['deepseek-chat', 'deepseek-coder'],
        defaultModel: 'deepseek-chat',
        free: true,
        requiresKey: true
      },
      kimi: {
        name: 'Kimi (Moonshot)',
        baseUrl: 'https://api.moonshot.cn/v1/chat/completions',
        models: ['moonshot-v1-8k', 'moonshot-v1-32k'],
        defaultModel: 'moonshot-v1-8k',
        free: true,
        requiresKey: true
      }
    };

    this.currentProvider = 'zhipu';
    this.apiKey = '';
    this.model = '';
    this.conversationHistory = [];
  }

  /**
   * 初始化AI服务
   */
  async init() {
    const settings = await this.getSettings();
    this.currentProvider = settings.provider || 'zhipu';
    this.apiKey = settings.apiKey || '';
    this.model = settings.model || this.providers[this.currentProvider].defaultModel;
  }

  /**
   * 获取用户设置
   */
  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['aiProvider', 'aiApiKey', 'aiModel'], (result) => {
        resolve({
          provider: result.aiProvider || 'zhipu',
          apiKey: result.aiApiKey || '',
          model: result.aiModel || ''
        });
      });
    });
  }

  /**
   * 保存用户设置
   */
  async saveSettings(provider, apiKey, model) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({
        aiProvider: provider,
        aiApiKey: apiKey,
        aiModel: model
      }, () => {
        this.currentProvider = provider;
        this.apiKey = apiKey;
        this.model = model;
        resolve();
      });
    });
  }

  /**
   * 获取当前提供商信息
   */
  getProviderInfo(provider = null) {
    const key = provider || this.currentProvider;
    return this.providers[key];
  }

  /**
   * 获取所有提供商列表
   */
  getAllProviders() {
    return Object.entries(this.providers).map(([key, value]) => ({
      key,
      name: value.name,
      models: value.models,
      free: value.free
    }));
  }

  /**
   * 测试API连接
   */
  async testConnection(provider, apiKey, model) {
    try {
      const providerInfo = this.providers[provider];
      const response = await this.makeRequest(providerInfo.baseUrl, apiKey, model, [
        { role: 'user', content: '你好，请回复"连接成功"' }
      ]);
      return { success: true, response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 发送API请求
   */
  async makeRequest(baseUrl, apiKey, model, messages, options = {}) {
    const requestBody = {
      model: model,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 3000
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API错误: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // ============================================================
  // STEP 1: 规范理解 (Understand Specifications)
  // ============================================================

  /**
   * Step 1: 分析撰写指南和示例文档
   * 自动提取关键要求和格式标准
   */
  async understandSpecifications(guidelines, samples) {
    if (!this.apiKey) {
      throw new Error('请先在设置中配置API Key');
    }

    const prompt = `你是一位专利撰写专家。请分析以下技术交底书撰写指南和示例文档，提取关键撰写要求：

【撰写指南】：
${guidelines || '见默认规范'}

【示例文档】：
${samples || '见默认模板'}

请提取并返回以下内容（以JSON格式）：
{
  "structureRequirements": "文档结构要求（必需章节和可选章节）",
  "keyPoints": ["撰写要点1", "撰写要点2"],
  "formatStandards": "格式规范要求",
  "commonIssues": ["常见问题1", "常见问题2"],
  "threeStepMethod": "三步法原则说明"
}`;

    const providerInfo = this.getProviderInfo();
    return await this.makeRequest(
      providerInfo.baseUrl,
      this.apiKey,
      this.model,
      [{ role: 'user', content: prompt }],
      { temperature: 0.3, maxTokens: 2000 }
    );
  }

  // ============================================================
  // STEP 2: 信息收集 (Information Collection)
  // ============================================================

  /**
   * Step 2: 智能对话引导信息收集
   * 通过多轮对话引导用户提供完整信息
   */
  async collectInformation(userMessage, formData, conversationHistory = []) {
    if (!this.apiKey) {
      throw new Error('请先在设置中配置API Key');
    }

    // 构建系统提示词
    const systemPrompt = this.buildCollectionSystemPrompt(formData);

    // 构建消息历史
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-20), // 保留最近20轮对话
      { role: 'user', content: userMessage }
    ];

    // 保存到对话历史
    this.conversationHistory = messages;

    const providerInfo = this.getProviderInfo();
    return await this.makeRequest(
      providerInfo.baseUrl,
      this.apiKey,
      this.model,
      messages,
      { temperature: 0.8, maxTokens: 1500 }
    );
  }

  /**
   * 构建信息收集的系统提示词
   */
  buildCollectionSystemPrompt(formData) {
    return `你是一位专业的专利技术交底书撰写助手。你的任务是通过对话引导用户逐步完成技术交底书的信息收集。

【核心思维方法：三步法】
你必须始终遵循"三步法"原则引导用户：
1. **第一步：发现问题** - 引导用户描述现有技术的不足和缺点
2. **第二步：设计方案** - 引导用户说明通过什么技术手段解决问题
3. **第三步：技术效果** - 引导用户说明解决问题后取得的有益效果

【当前已收集信息】：
${this.formatFormData(formData)}

【信息完整性检查】：
请检查以下必需信息是否完整：
1. 技术领域（至少10字）
2. 背景技术（至少50字，包含现有技术和存在的问题）
3. 技术问题（具体明确，与背景技术中的问题对应）
4. 技术方案（详细描述，包含核心创新点，至少100字）
5. 有益效果（具体说明，尽可能量化，至少30字）

【对话策略】：
1. 如果信息完整，告诉用户可以生成草稿了
2. 如果信息不完整，优先询问缺失的关键信息
3. 遵循三步法逻辑：先问现有技术和问题，再问解决方案，最后问效果
4. 询问要具体但易懂，避免专业术语堆砌
5. 对用户的回答给予积极反馈
6. 保持友好、专业的语气

【示例对话流程】：
用户："我想写一个空调换热器的专利"
助手："好的！请问这个专利属于哪个技术领域？比如是制冷设备、换热器设计，还是其他领域？"

用户："制冷设备中的换热器"
助手："明白了。目前空调换热器在技术方面存在什么问题呢？比如效率、成本、可靠性等方面有什么不足？"

[继续对话...]

请根据以上指导，与用户进行对话，引导完成信息收集。`;
  }

  /**
   * 验证信息完整性
   */
  validateInformation(formData) {
    const issues = [];
    const suggestions = [];

    // 必需字段检查
    if (!formData.technicalField || formData.technicalField.length < 10) {
      issues.push({
        field: 'technicalField',
        level: 'error',
        message: '技术领域描述过短，至少需要10个字符'
      });
    }

    if (!formData.background || formData.background.length < 50) {
      issues.push({
        field: 'background',
        level: 'error',
        message: '背景技术描述过短，至少需要50个字符，应包含现有技术和存在的问题'
      });
    }

    if (!formData.problem || formData.problem.length < 10) {
      issues.push({
        field: 'problem',
        level: 'error',
        message: '技术问题描述不够具体，至少需要10个字符'
      });
    }

    if (!formData.solution || formData.solution.length < 100) {
      issues.push({
        field: 'solution',
        level: 'error',
        message: '技术方案描述过于简单，至少需要100个字符，应详细描述核心创新点'
      });
    }

    if (!formData.effects || formData.effects.length < 30) {
      issues.push({
        field: 'effects',
        level: 'warning',
        message: '有益效果描述过短，至少需要30个字符，建议量化说明'
      });
    }

    // 三步法逻辑检查
    if (formData.background && formData.problem) {
      if (!formData.background.includes('问题') && !formData.background.includes('不足')) {
        suggestions.push('背景技术中应明确描述现有技术存在的问题或不足（三步法第一步）');
      }
    }

    if (formData.problem && formData.solution) {
      if (formData.solution.length < formData.problem.length * 2) {
        suggestions.push('技术方案的描述应该比问题描述更详细（三步法第二步）');
      }
    }

    if (formData.solution && !formData.effects) {
      suggestions.push('请说明技术方案带来的有益效果（三步法第三步）');
    }

    return {
      complete: issues.filter(i => i.level === 'error').length === 0,
      issues,
      suggestions
    };
  }

  // ============================================================
  // STEP 3: 草稿生成 (Draft Generation)
  // ============================================================

  /**
   * Step 3: 生成完整技术交底书草稿
   * 按照9章节标准结构生成
   */
  async generateDraft(formData) {
    if (!this.apiKey) {
      throw new Error('请先在设置中配置API Key');
    }

    const prompt = this.buildDraftPrompt(formData);

    const providerInfo = this.getProviderInfo();
    return await this.makeRequest(
      providerInfo.baseUrl,
      this.apiKey,
      this.model,
      [{ role: 'user', content: prompt }],
      { temperature: 0.7, maxTokens: 4000 }
    );
  }

  /**
   * 构建草稿生成提示词
   */
  buildDraftPrompt(formData) {
    return `你是一位专业的专利撰写专家。请根据以下信息生成完整的技术交底书。

【发明信息】：
发明名称：${formData.title || '未提供'}
技术领域：${formData.technicalField || '未提供'}
背景技术：${formData.background || '未提供'}
技术问题：${formData.problem || '未提供'}
技术方案：${formData.solution || '未提供'}
有益效果：${formData.effects || '未提供'}
实施方式：${formData.implementation || '未提供'}
附图说明：${formData.drawings || '无'}

【撰写要求】：

1. **严格遵循三步法原则**：
   - 背景技术中明确描述现有技术的问题（发现问题）
   - 技术方案详细说明如何解决问题（设计方案）
   - 有益效果说明解决问题后的好处（技术效果）

2. **按9章节标准结构生成**：
   ## 1. 技术领域
   ## 2. 背景技术
   ### 2.1 现有技术概述
   ### 2.2 存在的问题
   ## 3. 技术问题
   ## 4. 技术方案
   ### 4.1 整体架构
   ### 4.2 关键技术
   ### 4.3 工作流程
   ## 5. 有益效果
   ### 5.1 性能提升
   ### 5.2 成本效益
   ### 5.3 其他优势
   ## 6. 附图说明
   ## 7. 具体实施方式
   ### 7.1 实施环境
   ### 7.2 实施步骤
   ### 7.3 实施例
   ## 8. 技术效果验证
   ## 9. 总结

3. **撰写要点**：
   - 语言客观、专业、准确
   - 技术术语使用规范
   - 逻辑清晰，层次分明
   - 有益效果尽可能量化
   - 实施方式具体可行

请直接生成完整的技术交底书文档，不要包含任何开场白或解释。`;
  }

  /**
   * 生成单个章节内容
   */
  async generateSection(section, formData) {
    if (!this.apiKey) {
      throw new Error('请先在设置中配置API Key');
    }

    const sectionPrompts = {
      technicalField: `请根据发明信息生成"技术领域"章节内容：
发明名称：${formData.title || '未提供'}
要求：明确、具体，避免过于宽泛，50字以内。`,

      background: `请根据发明信息生成"背景技术"章节内容：
发明名称：${formData.title || '未提供'}
技术问题：${formData.problem || '未提供'}
要求：
- 描述现有技术现状
- 明确指出存在的问题或不足（三步法第一步）
- 客观准确，150-250字
- 包含"2.1 现有技术概述"和"2.2 存在的问题"两个子章节`,

      problem: `请根据发明信息生成"技术问题"章节内容：
背景技术：${formData.background || '未提供'}
要求：具体明确，与背景技术中的问题对应，50-100字。`,

      solution: `请根据发明信息生成"技术方案"章节内容：
发明名称：${formData.title || '未提供'}
技术问题：${formData.problem || '未提供'}
技术特征：${formData.features || '未提供'}
要求：
- 详细描述如何解决技术问题（三步法第二步）
- 包含整体架构、关键技术、工作流程
- 300-500字
- 包含"4.1 整体架构"、"4.2 关键技术"、"4.3 工作流程"三个子章节`,

      effects: `请根据发明信息生成"有益效果"章节内容：
技术方案：${formData.solution || '未提供'}
要求：
- 说明技术方案带来的好处（三步法第三步）
- 尽可能量化（如提高X%、降低Y%）
- 100-200字
- 包含"5.1 性能提升"、"5.2 成本效益"、"5.3 其他优势"三个子章节`
    };

    const prompt = sectionPrompts[section] || '请生成该章节内容';
    prompt += '\n\n请直接生成章节内容，不要包含任何开场白或解释。';

    const providerInfo = this.getProviderInfo();
    return await this.makeRequest(
      providerInfo.baseUrl,
      this.apiKey,
      this.model,
      [{ role: 'user', content: prompt }],
      { temperature: 0.7, maxTokens: 2000 }
    );
  }

  // ============================================================
  // STEP 4: 文档审核 (Document Review)
  // ============================================================

  /**
   * Step 4: 文档审核
   * 对照撰写指南和审核清单进行140+项检查
   */
  async reviewDocument(documentContent, formData) {
    if (!this.apiKey) {
      throw new Error('请先在设置中配置API Key');
    }

    const prompt = `你是一位专业的专利审核专家。请对以下技术交底书进行全面审核。

【文档内容】：
${documentContent}

【审核标准】：
请按照以下6个维度进行审核（每维度25分，总分150分）：

1. **基本信息审核**（25分）
   - 文档标题清晰准确
   - 技术领域描述具体明确
   - 文档编号、发明人等信息完整

2. **内容完整性审核**（25分）
   - 包含9个必需章节
   - 每个章节内容完整
   - 三步法逻辑完整（问题→方案→效果）

3. **技术准确性审核**（25分）
   - 技术术语使用规范准确
   - 技术原理描述正确
   - 创新点突出明确
   - 数据真实可靠

4. **逻辑一致性审核**（25分）
   - 问题-方案对应（技术方案针对技术问题）
   - 方案-效果对应（有益效果来自技术方案）
   - 前后内容一致
   - 因果关系清晰

5. **文档质量审核**（25分）
   - 语言通顺，无语法错误
   - 表达清晰，易于理解
   - 术语使用一致
   - 结构层次分明

6. **格式规范审核**（25分）
   - 符合9章节标准结构
   - 标题层级清晰
   - 编号连续正确
   - 排版规范统一

请以JSON格式返回审核结果：
{
  "totalScore": 120,
  "scores": {
    "basicInfo": 20,
    "completeness": 22,
    "technicality": 23,
    "logic": 20,
    "quality": 18,
    "format": 17
  },
  "issues": [
    {
      "level": "error|warning|suggestion",
      "category": "基本信息|内容完整性|技术准确性|逻辑一致性|文档质量|格式规范",
      "section": "章节名称",
      "message": "具体问题描述",
      "suggestion": "改进建议"
    }
  ],
  "summary": "总体评价和建议"
}`;

    const providerInfo = this.getProviderInfo();
    return await this.makeRequest(
      providerInfo.baseUrl,
      this.apiKey,
      this.model,
      [{ role: 'user', content: prompt }],
      { temperature: 0.3, maxTokens: 2500 }
    );
  }

  /**
   * 内容优化建议
   */
  async optimizeContent(section, content, context = {}) {
    if (!this.apiKey) {
      throw new Error('请先在设置中配置API Key');
    }

    const sectionNames = {
      technicalField: '技术领域',
      background: '背景技术',
      problem: '技术问题',
      solution: '技术方案',
      effects: '有益效果',
      implementation: '具体实施方式'
    };

    const prompt = `你是一位专业的专利撰写专家。请对以下章节内容进行分析和优化。

【章节】：${sectionNames[section] || section}
【当前内容】：
${content}

【上下文信息】：
${JSON.stringify(context, null, 2)}

请从以下方面提供建议：
1. 内容完整性：是否有缺失的重要信息
2. 技术准确性：描述是否准确，术语是否规范
3. 逻辑清晰性：内容逻辑是否清晰
4. 语言表达：是否简洁明了
5. 创新性体现：是否充分体现技术创新点

请以JSON格式返回：
{
  "score": 85,
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"],
  "optimized": "优化后的完整内容"
}`;

    const providerInfo = this.getProviderInfo();
    return await this.makeRequest(
      providerInfo.baseUrl,
      this.apiKey,
      this.model,
      [{ role: 'user', content: prompt }],
      { temperature: 0.5, maxTokens: 2000 }
    );
  }

  // ============================================================
  // STEP 5: 最终文档生成 (Final Document Production)
  // ============================================================

  /**
   * Step 5: 整合审核反馈生成最终文档
   */
  async produceFinalDocument(draftContent, reviewFeedback) {
    if (!this.apiKey) {
      throw new Error('请先在设置中配置API Key');
    }

    const prompt = `你是一位专业的专利撰写专家。请根据审核反馈对草稿进行修改，生成最终文档。

【草稿内容】：
${draftContent}

【审核反馈】：
${reviewFeedback}

请根据审核反馈中的问题和建议，对草稿进行修改：
1. 修正所有error级别的问题
2. 改进warning级别的问题
3. 考虑suggestion级别的建议
4. 保持文档的整体结构和逻辑

请直接生成最终文档，不要包含任何开场白或解释。`;

    const providerInfo = this.getProviderInfo();
    return await this.makeRequest(
      providerInfo.baseUrl,
      this.apiKey,
      this.model,
      [{ role: 'user', content: prompt }],
      { temperature: 0.5, maxTokens: 4000 }
    );
  }

  // ============================================================
  // STEP 6: 文档管理 (Document Management)
  // ============================================================

  /**
   * Step 6: 保存文档到本地存储
   */
  async saveDocument(documentData) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['disclosureDocuments'], (result) => {
        const documents = result.disclosureDocuments || [];
        const newDoc = {
          id: Date.now().toString(),
          title: documentData.title || '未命名文档',
          content: documentData.content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0',
          status: 'draft',
          metadata: {
            wordCount: documentData.content.length,
            aiGenerated: true,
            reviewScore: documentData.reviewScore || 0
          }
        };

        documents.unshift(newDoc);

        chrome.storage.local.set({ disclosureDocuments: documents }, () => {
          resolve(newDoc);
        });
      });
    });
  }

  /**
   * 获取所有文档列表
   */
  async getDocuments() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['disclosureDocuments'], (result) => {
        resolve(result.disclosureDocuments || []);
      });
    });
  }

  /**
   * 删除文档
   */
  async deleteDocument(docId) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['disclosureDocuments'], (result) => {
        const documents = result.disclosureDocuments || [];
        const filtered = documents.filter(doc => doc.id !== docId);
        chrome.storage.local.set({ disclosureDocuments: filtered }, () => {
          resolve();
        });
      });
    });
  }

  // ============================================================
  // 辅助方法
  // ============================================================

  /**
   * 格式化表单数据
   */
  formatFormData(formData) {
    if (!formData) return '暂无信息';

    const fieldNames = {
      title: '发明名称',
      technicalField: '技术领域',
      background: '背景技术',
      problem: '技术问题',
      solution: '技术方案',
      effects: '有益效果',
      implementation: '实施方式',
      features: '技术特征',
      drawings: '附图说明'
    };

    return Object.entries(formData)
      .filter(([key, value]) => value && value.trim())
      .map(([key, value]) => {
        const name = fieldNames[key] || key;
        const preview = value.length > 100 ? value.substring(0, 100) + '...' : value;
        return `${name}: ${preview}`;
      })
      .join('\n');
  }

  /**
   * 清空对话历史
   */
  clearConversationHistory() {
    this.conversationHistory = [];
  }

  /**
   * 获取对话历史
   */
  getConversationHistory() {
    return this.conversationHistory;
  }
}

// 导出单例
const aiService = new AIService();
