/**
 * 性能优化和用户体验模块
 * 提供缓存、延迟加载、错误处理等功能
 */

class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
        this.performanceMetrics = {
            operations: [],
            errors: []
        };
        this.init();
    }

    /**
     * 初始化性能优化器
     */
    init() {
        this.setupErrorHandling();
        this.setupPerformanceMonitoring();
        console.log('性能优化器已初始化');
    }

    /**
     * 设置错误处理
     */
    setupErrorHandling() {
        // 全局错误处理
        window.addEventListener('error', (event) => {
            this.logError('JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });

        // Promise错误处理
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', {
                reason: event.reason
            });
        });
    }

    /**
     * 设置性能监控
     */
    setupPerformanceMonitoring() {
        // 监控页面加载性能
        if (window.performance && window.performance.timing) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    this.measurePageLoadPerformance();
                }, 0);
            });
        }
    }

    /**
     * 测量页面加载性能
     */
    measurePageLoadPerformance() {
        const timing = window.performance.timing;
        const navigation = performance.getEntriesByType('navigation')[0];

        const metrics = {
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            loadComplete: timing.loadEventEnd - timing.navigationStart,
            domInteractive: timing.domInteractive - timing.navigationStart,
            firstPaint: navigation.loadEventEnd - navigation.fetchStart,
            resourceLoadTime: this.calculateResourceLoadTime()
        };

        this.logPerformance('Page Load', metrics);
    }

    /**
     * 计算资源加载时间
     */
    calculateResourceLoadTime() {
        const resources = performance.getEntriesByType('resource');
        const totalTime = resources.reduce((sum, resource) => {
            return sum + (resource.responseEnd - resource.startTime);
        }, 0);
        return totalTime;
    }

    /**
     * 缓存函数执行结果
     */
    async cached(key, operation, timeout = this.cacheTimeout) {
        // 检查缓存
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < timeout) {
            console.log(`缓存命中: ${key}`);
            return cached.data;
        }

        // 执行操作
        console.log(`执行操作: ${key}`);
        const result = await operation();

        // 缓存结果
        this.cache.set(key, {
            data: result,
            timestamp: Date.now()
        });

        return result;
    }

    /**
     * 延迟加载
     */
    lazyLoad(selector, loader) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loader(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px'
        });

        document.querySelectorAll(selector).forEach(element => {
            observer.observe(element);
        });
    }

    /**
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 节流函数
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 异步操作包装器
     */
    async wrapAsync(operation, context = {}) {
        const startTime = performance.now();
        try {
            const result = await operation();
            const duration = performance.now() - startTime;

            this.logPerformance('Async Operation', {
                duration,
                success: true,
                ...context
            });

            return result;
        } catch (error) {
            const duration = performance.now() - startTime;

            this.logError('Async Operation Error', {
                duration,
                error: error.message,
                stack: error.stack,
                ...context
            });

            throw error;
        }
    }

    /**
     * 预加载资源
     */
    preloadResource(url) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = 'fetch';
        document.head.appendChild(link);
    }

    /**
     * 批量操作优化
     */
    batchOperations(operations, batchSize = 10) {
        return new Promise((resolve, reject) => {
            const results = [];
            let currentIndex = 0;

            const processBatch = () => {
                const batch = operations.slice(currentIndex, currentIndex + batchSize);
                if (batch.length === 0) {
                    resolve(results);
                    return;
                }

                Promise.allSettled(batch.map(op => op()))
                    .then(batchResults => {
                        results.push(...batchResults);
                        currentIndex += batchSize;
                        processBatch();
                    })
                    .catch(reject);
            };

            processBatch();
        });
    }

    /**
     * 记录性能指标
     */
    logPerformance(operation, metrics) {
        const entry = {
            operation,
            metrics,
            timestamp: Date.now()
        };

        this.performanceMetrics.operations.push(entry);

        // 保持最近100条记录
        if (this.performanceMetrics.operations.length > 100) {
            this.performanceMetrics.operations.shift();
        }

        console.log(`[性能] ${operation}:`, metrics);
    }

    /**
     * 记录错误
     */
    logError(type, error) {
        const entry = {
            type,
            error,
            timestamp: Date.now()
        };

        this.performanceMetrics.errors.push(entry);

        // 保持最近50条错误记录
        if (this.performanceMetrics.errors.length > 50) {
            this.performanceMetrics.errors.shift();
        }

        console.error(`[错误] ${type}:`, error);
    }

    /**
     * 获取性能报告
     */
    getPerformanceReport() {
        return {
            cacheSize: this.cache.size,
            totalOperations: this.performanceMetrics.operations.length,
            totalErrors: this.performanceMetrics.errors.length,
            recentOperations: this.performanceMetrics.operations.slice(-10),
            recentErrors: this.performanceMetrics.errors.slice(-10)
        };
    }

    /**
     * 清理缓存
     */
    clearCache() {
        this.cache.clear();
        console.log('缓存已清理');
    }

    /**
     * 内存使用监控
     */
    monitorMemoryUsage() {
        if (performance.memory) {
            const memory = performance.memory;
            return {
                used: Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
                total: Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
                limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100
            };
        }
        return null;
    }

    /**
     * UI响应性优化
     */
    optimizeUI() {
        // 使用requestAnimationFrame优化动画
        const animate = (callback) => {
            requestAnimationFrame(callback);
        };

        // 批量DOM更新
        const batchDOMUpdates = (updates) => {
            requestAnimationFrame(() => {
                updates.forEach(update => update());
            });
        };

        return { animate, batchDOMUpdates };
    }

    /**
     * 网络请求优化
     */
    optimizeNetworkRequests() {
        const requestCache = new Map();

        const fetchWithCache = async (url, options = {}) => {
            const cacheKey = `${url}_${JSON.stringify(options)}`;
            const cached = requestCache.get(cacheKey);

            if (cached && Date.now() - cached.timestamp < 60000) {
                return cached.data;
            }

            try {
                const response = await fetch(url, options);
                const data = await response.json();
                requestCache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
                return data;
            } catch (error) {
                console.error('网络请求失败:', error);
                throw error;
            }
        };

        return { fetchWithCache };
    }
}

// 全局性能优化器实例
let performanceOptimizer;

// 初始化性能优化器
document.addEventListener('DOMContentLoaded', () => {
    performanceOptimizer = new PerformanceOptimizer();
});

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
} else {
    window.PerformanceOptimizer = PerformanceOptimizer;
}

// 全局可访问的性能优化器
window.getPerformanceOptimizer = () => performanceOptimizer;