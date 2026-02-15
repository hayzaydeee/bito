import { useState, useEffect, useCallback } from 'react';
import { pushAPI } from '../services/api';

/**
 * usePushNotifications — manages Web Push subscription lifecycle.
 *
 * Returns:
 *   permission  — "default" | "granted" | "denied"
 *   isSubscribed — boolean
 *   isLoading   — boolean
 *   supported   — boolean (browser supports push)
 *   subscribe   — fn() → subscribe & register with backend
 *   unsubscribe — fn() → unsubscribe & deregister
 *   sendTest    — fn() → send a test notification
 */
export default function usePushNotifications() {
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supported = 'serviceWorker' in navigator && 'PushManager' in window;

  // Check current state on mount
  useEffect(() => {
    if (!supported) {
      setIsLoading(false);
      return;
    }
    setPermission(Notification.permission);
    checkExistingSubscription();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkExistingSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = useCallback(async () => {
    if (!supported) throw new Error('Push notifications not supported');
    setIsLoading(true);
    try {
      // 1. Register service worker
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // 2. Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // 3. Get VAPID public key from backend
      const { publicKey } = await pushAPI.getVapidPublicKey();

      // 4. Subscribe to push
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // 5. Send subscription to backend
      await pushAPI.subscribe(sub.toJSON(), getBrowserLabel());

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('Push subscribe failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await pushAPI.unsubscribe(sub.endpoint);
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error('Push unsubscribe failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendTest = useCallback(async () => {
    return pushAPI.sendTest();
  }, []);

  return {
    permission,
    isSubscribed,
    isLoading,
    supported,
    subscribe,
    unsubscribe,
    sendTest,
  };
}

// ── Helpers ────────────────────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}

function getBrowserLabel() {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edge')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Browser';
}
