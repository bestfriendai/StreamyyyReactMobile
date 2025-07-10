// Service Worker for Streamyyy PWA
const CACHE_NAME = 'streamyyy-v1.0.0';
const RUNTIME_CACHE = 'streamyyy-runtime-v1.0.0';
const STATIC_CACHE = 'streamyyy-static-v1.0.0';

// Files to cache during install
const PRECACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/assets/images/icon-192x192.png',
  '/assets/images/icon-512x512.png',
  '/browse',
  '/layouts',
  '/settings',
  '/offline.html',
];

// Stream API endpoints to cache
const STREAM_API_CACHE = [
  'https://api.twitch.tv/helix/streams',
  'https://www.googleapis.com/youtube/v3/search',
  'https://kick.com/api/v2/channels',
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Precaching static assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker installation failed:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== RUNTIME_CACHE && 
              cacheName !== STATIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Skip requests to different origins (except API calls)
  if (url.origin !== location.origin && !isStreamingAPI(url)) {
    return;
  }
  
  event.respondWith(
    handleRequest(request)
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Handle different types of requests
    if (isStreamingAPI(url)) {
      return handleStreamingAPI(request);
    } else if (isStaticAsset(url)) {
      return handleStaticAsset(request);
    } else if (isAppShell(url)) {
      return handleAppShell(request);
    } else {
      return handleGenericRequest(request);
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return handleOffline(request);
  }
}

function isStreamingAPI(url) {
  return STREAM_API_CACHE.some(api => url.href.includes(api)) ||
         url.href.includes('api.twitch.tv') ||
         url.href.includes('youtube.com/api') ||
         url.href.includes('kick.com/api');
}

function isStaticAsset(url) {
  return url.pathname.includes('/static/') ||
         url.pathname.includes('/assets/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.svg');
}

function isAppShell(url) {
  return url.pathname === '/' ||
         url.pathname.startsWith('/browse') ||
         url.pathname.startsWith('/layouts') ||
         url.pathname.startsWith('/settings') ||
         url.pathname.startsWith('/stream');
}

// Handle streaming API requests with network-first strategy
async function handleStreamingAPI(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    // Try network first for fresh data
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If network fails, try cache
    const cachedResponse = await cache.match(request);
    return cachedResponse || createErrorResponse('Network error');
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    return cachedResponse || createErrorResponse('Offline - no cached data');
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch static asset:', error);
    return createErrorResponse('Asset not available offline');
  }
}

// Handle app shell with cache-first strategy
async function handleAppShell(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, try network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline page for app shell requests
    return handleOffline(request);
  }
}

// Handle generic requests with network-first strategy
async function handleGenericRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || handleOffline(request);
  }
}

// Handle offline scenarios
async function handleOffline(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Try to return offline page
  const offlinePage = await cache.match('/offline.html');
  if (offlinePage) {
    return offlinePage;
  }
  
  // Fallback to basic offline response
  return createErrorResponse('Offline - content not available');
}

function createErrorResponse(message) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Background sync for stream updates
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'stream-sync') {
    event.waitUntil(syncStreams());
  }
});

async function syncStreams() {
  try {
    console.log('Syncing streams in background...');
    
    // This would typically update cached stream data
    const cache = await caches.open(RUNTIME_CACHE);
    
    // Update stream data from APIs
    const streamAPIs = [
      'https://api.twitch.tv/helix/streams?first=20',
      // Add other API endpoints as needed
    ];
    
    const updatePromises = streamAPIs.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          cache.put(url, response.clone());
        }
      } catch (error) {
        console.error('Failed to sync:', url, error);
      }
    });
    
    await Promise.all(updatePromises);
    console.log('Stream sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/assets/images/icon-192x192.png',
    badge: '/assets/images/icon-96x96.png',
    image: data.image,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey,
      action: data.action,
    },
    actions: [
      {
        action: 'view',
        title: 'View Stream',
        icon: '/assets/images/action-view.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/assets/images/action-dismiss.png',
      },
    ],
    requireInteraction: true,
    silent: false,
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'view') {
    // Open the app to the relevant stream
    event.waitUntil(
      clients.openWindow(data.url || '/')
    );
  } else if (action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default click action
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for communication with app
self.addEventListener('message', (event) => {
  console.log('Service Worker message received:', event);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls;
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(urls);
      })
    );
  }
  
  if (event.data && event.data.type === 'REGISTER_SYNC') {
    // Register background sync
    self.registration.sync.register('stream-sync');
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic sync event:', event.tag);
  
  if (event.tag === 'stream-updates') {
    event.waitUntil(syncStreams());
  }
});

// Share target handling
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname === '/share' && event.request.method === 'GET') {
    event.respondWith(handleShareTarget(event.request));
  }
});

async function handleShareTarget(request) {
  const url = new URL(request.url);
  const sharedURL = url.searchParams.get('url');
  const title = url.searchParams.get('title');
  const text = url.searchParams.get('text');
  
  // Handle shared stream URLs
  if (sharedURL) {
    const streamingPlatforms = ['twitch.tv', 'youtube.com', 'kick.com'];
    const isStreamURL = streamingPlatforms.some(platform => 
      sharedURL.includes(platform)
    );
    
    if (isStreamURL) {
      // Redirect to app with stream URL
      return Response.redirect(`/?add=${encodeURIComponent(sharedURL)}`);
    }
  }
  
  // Default handling
  return Response.redirect('/');
}

console.log('Streamyyy Service Worker loaded');