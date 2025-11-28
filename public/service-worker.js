// public/service-worker.js

const CACHE_NAME = 'beandetect-v1';
const STATIC_CACHE = [
    '/',
    '/dashboard/producer',
    '/dashboard/producer/batches',
    '/dashboard/producer/reports',
    '/dashboard/producer/settings',
];

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

// Estrategia de fetch: Network First, fallback a Cache
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Solo cachear requests GET
    if (request.method !== 'GET') {
        return;
    }

    // Ignorar requests de chrome-extension y otros protocolos
    if (!request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then((response) => {
                // Solo cachear respuestas exitosas
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }

                // Clonar la respuesta antes de guardarla en cache
                const responseToCache = response.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseToCache);
                });

                return response;
            })
            .catch(() => {
                // Si falla el fetch, intentar obtener desde cache
                return caches.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Si no está en cache, retornar una respuesta offline
                    return new Response(
                        JSON.stringify({
                            error: 'Offline',
                            message: 'No hay conexión a internet'
                        }),
                        {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'application/json',
                            }),
                        }
                    );
                });
            })
    );
});

// Listener para sincronización en background
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    if (event.tag === 'sync-pending-operations') {
        event.waitUntil(syncPendingOperations());
    }
});

async function syncPendingOperations() {
    console.log('[SW] Syncing pending operations...');
    try {
        // Esta función será llamada cuando se recupere la conexión
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

// Listener para mensajes del cliente
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('[SW] Service Worker loaded');