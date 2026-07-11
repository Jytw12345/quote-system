const CACHE_NAME = 'V3.4.157  更新日期：20260711';

const UPDATE_LOGS = [
    'fix 修复云同步Gist大小限制问题：模板图片改为存储在IndexedDB，同步时只传输imageId',
    'feat 云同步增加Repository模式，支持图片同步',
    'fix XLS导出图片居中显示，按原始比例自适应单元格大小',
    'fix 重写XLS导出功能，使用ExcelJS库支持图片嵌入和完整表头',
    'fix 修复图片旋转后变形的问题',
    'feat 图片编辑器新增字体颜色选择器，支持独立设置文字颜色',
    'feat 图片编辑器新增马赛克功能，支持涂抹遮盖敏感内容',
    'feat 优化图片编辑器移动端显示，支持触控操作',
    'fix 修复图片编辑器旋转/翻转功能不可用的问题',
    'fix 文字输入框改为自定义输入框，不再使用系统prompt',
    'fix 修复文字标注拖动位置功能，支持旋转后正常拖动',
    'feat 图片编辑器新增标注功能：线段、圆圈、箭头、文字标注',
    'feat 文字标注支持自定义位置、字号大小和字体选择',
    'fix 修复图片编辑器载入图片时显示灰色的问题',
    'fix 修复裁切功能不可用的问题',
    'feat 模板编辑页面输入框大小调整，优化列宽比例和间距',
    'feat 修复模板库切换tab时不显示模板的问题',
    'feat 项目明细图片支持移除操作',
    'feat 图片编辑器新增裁切、旋转、翻转、亮度、对比度功能',
    'feat 图片识别优先使用OCR.Space和本地Tesseract.js，智谱AI作为回退',
    'feat PDF识别使用智谱AI（多模态模型对表格识别效果更好）',
    'feat 移除智谱AI内置API Key，需在系统设置中配置后使用',
    'feat 报价单保存为模板时保留产品图片，使用模板时自动恢复',
    'feat 模板详情页面新增产品图片列，方便预览模板内容',
    'feat 模板卡片显示案例照片，支持单张/多张照片展示',
    'feat 模板库移除列表视图，统一使用卡片视图展示',
    'feat SW日志系统：支持日志存储、查询和展示'
];

const basePath = self.location.pathname.replace(/sw\.js$/, '') || '/quote-system/';

const LOG_DB_NAME = 'SWLogDB';
const LOG_STORE_NAME = 'logs';
const MAX_LOGS = 500;

function log(type, message, details) {
    const logEntry = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        type: type || 'info',
        message: message,
        details: details || null
    };
    
    console.log(`[SW][${type.toUpperCase()}]`, message, details);
    
    saveLog(logEntry);
    sendLogToClients(logEntry);
}

function saveLog(logEntry) {
    return new Promise(function(resolve, reject) {
        try {
            const request = indexedDB.open(LOG_DB_NAME, 1);
            
            request.onerror = function() {
                reject(request.error);
            };
            
            request.onsuccess = function(event) {
                const db = event.target.result;
                const transaction = db.transaction([LOG_STORE_NAME], 'readwrite');
                const store = transaction.objectStore(LOG_STORE_NAME);
                
                store.add(logEntry);
                
                store.count().onsuccess = function(e) {
                    const count = e.target.result;
                    if (count > MAX_LOGS) {
                        store.openCursor().onsuccess = function(cursorEvent) {
                            const cursor = cursorEvent.target.result;
                            if (cursor) {
                                cursor.delete();
                                cursor.continue();
                            }
                        };
                    }
                };
                
                transaction.oncomplete = function() {
                    db.close();
                    resolve();
                };
                
                transaction.onerror = function() {
                    db.close();
                    reject(transaction.error);
                };
            };
            
            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(LOG_STORE_NAME)) {
                    const store = db.createObjectStore(LOG_STORE_NAME, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                }
            };
        } catch (e) {
            console.log('[SW] 保存日志失败:', e);
            reject(e);
        }
    });
}

function sendLogToClients(logEntry) {
    self.clients.matchAll({ includeUncontrolled: true }).then(function(clients) {
        clients.forEach(function(client) {
            try {
                client.postMessage({
                    type: 'SW_LOG',
                    log: logEntry
                });
            } catch(e) {
                console.log('[SW] 发送日志到客户端失败:', e);
            }
        });
    });
}

function getAllLogs() {
    return new Promise(function(resolve, reject) {
        try {
            const request = indexedDB.open(LOG_DB_NAME, 1);
            
            request.onerror = function() {
                reject(request.error);
            };
            
            request.onsuccess = function(event) {
                const db = event.target.result;
                const transaction = db.transaction([LOG_STORE_NAME], 'readonly');
                const store = transaction.objectStore(LOG_STORE_NAME);
                const index = store.index('timestamp');
                const logs = [];
                
                index.openCursor(null, 'prev').onsuccess = function(cursorEvent) {
                    const cursor = cursorEvent.target.result;
                    if (cursor) {
                        logs.push(cursor.value);
                        cursor.continue();
                    } else {
                        db.close();
                        resolve(logs);
                    }
                };
                
                transaction.onerror = function() {
                    db.close();
                    reject(transaction.error);
                };
            };
            
            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(LOG_STORE_NAME)) {
                    const store = db.createObjectStore(LOG_STORE_NAME, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                }
            };
        } catch (e) {
            reject(e);
        }
    });
}

function clearLogs() {
    return new Promise(function(resolve, reject) {
        try {
            const request = indexedDB.open(LOG_DB_NAME, 1);
            
            request.onerror = function() {
                reject(request.error);
            };
            
            request.onsuccess = function(event) {
                const db = event.target.result;
                const transaction = db.transaction([LOG_STORE_NAME], 'readwrite');
                const store = transaction.objectStore(LOG_STORE_NAME);
                
                store.clear();
                
                transaction.oncomplete = function() {
                    db.close();
                    resolve();
                };
                
                transaction.onerror = function() {
                    db.close();
                    reject(transaction.error);
                };
            };
            
            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(LOG_STORE_NAME)) {
                    const store = db.createObjectStore(LOG_STORE_NAME, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                }
            };
        } catch (e) {
            reject(e);
        }
    });
}

self.addEventListener('install', event => {
    log('info', '开始安装新版本', { version: CACHE_NAME });
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                log('info', '缓存资源中...');
                return cache.addAll([
                    basePath,
                    basePath + 'index.html',
                    basePath + 'manifest.json',
                    basePath + 'sw.js'
                ]);
            })
            .then(() => {
                log('info', '安装完成，等待用户确认后激活');
            })
            .catch(err => {
                log('error', '安装失败', { error: err.message });
            })
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;

    if (request.method !== 'GET') {
        event.respondWith(fetch(request));
        return;
    }

    if (request.url.includes('index.html')) {
        event.respondWith(
            fetch(request).then(fetchResponse => {
                const responseToCache = fetchResponse.clone();
                if (fetchResponse && fetchResponse.status === 200) {
                    return caches.open(CACHE_NAME).then(cache => {
                        return cache.put(request, responseToCache).then(() => {
                            log('info', '更新缓存的 index.html', { url: request.url });
                            return fetchResponse;
                        });
                    });
                }
                return fetchResponse;
            }).catch(() => {
                log('warning', '网络请求失败，使用缓存', { url: request.url });
                return caches.match(request).then(cachedResponse => {
                    if (cachedResponse) return cachedResponse;
                    return caches.match(basePath + 'index.html');
                });
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    log('debug', '使用缓存响应', { url: request.url });
                    return response;
                }
                return fetch(event.request).then(fetchResponse => {
                    if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                        log('debug', '跳过缓存（非200或非basic）', { url: request.url, status: fetchResponse?.status });
                        return fetchResponse;
                    }
                    const responseToCache = fetchResponse.clone();
                    return caches.open(CACHE_NAME)
                        .then(cache => {
                            return cache.put(request, responseToCache).then(() => {
                                log('info', '缓存新资源', { url: request.url });
                                return fetchResponse;
                            });
                        });
                });
            })
            .catch(() => {
                log('warning', '网络请求失败，使用缓存回退', { url: request.url });
                return caches.match(basePath + 'index.html');
            })
    );
});

self.addEventListener('activate', event => {
    log('info', '激活新版本', { version: CACHE_NAME });
    event.waitUntil(
        self.clients.claim().then(function() {
            log('info', '已接管所有客户端');
            return caches.keys().then(cacheNames => {
                const deletePromises = cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => {
                        log('info', '删除旧缓存', { cacheName: cacheName });
                        return caches.delete(cacheName);
                    });
                return Promise.all(deletePromises);
            });
        }).then(function() {
            log('info', '版本更新完成，发送 VERSION_UPDATED');
            return self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    try {
                        client.postMessage({
                            type: 'VERSION_UPDATED',
                            version: CACHE_NAME,
                            logs: UPDATE_LOGS
                        });
                    } catch(e) {
                        log('error', '发送消息失败', { error: e.message });
                    }
                });
            });
        })
        .catch(err => {
            log('error', '激活失败', { error: err.message });
        })
    );
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        log('info', '跳过等待，立即激活');
        event.waitUntil(self.skipWaiting());
    }
    if (event.data && event.data.type === 'ACTIVATE_UPDATE') {
        log('info', '用户确认更新，立即激活新版本');
        event.waitUntil(self.skipWaiting().then(function() {
            log('info', 'skipWaiting 完成，正在激活...');
        }));
    }
    if (event.data && event.data.type === 'GET_VERSION') {
        log('debug', 'GET_VERSION 请求', { client: event.source?.id });
        event.source.postMessage({
            type: 'VERSION_RESPONSE',
            version: CACHE_NAME,
            logs: UPDATE_LOGS
        });
    }
    if (event.data && event.data.type === 'GET_SW_LOGS') {
        log('debug', 'GET_SW_LOGS 请求', { client: event.source?.id });
        getAllLogs().then(function(logs) {
            event.source.postMessage({
                type: 'SW_LOGS_RESPONSE',
                logs: logs
            });
        }).catch(function(err) {
            log('error', '获取日志失败', { error: err.message });
            event.source.postMessage({
                type: 'SW_LOGS_RESPONSE',
                error: err.message,
                logs: []
            });
        });
    }
    if (event.data && event.data.type === 'CLEAR_SW_LOGS') {
        log('info', '清除SW日志');
        clearLogs().then(function() {
            event.source.postMessage({
                type: 'SW_LOGS_CLEARED'
            });
        }).catch(function(err) {
            log('error', '清除日志失败', { error: err.message });
            event.source.postMessage({
                type: 'SW_LOGS_CLEARED',
                error: err.message
            });
        });
    }
    if (event.data && event.data.type === 'SW_LOG_LEVEL') {
        log('info', '日志级别设置', { level: event.data.level });
    }
});

log('info', 'Service Worker 初始化完成', { version: CACHE_NAME });