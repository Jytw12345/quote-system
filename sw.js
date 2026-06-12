const CACHE_NAME = 'quote-app-v1';
const CACHE_VERSION = '1.0.0';

const selfOrigin = self.location.origin;
const basePath = '/quote-system/';

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll([
                    basePath,
                    basePath + 'index.html',
                    basePath + 'manifest.json',
                    basePath + 'sw.js'
                ]);
            })
    );
    self.skipWaiting();
});

self.addEventListener('fetch', event => {
    const request = event.request;
    
    if (request.url.includes('index.html')) {
        event.respondWith(
            fetch(request).then(fetchResponse => {
                if (fetchResponse && fetchResponse.status === 200) {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, fetchResponse.clone());
                    });
                }
                return fetchResponse || caches.match(request);
            }).catch(() => {
                return caches.match(request);
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
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'CHECK_FOR_UPDATE') {
        checkForUpdate();
    }
});

async function checkForUpdate() {
    try {
        const registration = await self.registration;
        if (!registration) return;
        
        const manifestResponse = await fetch(basePath + 'manifest.json', { cache: 'no-cache' });
        if (manifestResponse.ok) {
            const manifest = await manifestResponse.json();
            const newVersion = manifest.version || '1.0.0';
            
            if (newVersion !== CACHE_VERSION) {
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'UPDATE_AVAILABLE',
                            version: newVersion
                        });
                    });
                });
            }
        }
    } catch (err) {
        console.error('SW update check error:', err);
    }
}