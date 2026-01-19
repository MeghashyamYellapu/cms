/* eslint-disable no-restricted-globals */

// Cable CMS - Enhanced Service Worker
// Supports: Offline caching, Background sync, Push notifications

const CACHE_NAME = 'cable-cms-v1';
const STATIC_CACHE = 'cable-cms-static-v1';
const API_CACHE = 'cable-cms-api-v1';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// API endpoints to cache for offline
const CACHEABLE_API_ROUTES = [
  '/api/customers',
  '/api/settings',
  '/api/auth/me'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch(err => {
          console.log('[SW] Some static assets failed to cache:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, update in background
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }

  // API requests - Network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets - Cache first, then network
  event.respondWith(cacheFirstStrategy(request));
});

// Cache first strategy (for static assets)
async function cacheFirstStrategy(request) {
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
    // Return offline page if available
    return caches.match('/index.html');
  }
}

// Network first strategy (for API calls)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful GET responses for offline
    if (networkResponse.ok && isCacheableAPI(request.url)) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(JSON.stringify({ 
      success: false, 
      offline: true,
      message: 'You are offline. Data will sync when connection is restored.' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Check if API route should be cached
function isCacheableAPI(url) {
  return CACHEABLE_API_ROUTES.some(route => url.includes(route));
}

// Background Sync - Queue offline payments
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-payments') {
    event.waitUntil(syncOfflinePayments());
  }
  
  if (event.tag === 'sync-customers') {
    event.waitUntil(syncOfflineCustomers());
  }
});

// Sync offline payments
async function syncOfflinePayments() {
  try {
    const db = await openOfflineDB();
    const payments = await getAllFromStore(db, 'offline-payments');
    
    for (const payment of payments) {
      try {
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${payment.token}`
          },
          body: JSON.stringify(payment.data)
        });
        
        if (response.ok) {
          await deleteFromStore(db, 'offline-payments', payment.id);
          console.log('[SW] Synced payment:', payment.id);
          
          // Notify user
          self.registration.showNotification('Payment Synced', {
            body: `Payment of ₹${payment.data.paidAmount} has been recorded.`,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-96x96.png',
            tag: 'payment-sync'
          });
        }
      } catch (err) {
        console.log('[SW] Failed to sync payment:', err);
      }
    }
  } catch (error) {
    console.log('[SW] Sync payments error:', error);
  }
}

// Sync offline customers
async function syncOfflineCustomers() {
  try {
    const db = await openOfflineDB();
    const customers = await getAllFromStore(db, 'offline-customers');
    
    for (const customer of customers) {
      try {
        const response = await fetch('/api/customers', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${customer.token}`
          },
          body: JSON.stringify(customer.data)
        });
        
        if (response.ok) {
          await deleteFromStore(db, 'offline-customers', customer.id);
          console.log('[SW] Synced customer:', customer.id);
        }
      } catch (err) {
        console.log('[SW] Failed to sync customer:', err);
      }
    }
  } catch (error) {
    console.log('[SW] Sync customers error:', error);
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = { title: 'Cable CMS', body: 'You have a new notification', tag: 'default' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    tag: data.tag || 'default',
    data: data.url || '/',
    actions: data.actions || [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    requireInteraction: data.requireInteraction || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const url = event.notification.data || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// IndexedDB helpers for offline storage
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CableCMSOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offline-payments')) {
        db.createObjectStore('offline-payments', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('offline-customers')) {
        db.createObjectStore('offline-customers', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('cached-data')) {
        db.createObjectStore('cached-data', { keyPath: 'key' });
      }
    };
  });
}

function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteFromStore(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

console.log('[SW] Service Worker loaded');
