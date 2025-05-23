// Cache names
const CACHE_NAME = 'taskbuddy-cache-v1';
const RUNTIME_CACHE = 'taskbuddy-runtime-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.ico',
  
  // iOS icons
  '/ios/100.png',
  '/ios/152.png',
  '/ios/167.png',
  '/ios/180.png',
  '/ios/192.png',
  '/ios/512.png',
  '/ios/1024.png',
  
  // Android icons
  '/android/Square44x44Logo.altform-unplated_targetsize-192.png',
  '/android/Square44x44Logo.altform-unplated_targetsize-512.png',
  '/android/Square44x44Logo.altform-lightunplated_targetsize-192.png',
  
  // Windows 11 icons
  '/windows11/SplashScreen.scale-100.png',
  '/windows11/SplashScreen.scale-125.png',
  '/windows11/SplashScreen.scale-150.png',
  '/windows11/SplashScreen.scale-200.png',
  '/windows11/SplashScreen.scale-400.png',
  '/windows11/LargeTile.scale-100.png',
  '/windows11/LargeTile.scale-125.png',
  '/windows11/LargeTile.scale-150.png',
  '/windows11/SmallTile.scale-100.png',
  '/windows11/SmallTile.scale-125.png',
  '/windows11/SmallTile.scale-150.png'
];

// Install event - precache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests and browser extension/chrome-extension requests
  if (
    event.request.method !== 'GET' ||
    event.request.url.startsWith('chrome-extension') ||
    event.request.url.includes('extension') ||
    // Skip cross-origin requests like Google Calendar API
    (new URL(event.request.url).origin !== self.location.origin && 
     event.request.url.includes('googleapis.com'))
  ) {
    return;
  }

  // For HTML pages, use a network-first strategy
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // For all other assets, use a cache-first strategy
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return caches.open(RUNTIME_CACHE).then(cache => {
        return fetch(event.request).then(response => {
          // Put a copy of the response in the runtime cache
          return cache.put(event.request, response.clone()).then(() => {
            return response;
          });
        });
      });
    }).catch(() => {
      // Fallback for offline
      if (event.request.url.includes('.png') || event.request.url.includes('.jpg')) {
        return caches.match('/ios/180.png');
      }
      return new Response('You are offline and the resource is not cached.');
    })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/ios/180.png',
    badge: '/ios/100.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.actionUrl || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});