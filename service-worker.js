// DigitalForge Pro - Service Worker
// Version 3.1.0

const CACHE_NAME = 'digitalforge-pro-v3.2.0';
const CACHE_VERSION = '3.2.0';

// Archivos principales que siempre deben estar en caché
const CORE_CACHE = [
  '/',
  '/index.html',
  '/assets/styles/main.css',
  '/js/core/app.js',
  '/js/core/config.js',
  '/js/core/utils.js',
  '/js/features/calculators.js',
  '/js/features/tools.js',
  '/js/features/circuit-designer.js',
  '/js/ai/generator.js',
  '/js/ai/assistant.js',
  '/js/cloud/puter-service.js',
  '/pages/formulas-list.html',
  '/pages/hardware.html',
  '/pages/advanced.html'
];

// Recursos externos con estrategia de respaldo
const EXTERNAL_CACHE = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://js.puter.com/v2/'
];

const urlsToCache = [...CORE_CACHE, ...EXTERNAL_CACHE];

// Evento de instalación - cachear recursos
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Installing v' + CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Caching core files');
        // Cachear archivos principales primero (crítico)
        return cache.addAll(CORE_CACHE)
          .then(() => {
            console.log('📦 Service Worker: Caching external resources');
            // Cachear recursos externos (no crítico, puede fallar)
            return Promise.allSettled(
              EXTERNAL_CACHE.map(url => 
                cache.add(url).catch(err => {
                  console.warn('⚠️ Failed to cache:', url, err);
                  return null;
                })
              )
            );
          });
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker: Installation failed', error);
        throw error;
      })
  );
});

// Evento de activación - limpiar cachés antiguos
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Evento de fetch - Network first for HTML, Cache first for assets
self.addEventListener('fetch', event => {
  // Saltar peticiones que no sean GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Saltar chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);
  
  // Estrategia network-first for HTML documents
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cachear la nueva versión
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Respaldo al caché if network fails
          return caches.match(event.request)
            .then(response => response || caches.match('/index.html'));
        })
    );
    return;
  }

  // Estrategia cache-first for assets (CSS, JS, images, fonts)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('📋 Cache hit:', url.pathname);
          // Actualizar caché en segundo plano
          fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => {});
          return response;
        }

        // No está en caché, obtener de la red
        console.log('🌐 Network fetch:', url.pathname);
        return fetch(event.request).then(response => {
          // Cachear respuestas válidas
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        });
      })
      .catch(error => {
        console.error('❌ Fetch failed:', error);
        
        // Retornar respaldo offline for navigation
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
        
        throw error;
      })
  );
});

// Sincronización en segundo plano for saving data when online
self.addEventListener('sync', event => {
  console.log('🔄 Service Worker: Background sync', event.tag);
  
  if (event.tag === 'save-hdl-code') {
    event.waitUntil(
      // Handle background sync for saving HDL code
      handleBackgroundSync()
    );
  }
});

// Notificaciones push (para uso futuro)
self.addEventListener('push', event => {
  console.log('📢 Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva actualización disponible',
    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y=".9em" font-size="90"%3E🔬%3C/text%3E%3C/svg%3E',
    badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y=".9em" font-size="90"%3E🔬%3C/text%3E%3C/svg%3E',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir App',
        icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y=".9em" font-size="90"%3E🚀%3C/text%3E%3C/svg%3E'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y=".9em" font-size="90"%3E❌%3C/text%3E%3C/svg%3E'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Digital Logic Studio Pro', options)
  );
});

// Manejador de click en notificación
self.addEventListener('notificationclick', event => {
  console.log('🔔 Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Manejador de mensajes para comunicación con el hilo principal
self.addEventListener('message', event => {
  console.log('💬 Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Función auxiliar for background sync
async function handleBackgroundSync() {
  try {
    // Obtener datos pendientes from IndexedDB or localStorage
    const pendingData = await getPendingData();
    
    if (pendingData && pendingData.length > 0) {
      // Procesar cada elemento pendiente
      for (const item of pendingData) {
        await processPendingItem(item);
      }
      
      // Limpiar datos pendientes after successful sync
      await clearPendingData();
      
      console.log('✅ Service Worker: Background sync completed');
    }
  } catch (error) {
    console.error('❌ Service Worker: Background sync failed', error);
    throw error;
  }
}

// Función auxiliars para gestión de datos
async function getPendingData() {
  // La implementación dependería on your storage strategy
  return [];
}

async function processPendingItem(item) {
  // Procesar elemento de sincronización individual
  console.log('Processing sync item:', item);
}

async function clearPendingData() {
  // Limpiar datos de sincronización procesados
  console.log('Clearing pending sync data');
}

// Manejador de errores
self.addEventListener('error', event => {
  console.error('❌ Service Worker: Error occurred', event.error);
});

// Manejador de rechazos no manejados
self.addEventListener('unhandledrejection', event => {
  console.error('❌ Service Worker: Unhandled promise rejection', event.reason);
  event.preventDefault();
});

console.log('🚀 DigitalForge Pro Service Worker v' + CACHE_VERSION + ' loaded');