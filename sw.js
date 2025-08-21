// sw.js - Service Worker for Zambia Emergency Response PWA (Single HTML File Version)

const CACHE_NAME = 'zambia-emergency-single-file-v1.0.0';
const STATIC_CACHE = 'static-single-file-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-single-file-v1.0.0';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // Essential icons
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/badge-72x72.png'
];

// External resources to cache
const EXTERNAL_RESOURCES = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Firebase URLs to handle differently
const FIREBASE_URLS = [
  'https://www.gstatic.com/firebasejs/',
  'https://firebase.googleapis.com/',
  'https://firestore.googleapis.com/',
  'https://identitytoolkit.googleapis.com/',
  'https://securetoken.googleapis.com/'
];

// Install event - cache essential resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE)
        .then(cache => {
          console.log('Service Worker: Caching static assets');
          return cache.addAll(STATIC_ASSETS);
        }),
      
      // Cache external resources
      caches.open(DYNAMIC_CACHE)
        .then(cache => {
          console.log('Service Worker: Caching external resources');
          return cache.addAll(EXTERNAL_RESOURCES.filter(url => url));
        })
    ])
    .then(() => {
      console.log('Service Worker: Installation complete');
      return self.skipWaiting(); // Activate immediately
    })
    .catch(error => {
      console.error('Service Worker: Installation failed', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Claiming clients');
        return self.clients.claim();
      })
      .catch(error => {
        console.error('Service Worker: Activation failed', error);
      })
  );
});

// Fetch event - network strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (isFirebaseRequest(url)) {
    // Network first for Firebase requests
    event.respondWith(handleFirebaseRequest(request));
  } else if (isStaticAsset(url)) {
    // Cache first for static assets
    event.respondWith(handleStaticAsset(request));
  } else if (isExternalResource(url)) {
    // Stale while revalidate for external resources
    event.respondWith(handleExternalResource(request));
  } else if (isNavigationRequest(request)) {
    // Network first with offline fallback for navigation
    event.respondWith(handleNavigationRequest(request));
  } else {
    // Default strategy - cache first with network fallback
    event.respondWith(handleDefaultRequest(request));
  }
});

// Strategy functions
async function handleFirebaseRequest(request) {
  try {
    // Always try network first for Firebase
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Firebase request failed, checking cache');
    
    // Try cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for Firebase failures
    return new Response(
      JSON.stringify({ 
        error: 'offline', 
        message: 'This feature requires internet connection',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 503
      }
    );
  }
}

async function handleStaticAsset(request) {
  // Cache first strategy
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Failed to fetch static asset', request.url);
    return new Response('Asset unavailable offline', { status: 404 });
  }
}

async function handleExternalResource(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    
    // Fetch from network
    const networkResponsePromise = fetch(request).then(response => {
      if (response.ok) {
        const cache = caches.open(DYNAMIC_CACHE);
        cache.then(c => c.put(request, response.clone()));
      }
      return response;
    });
    
    // Return cached version immediately if available, otherwise wait for network
    return cachedResponse || await networkResponsePromise;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Resource unavailable', { status: 404 });
  }
}

async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation requests
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Serve offline page for navigation failures
    const offlinePage = await caches.match('/offline.html');
    return offlinePage || new Response('Offline', { status: 503 });
  }
}

async function handleDefaultRequest(request) {
  // Cache first with network fallback
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Content unavailable offline', { status: 404 });
  }
}

// Helper functions
function isFirebaseRequest(url) {
  return FIREBASE_URLS.some(firebaseUrl => url.href.includes(firebaseUrl));
}

function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.pathname === asset) ||
         url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/);
}

function isExternalResource(url) {
  return url.origin !== self.location.origin;
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// Background sync for offline emergencies
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync event', event.tag);
  
  if (event.tag === 'emergency-sync') {
    event.waitUntil(syncOfflineEmergencies());
  } else if (event.tag === 'responder-location-sync') {
    event.waitUntil(syncResponderLocation());
  }
});

// Sync offline emergencies when back online
async function syncOfflineEmergencies() {
  try {
    console.log('Service Worker: Syncing offline emergencies');
    
    // Get offline emergencies from cache
    const cache = await caches.open('offline-emergencies');
    const keys = await cache.keys();
    const emergencies = [];
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const emergency = await response.json();
        emergencies.push(emergency);
      }
    }
    
    // Notify clients about the offline emergencies
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      client.postMessage({
        type: 'OFFLINE_EMERGENCIES_SYNC',
        emergencies: emergencies,
        timestamp: Date.now()
      });
    }
    
    console.log('Service Worker: Offline emergency sync completed', emergencies);
  } catch (error) {
    console.error('Service Worker: Emergency sync failed', error);
  }
}

// Sync responder location
async function syncResponderLocation() {
  try {
    console.log('Service Worker: Syncing responder location');
    
    // This would typically get location and update in Firebase
    // For now, we'll just notify clients
    const clients = await self.clients.matchAll();
    
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_RESPONDER_LOCATION',
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error('Service Worker: Responder location sync failed', error);
  }
}

// Push notification handling
self.addEventListener('push', event => {
  console.log('Service Worker: Push notification received');
  
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    event.waitUntil(handlePushNotification(data));
  } catch (error) {
    console.error('Service Worker: Failed to parse push data', error);
    // Try to show a basic notification
    event.waitUntil(
      self.registration.showNotification('Emergency Alert', {
        body: 'New emergency notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png'
      })
    );
  }
});

// Handle different types of push notifications
async function handlePushNotification(data) {
  const { type, title, body, icon, badge, actions, requireInteraction, vibrate } = data;
  
  const options = {
    body: body || 'Emergency notification',
    icon: icon || '/icons/icon-192x192.png',
    badge: badge || '/icons/badge-72x72.png',
    requireInteraction: requireInteraction || false,
    vibrate: vibrate || [200, 100, 200],
    data: data,
    tag: data.tag || 'emergency'
  };
  
  // Add actions based on notification type
  switch (type) {
    case 'emergency_assigned':
      options.actions = [
        { action: 'track', title: '📍 Track Responder' },
        { action: 'contact', title: '📞 Contact' },
        { action: 'dismiss', title: '✕ Dismiss' }
      ];
      options.requireInteraction = true;
      options.vibrate = [200, 100, 200, 100, 200];
      break;
      
    case 'responder_arrived':
      options.actions = [
        { action: 'confirm', title: '✓ Confirm Arrival' },
        { action: 'message', title: '💬 Message' }
      ];
      options.requireInteraction = true;
      options.vibrate = [300, 100, 300];
      break;
      
    case 'emergency_resolved':
      options.actions = [
        { action: 'feedback', title: '⭐ Rate Service' },
        { action: 'dismiss', title: '✓ OK' }
      ];
      break;
      
    case 'system_alert':
      options.actions = [
        { action: 'view', title: '👀 View Details' },
        { action: 'dismiss', title: '✕ Dismiss' }
      ];
      break;
      
    default:
      options.actions = [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
  }
  
  await self.registration.showNotification(title || 'Emergency Alert', options);
}

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  const action = event.action;
  
  // Handle different actions
  event.waitUntil(handleNotificationAction(action, data));
});

async function handleNotificationAction(action, data) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  
  let targetUrl = '/';
  
  // Determine target URL based on action
  switch (action) {
    case 'track':
      targetUrl = `/?emergency=${data.emergencyId}&view=tracking`;
      break;
    case 'contact':
      targetUrl = `/?emergency=${data.emergencyId}&view=contact`;
      break;
    case 'confirm':
      targetUrl = `/?emergency=${data.emergencyId}&action=confirm`;
      break;
    case 'message':
      targetUrl = `/?emergency=${data.emergencyId}&view=chat`;
      break;
    case 'feedback':
      targetUrl = `/?emergency=${data.emergencyId}&view=feedback`;
      break;
    case 'view':
      targetUrl = data.emergencyId ? `/?emergency=${data.emergencyId}` : '/';
      break;
    case 'dismiss':
      return; // Just close notification
    default:
      if (data.emergencyId) {
        targetUrl = `/?emergency=${data.emergencyId}`;
      }
  }
  
  // Try to focus existing window or open new one
  const existingClient = clients.find(client => client.url.includes(self.location.origin));
  
  if (existingClient) {
    await existingClient.focus();
    existingClient.postMessage({
      type: 'NOTIFICATION_ACTION',
      action: action,
      data: data,
      targetUrl: targetUrl
    });
  } else {
    await self.clients.openWindow(targetUrl);
  }
}

// Handle messages from main thread
self.addEventListener('message', event => {
  console.log('Service Worker: Message received', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_EMERGENCY':
      handleCacheEmergency(data, event.ports && event.ports[0]);
      break;
      
    case 'REGISTER_SYNC':
      if ('sync' in self.registration) {
        self.registration.sync.register(data.tag);
      }
      break;
      
    case 'REQUEST_CACHE_UPDATE':
      updateCache();
      break;
  }
});

// Cache emergency for offline sync
async function handleCacheEmergency(emergency, port) {
  try {
    // Store emergency data in cache for later sync
    const cache = await caches.open('offline-emergencies');
    const emergencyData = new Response(JSON.stringify(emergency));
    await cache.put(`emergency-${emergency.id}`, emergencyData);
    
    // Register for background sync
    if ('sync' in self.registration) {
      await self.registration.sync.register('emergency-sync');
    }
    
    if (port) {
      port.postMessage({
        success: true,
        message: 'Emergency cached for offline sync'
      });
    }
  } catch (error) {
    console.error('Service Worker: Failed to cache emergency', error);
    if (port) {
      port.postMessage({
        success: false,
        error: error.message
      });
    }
  }
}

// Update cache with new content
async function updateCache() {
  try {
    console.log('Service Worker: Updating cache');
    
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll(STATIC_ASSETS);
    
    console.log('Service Worker: Cache updated successfully');
  } catch (error) {
    console.error('Service Worker: Cache update failed', error);
  }
}

// Periodic cleanup of old cached data
async function cleanupOldCache() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.startsWith('zambia-emergency-') && name !== CACHE_NAME &&
    name !== STATIC_CACHE && name !== DYNAMIC_CACHE
  );
  
  await Promise.all(oldCaches.map(name => caches.delete(name)));
  console.log('Service Worker: Cleaned up old caches:', oldCaches);
}

// Cleanup old notifications
async function cleanupOldNotifications() {
  const notifications = await self.registration.getNotifications();
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  notifications.forEach(notification => {
    if (now - notification.timestamp > maxAge) {
      notification.close();
    }
  });
}

// Periodic maintenance
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    cleanupOldCache(),
    cleanupOldNotifications()
  ]));
});

// Error handling
self.addEventListener('error', event => {
  console.error('Service Worker: Global error', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker: Unhandled promise rejection', event.reason);
});

console.log('Service Worker: Zambia Emergency Response SW loaded and ready');

// Export functions for testing (if in development)
if (self.location.hostname === 'localhost') {
  self.swTestAPI = {
    handleFirebaseRequest,
    handleStaticAsset,
    handleNotificationAction,
    syncOfflineEmergencies
  };
}