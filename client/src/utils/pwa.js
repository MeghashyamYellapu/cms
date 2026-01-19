// Push Notification and Offline Queue Utilities

// Check if push notifications are supported
export const isPushSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!isPushSupported()) {
    console.log('Push notifications not supported');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Get current notification permission status
export const getNotificationPermission = () => {
  if (!isPushSupported()) return 'not-supported';
  return Notification.permission;
};

// Subscribe to push notifications
export const subscribeToPush = async (vapidPublicKey) => {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
    }
    
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return null;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return false;
  }
};

// Show local notification (without push server)
export const showLocalNotification = async (title, options = {}) => {
  if (!isPushSupported()) return false;
  
  if (Notification.permission !== 'granted') {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      vibrate: [100, 50, 100],
      ...options
    });
    
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
};

// Utility to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ============================================
// OFFLINE QUEUE UTILITIES
// ============================================

const DB_NAME = 'CableCMSOffline';
const DB_VERSION = 1;

// Open IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
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
};

// Add item to offline queue
export const addToOfflineQueue = async (storeName, data, token) => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.add({
        data,
        token,
        timestamp: new Date().toISOString()
      });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(`Added to ${storeName}:`, request.result);
        resolve(request.result);
      };
    });
  } catch (error) {
    console.error('Error adding to offline queue:', error);
    throw error;
  }
};

// Get all items from offline queue
export const getOfflineQueue = async (storeName) => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
};

// Get count of items in offline queue
export const getOfflineQueueCount = async (storeName) => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  } catch (error) {
    console.error('Error counting offline queue:', error);
    return 0;
  }
};

// Remove item from offline queue
export const removeFromOfflineQueue = async (storeName, id) => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Error removing from offline queue:', error);
    throw error;
  }
};

// Clear entire offline queue
export const clearOfflineQueue = async (storeName) => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Error clearing offline queue:', error);
    throw error;
  }
};

// Trigger background sync (if supported)
export const triggerBackgroundSync = async (tag) => {
  if (!('serviceWorker' in navigator) || !('sync' in window.SyncManager)) {
    console.log('Background sync not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(tag);
    console.log(`Background sync registered: ${tag}`);
    return true;
  } catch (error) {
    console.error('Error registering background sync:', error);
    return false;
  }
};

// Queue payment for offline sync
export const queueOfflinePayment = async (paymentData, token) => {
  try {
    const id = await addToOfflineQueue('offline-payments', paymentData, token);
    await triggerBackgroundSync('sync-payments');
    
    // Show notification
    await showLocalNotification('Payment Queued', {
      body: `Payment of ₹${paymentData.paidAmount} will be synced when online.`,
      tag: 'offline-payment'
    });
    
    return id;
  } catch (error) {
    console.error('Error queuing offline payment:', error);
    throw error;
  }
};

// Queue customer for offline sync
export const queueOfflineCustomer = async (customerData, token) => {
  try {
    const id = await addToOfflineQueue('offline-customers', customerData, token);
    await triggerBackgroundSync('sync-customers');
    
    await showLocalNotification('Customer Queued', {
      body: `Customer "${customerData.name}" will be synced when online.`,
      tag: 'offline-customer'
    });
    
    return id;
  } catch (error) {
    console.error('Error queuing offline customer:', error);
    throw error;
  }
};

// ============================================
// LOCAL DATA CACHING
// ============================================

// Cache data locally
export const cacheData = async (key, data) => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cached-data', 'readwrite');
      const store = transaction.objectStore('cached-data');
      
      const request = store.put({
        key,
        data,
        timestamp: new Date().toISOString()
      });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Error caching data:', error);
  }
};

// Get cached data
export const getCachedData = async (key) => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cached-data', 'readonly');
      const store = transaction.objectStore('cached-data');
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
    });
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
};

// Check if online
export const isOnline = () => navigator.onLine;

// Listen for online/offline events
export const addNetworkListener = (onOnline, onOffline) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};
