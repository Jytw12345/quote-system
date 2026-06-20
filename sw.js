// 缓存版本号（每次上传前修改此版本号，或使用日期格式如：quote-app-20240612）
const CACHE_NAME = 'V3.4.105  更新日期：20260620 ';

// 更新日志（每次发布新版本时更新）
const UPDATE_LOGS = [
    '📌 优化手机端产品编辑页面按量折扣界面显示',
    '🐛 修复提醒更新模式：选择"稍后更新"后SW不会自动激活',
    ' 优化自动更新：显示更新日志最多5条，完成后点击确认更新',
    '📌 提醒更新模式：显示更新日志，支持稍后更新和立即更新',
    '📌 手动检查更新：有新版本时显示立即更新按钮'
];const selfOrigin = self.location.origin;
const basePath = '/quote-system/';

self.addEventListener('install', event => {
    console.log('[SW] 📦 开始安装新版本:', CACHE_NAME);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] 📥 缓存资源中...');
                return cache.addAll([
                    basePath,
                    basePath + 'index.html',
                    basePath + 'manifest.json',
                    basePath + 'sw.js'
                ]);
            })
            .then(() => {
                console.log('[SW] ✅ 安装完成，等待用户确认后激活');
            })
    );
    // 不使用 skipWaiting，等待用户确认更新后再激活
});

self.addEventListener('fetch', event => {
    const request = event.request;
    
    // 对于 index.html，总是从网络获取最新版本
    if (request.url.includes('index.html')) {
        event.respondWith(
            fetch(request).then(fetchResponse => {
                // 先克隆响应，避免后续使用时出错
                const responseToCache = fetchResponse.clone();
                if (fetchResponse && fetchResponse.status === 200) {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });
                }
                return fetchResponse || caches.match(request);
            }).catch(() => {
                return caches.match(request);
            })
        );
        return;
    }
    
    // 其他资源：先缓存，后网络
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
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    return fetchResponse;
                });
            })
            .catch(() => {
                return caches.match(basePath + 'index.html');
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] 🗑️ 删除旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            ).then(() => {
                console.log('[SW] ✅ 版本更新完成，当前版本:', CACHE_NAME);
                // 通知所有客户端版本已更新
                return self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'VERSION_UPDATED',
                            version: CACHE_NAME,
                            logs: UPDATE_LOGS
                        });
                    });
                });
            });
        })
    );
    self.clients.claim();
});

// 监听来自页面的消息
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'ACTIVATE_UPDATE') {
        console.log('[SW] 🚀 用户确认更新，激活新版本');
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'GET_VERSION') {
        // 判断当前 SW 是否是活跃状态
        self.clients.get(event.source.id).then(function(client) {
            if (client) {
                // 检查当前 SW 是否是该客户端的控制器
                navigator.serviceWorker.getRegistration().then(function(reg) {
                    if (reg && reg.active === self) {
                        // 当前是活跃的 SW
                        event.source.postMessage({
                            type: 'VERSION_RESPONSE',
                            version: CACHE_NAME,
                            logs: UPDATE_LOGS
                        });
                    } else {
                        // 当前是等待中的 SW
                        event.source.postMessage({
                            type: 'PENDING_VERSION',
                            version: CACHE_NAME,
                            logs: UPDATE_LOGS
                        });
                    }
                });
            }
        });
    }
});