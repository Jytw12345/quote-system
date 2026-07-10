// 缓存版本号（每次上传前修改此版本号，或使用日期格式如：quote-app-20240612）
const CACHE_NAME = 'V3.4.151  更新日期：20260710';

// 更新日志（每次发布新版本时更新）
const UPDATE_LOGS = [
    'feat 新增 OneDrive 云同步功能，支持无文件大小限制的同步方式',
    'feat 云同步支持切换 Gist/OneDrive 两种同步方式',
    'fix 修复云同步Gist大小限制问题：模板图片改为存储在IndexedDB，同步时只传输imageId',
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
    'feat 模板库移除列表视图，统一使用卡片视图展示'
];
const basePath = self.location.pathname.replace(/sw\.js$/, '') || '/quote-system/';

self.addEventListener('install', event => {
    console.log('[SW] 开始安装新版本:', CACHE_NAME);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] 缓存资源中...');
                return cache.addAll([
                    basePath,
                    basePath + 'index.html',
                    basePath + 'manifest.json',
                    basePath + 'sw.js'
                ]);
            })
            .then(() => {
                console.log('[SW] 安装完成，等待用户确认后激活');
            })
    );
    // 不使用 skipWaiting，等待用户确认更新后再激活
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
                            return fetchResponse;
                        });
                    });
                }
                return fetchResponse;
            }).catch(() => {
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
                    return response;
                }
                return fetch(event.request).then(fetchResponse => {
                    if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                        return fetchResponse;
                    }
                    const responseToCache = fetchResponse.clone();
                    return caches.open(CACHE_NAME)
                        .then(cache => {
                            return cache.put(event.request, responseToCache).then(() => {
                                return fetchResponse;
                            });
                        });
                });
            })
            .catch(() => {
                return caches.match(basePath + 'index.html');
            })
    );
});

self.addEventListener('activate', event => {
    console.log('[SW] 激活新版本:', CACHE_NAME);
    event.waitUntil(
        // 第一步：让新 SW 立即接管所有 client
        self.clients.claim().then(function() {
            console.log('[SW] 已接管所有客户端');
            // 第二步：删除旧缓存
            return caches.keys().then(cacheNames => {
                const deletePromises = cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => {
                        console.log('[SW] 删除旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    });
                return Promise.all(deletePromises);
            });
        }).then(function() {
            // 第三步：向所有客户端发送版本更新通知
            console.log('[SW] 版本更新完成，发送 VERSION_UPDATED');
            return self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    try {
                        client.postMessage({
                            type: 'VERSION_UPDATED',
                            version: CACHE_NAME,
                            logs: UPDATE_LOGS
                        });
                    } catch(e) {
                        console.log('[SW] 发送消息失败:', e);
                    }
                });
            });
        })
    );
});

// 监听来自页面的消息
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] 跳过等待，立即激活');
        event.waitUntil(self.skipWaiting());
    }
    if (event.data && event.data.type === 'ACTIVATE_UPDATE') {
        console.log('[SW] 用户确认更新，立即激活新版本');
        event.waitUntil(self.skipWaiting().then(function() {
            console.log('[SW] skipWaiting 完成，正在激活...');
        }));
    }
    if (event.data && event.data.type === 'GET_VERSION') {
        console.log('[SW] GET_VERSION 返回:', CACHE_NAME);
        event.source.postMessage({
            type: 'VERSION_RESPONSE',
            version: CACHE_NAME,
            logs: UPDATE_LOGS
        });
    }
});