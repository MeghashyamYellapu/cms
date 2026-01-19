import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, Upload, RefreshCw } from 'lucide-react';
import { getOfflineQueueCount, triggerBackgroundSync } from '../utils/pwa';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [pendingCustomers, setPendingCustomers] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  // Check offline queue counts
  const checkPendingItems = async () => {
    try {
      const payments = await getOfflineQueueCount('offline-payments');
      const customers = await getOfflineQueueCount('offline-customers');
      setPendingPayments(payments);
      setPendingCustomers(customers);
    } catch (error) {
      console.log('Error checking offline queue:', error);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      // Auto-sync when back online
      if (pendingPayments > 0 || pendingCustomers > 0) {
        handleSync();
      }
      // Hide reconnected message after 3 seconds
      setTimeout(() => setShowReconnected(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending items periodically
    checkPendingItems();
    const interval = setInterval(checkPendingItems, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [pendingPayments, pendingCustomers]);

  // Manual sync trigger
  const handleSync = async () => {
    if (!isOnline || syncing) return;
    
    setSyncing(true);
    try {
      if (pendingPayments > 0) {
        await triggerBackgroundSync('sync-payments');
      }
      if (pendingCustomers > 0) {
        await triggerBackgroundSync('sync-customers');
      }
      // Refresh counts after brief delay
      setTimeout(checkPendingItems, 2000);
    } catch (error) {
      console.log('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const totalPending = pendingPayments + pendingCustomers;

  // Show reconnected indicator
  if (isOnline && showReconnected) {
    return (
      <div className="bg-green-600 text-white px-4 py-2 flex items-center justify-center gap-2 fixed bottom-0 w-full z-50 animate-pulse">
        <Wifi size={16} />
        <span className="text-sm font-medium">You're back online!</span>
      </div>
    );
  }

  // Show pending sync indicator (online but has queued items)
  if (isOnline && totalPending > 0) {
    return (
      <div className="bg-amber-500 text-white px-4 py-3 flex items-center justify-between fixed bottom-0 w-full z-50">
        <div className="flex items-center gap-2">
          <Upload size={16} />
          <span className="text-sm font-medium">
            {totalPending} item{totalPending > 1 ? 's' : ''} pending sync
            {pendingPayments > 0 && ` (${pendingPayments} payment${pendingPayments > 1 ? 's' : ''})`}
            {pendingCustomers > 0 && ` (${pendingCustomers} customer${pendingCustomers > 1 ? 's' : ''})`}
          </span>
        </div>
        <button 
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
    );
  }

  // Show offline indicator
  if (!isOnline) {
    return (
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between fixed bottom-0 w-full z-50">
        <div className="flex items-center gap-2">
          <WifiOff size={16} className="text-red-400" />
          <span className="text-sm font-medium">
            You are offline
            {totalPending > 0 && (
              <span className="text-amber-400 ml-2">
                • {totalPending} item{totalPending > 1 ? 's' : ''} queued for sync
              </span>
            )}
          </span>
        </div>
        <span className="text-xs text-gray-400">Data will sync automatically when reconnected</span>
      </div>
    );
  }

  return null;
};

export default OfflineIndicator;
