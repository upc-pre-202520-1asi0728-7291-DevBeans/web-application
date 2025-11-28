// public/service-worker.js

const CACHE_NAME = 'beandetect-v2';
const STATIC_CACHE = [
    '/',
    '/dashboard/producer',
    '/dashboard/producer/batches',
    '/dashboard/producer/reports',
    '/dashboard/producer/settings',
];

const API_BASE = 'https://bean-detect-ai-api-platform.azurewebsites.net';

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static resources');
                return cache.addAll(STATIC_CACHE);
            })
            .catch((error) => {
                console.error('[SW] Cache installation failed:', error);
            })
    );
    self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Estrategia de fetch mejorada
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Solo cachear requests GET
    if (request.method !== 'GET') {
        // Para POST, PUT, DELETE: intentar network, si falla devolver error offline
        if (url.origin === API_BASE) {
            event.respondWith(
                fetch(request)
                    .catch(() => {
                        console.log('[SW] API offline, operación guardada para sincronización');
                        return new Response(
                            JSON.stringify({
                                offline: true,
                                message: 'Operación guardada localmente. Se sincronizará cuando recuperes la conexión.'
                            }),
                            {
                                status: 503,
                                statusText: 'Service Unavailable',
                                headers: { 'Content-Type': 'application/json' }
                            }
                        );
                    })
            );
        }
        return;
    }

    // Ignorar requests de chrome-extension y otros protocolos
    if (!request.url.startsWith('http')) {
        return;
    }

    // Para requests de API GET: Network First, fallback a Cache
    if (url.origin === API_BASE && request.method === 'GET') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clonar y cachear respuesta exitosa
                    if (response && response.ok) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseToCache);
                        }).catch(err => console.error('[SW] Cache put error:', err));
                    }
                    return response;
                })
                .catch(() => {
                    console.log('[SW] Network failed, trying cache for:', request.url);
                    // Si falla el fetch, intentar obtener desde cache
                    return caches.match(request).then((cachedResponse) => {
                        if (cachedResponse) {
                            console.log('[SW] Serving from cache:', request.url);
                            return cachedResponse;
                        }

                        // Si no está en cache, retornar respuesta offline
                        console.log('[SW] No cache available for:', request.url);
                        return new Response(
                            JSON.stringify({
                                offline: true,
                                message: 'No hay conexión y los datos no están en caché'
                            }),
                            {
                                status: 503,
                                statusText: 'Service Unavailable',
                                headers: { 'Content-Type': 'application/json' }
                            }
                        );
                    });
                })
        );
    } else if (url.origin !== API_BASE) {
        // Para otros recursos: Cache First, fallback a Network
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return fetch(request)
                        .then((response) => {
                            if (!response || response.status !== 200 || response.type === 'error') {
                                return response;
                            }

                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, responseToCache);
                            });

                            return response;
                        });
                })
        );
    }
});

// Background sync
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    if (event.tag === 'sync-pending-operations') {
        event.waitUntil(syncPendingOperations());
    }
});

async function syncPendingOperations() {
    console.log('[SW] Syncing pending operations...');
    try {
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({
                type: 'SYNC_PENDING_OPERATIONS'
            });
        });
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

// Mensajes del cliente
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('[SW] Service Worker loaded');