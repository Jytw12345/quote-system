// 缓存版本号（每次上传前修改此版本号，或使用日期格式如：quote-app-20240612）
const CACHE_NAME = '更新日期：20260620 V3.4.103';

// 更新日志（每次发布新版本时更新）
const UPDATE_LOGS = [
    '📌 优化自动更新：检测到新版本显示桌面通知，停留2秒后自动更新',
    '📌 提醒更新模式：显示更新日志，支持稍后更新和立即更新',
    '📌 手动检查更新：有新版本时显示立即更新按钮',
    '📌 相册管理现在显示所有IDB中的照片（包括产品库上传的）',
    '📌 优化云同步：只同步图片ID，不同步图片数据'
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
                console.log('[SW] ✅ 安装完成，等待激活');
            })
    );
    self.skipWaiting();
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
    if (event.data && event.data.type === 'GET_VERSION') {
        event.source.postMessage({
            type: 'VERSION_RESPONSE',
            version: CACHE_NAME,
            logs: UPDATE_LOGS
        });
    }
});