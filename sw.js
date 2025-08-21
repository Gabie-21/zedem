// /sw.js

const CACHE_NAME = 'emergency-response-v1.0';
const URLS_TO_CACHE = [
  '/',               // ensure root shell works offline
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/css/style.css',
  '/js/main.js',
  '/js/firebase-config.js',

  // Icons used by notifications & manifest (cache what you actually use)
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/badge-72x72.png',
  '/icons/responder-icon.png',
  '/icons/cancelled-icon.png',
  '/icons/arrived-icon.png',
  '/icons/resolved-icon.png',
  '/icons/view-icon.png',
  '/icons/dismiss-icon.png',
  '/icons/alert-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
      .catch(err => console.error('SW install cache failed:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
      ),
      // Clean old notifications (best-effort)
      self.registration.getNotifications().then(notifs => {
        const now = Date.now();
        notifs.forEach(n => {
          if (n.timestamp && (now - n.timestamp > 24 * 60 * 60 * 1000)) n.close();
        });
      })
    ])
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Don’t cache Firebase/Google/API calls (network-first)
  const url = event.request.url;
  if (url.includes('firebase') || url.includes('googleapis') || url.includes('africastalking')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(
          JSON.stringify({ error: 'offline', message: 'This feature requires internet connection' }),
          { headers: { 'Content-Type': 'application/json' }, status: 503 }
        )
      )
    );
    return;
  }

  // Cache-first for local app shell
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        return cached;
      }
      return fetch(event.request)
        .then(response => {
          // Only cache basic same-origin OK responses
          if (!response || response.status !== 200 || response.type !== 'basic') return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
          return new Response('Offline', { status: 503 });
        });
    })
  );
});

// Push handler (single, dispatches by type)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();

  let title = data.title || 'Emergency Response';
  let options = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: data,
    vibrate: [200, 100, 200]
  };

  // typed notifications
  switch (data.type) {
    case 'emergency_assigned':
      title = '🚨 Emergency Response Assigned';
      options = {
        body: `Responder ${data.responderName} is heading to your emergency. ETA: ${data.eta} minutes.`,
        icon: '/icons/responder-icon.png',
        badge: '/icons/badge-72x72.png',
        data: { emergencyId: data.emergencyId, type: 'emergency_assigned' },
        actions: [{ action: 'track', title: 'Track Responder' }, { action: 'contact', title: 'Contact Responder' }],
        tag: 'emergency-' + data.emergencyId,
        requireInteraction: true,
        vibrate: [200, 100, 200]
      };
      break;
    case 'emergency_cancelled':
      title = '❌ Emergency Cancelled';
      options = {
        body: `Emergency ${data.emergencyId} has been cancelled.`,
        icon: '/icons/cancelled-icon.png',
        badge: '/icons/badge-72x72.png',
        data: { emergencyId: data.emergencyId, type: 'emergency_cancelled' },
        tag: 'emergency-' + data.emergencyId,
        vibrate: [100]
      };
      break;
    case 'responder_arrived':
      title = '✅ Help Has Arrived';
      options = {
        body: `${data.responderName} has arrived at your emergency location.`,
        icon: '/icons/arrived-icon.png',
        badge: '/icons/badge-72x72.png',
        data: { emergencyId: data.emergencyId, type: 'responder_arrived' },
        actions: [{ action: 'confirm', title: 'Confirm Arrival' }, { action: 'message', title: 'Send Message' }],
        tag: 'emergency-' + data.emergencyId,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200]
      };
      break;
    case 'emergency_resolved':
      title = '✅ Emergency Resolved';
      options = {
        body: `Your emergency has been successfully resolved. Thank you for using our service.`,
        icon: '/icons/resolved-icon.png',
        badge: '/icons/badge-72x72.png',
        data: { emergencyId: data.emergencyId, type: 'emergency_resolved' },
        actions: [{ action: 'feedback', title: 'Leave Feedback' }, { action: 'view', title: 'View Details' }],
        tag: 'emergency-' + data.emergencyId,
        vibrate: [200]
      };
      break;
    case 'system_alert':
      title = '📢 System Alert';
      options = {
        body: data.message || 'Important system notification',
        icon: '/icons/alert-icon.png',
        badge: '/icons/badge-72x72.png',
        data: { type: 'system_alert', alertId: data.alertId },
        tag: 'system-alert',
        vibrate: [100, 50, 100]
      };
      break;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click (single handler)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  let url = '/';

  switch (event.action) {
    case 'track':   url = `/?emergency=${data.emergencyId}&view=tracking`; break;
    case 'contact': url = `/?emergency=${data.emergencyId}&view=contact`;  break;
    case 'confirm': url = `/?emergency=${data.emergencyId}&action=confirm`;break;
    case 'message': url = `/?emergency=${data.emergencyId}&view=chat`;     break;
    case 'feedback':url = `/?emergency=${data.emergencyId}&view=feedback`; break;
    case 'view':    url = `/?emergency=${data.emergencyId}`;               break;
    case 'dismiss': return;
    default:
      if (data.emergencyId) url = `/?emergency=${data.emergencyId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          return client.navigate(url);
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Background sync (stub)
self.addEventListener('sync', (event) => {
  if (event.tag === 'emergency-sync') {
    event.waitUntil((async () => {
      console.log('SW: background sync placeholder');
    })());
  }
});

self.addEventListener('error', (e) => console.error('SW error', e));
self.addEventListener('unhandledrejection', (e) => console.error('SW unhandled rejection', e));

console.log('Service Worker loaded');
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});