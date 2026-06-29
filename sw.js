// 缓存版本号（每次上传前修改此版本号，或使用日期格式如：quote-app-20240612）
const CACHE_NAME = 'V3.4.132  更新日期：20260624';

// 更新日志（每次发布新版本时更新）
const UPDATE_LOGS = [
    'bug 修复产品库编辑页面链接图片无法清除的问题',
    'bug 修复错误链接自动替换为当前页面URL的问题',
    'feat 样式切换后自动更新预览，无需手动点击',
    'feat 添加预览/关闭预览按钮切换功能',
    'feat 修复自定义主题色设置不生效的问题',
    'feat 修改系统设置中颜色设置描述，明确为现代风格颜色设置',
    'bug 修复首次预览时默认样式不一致的问题',
    'bug 修复多个 beforeunload/pagehide 监听器重复清理的问题',
    'opt 优化 ObjectURL 管理，添加数量限制和定期清理机制',
    'opt 统一调试模式日志输出方式',
    'bug 修复 manifest.json 版本号与 SW 不一致的问题',
    'bug 修复 sw.js fetch 事件缓存更新 Promise 未正确返回的问题',
    'bug 修复 sw.js 离线 fallback 逻辑不一致的问题',
    'bug 修复 sw.js 未处理非 GET 请求导致 POST 请求失败的问题',
    'bug 修复 index.html SW 注册路径硬编码导致部署兼容性问题',
    'bug 修复 index.html 消息监听器未验证消息来源的安全问题',
    'bug 修复 sw.js 非 GET 请求未使用 event.respondWith 的问题',
    'bug 修复 sw.js caches.match 返回 Promise 时误用 || 操作符的问题',
    'bug 修复 index.html 全局消息监听器未验证消息来源的问题',
    'bug 修复 safeDataOperation 无法捕获异步错误的问题',
    'bug 修复 IndexedDB save 方法批量保存未等待完成的问题',
    'feat 添加全局 unhandledrejection 和 error 事件监听',
    'bug 修复 sw.js basePath 硬编码导致部署兼容性问题',
    'bug 修复 sw.js skipWaiting 未使用 event.waitUntil 的问题',
    'bug 修复 IndexedDB 批量保存 transaction 可能提前关闭的问题',
    'bug 修复全局错误监听器 preventDefault 阻止正常错误上报的问题',
    'bug 修复云同步 gistUploadFull 中 isSyncing 状态管理问题',
    'bug 修复云同步增量上传时间比较逻辑错误的问题',
    'bug 修复云同步团队模式下数据过滤逻辑不一致的问题',
    'bug 修复云同步 API 请求缺少超时控制的问题',
    'bug 修复云同步时间比较未处理时区差异的问题',
    'bug 修复云同步 JSON 序列化使用 WeakSet 无法检测循环引用的问题'
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