/**
 * Native Device & Web Push Notification Service
 * Supports Windows, macOS, Android (Chrome/Edge/Samsung) and iOS (PWA/Safari)
 */

import { api } from './api';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface NativeNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  silent?: boolean;
}

/** Check if Notification API is supported on the current device/browser. */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** Get the current notification permission state. */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

/** Helper: Convert base64 VAPID string to Uint8Array for PushManager */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

let swRegistrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

/** Register the service worker for background and mobile notifications */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((err) => {
        console.warn('Service worker registration failed:', err.message);
        return null;
      });
  }
  return swRegistrationPromise;
}

/** Play a subtle, high-quality audio chime using Web Audio API (zero external assets) */
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.24); // D6

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.1);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 450);
  } catch {}
}

/**
 * Request notification permission from user and subscribe device to Web Push.
 */
export async function enableDeviceNotifications(): Promise<{ ok: boolean; status: NotificationPermissionState; error?: string }> {
  if (!isNotificationSupported()) {
    return { ok: false, status: 'unsupported', error: 'Notifications are not supported in this browser' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { ok: false, status: permission as NotificationPermissionState };
    }

    // Try setting up Web Push subscription with server
    const reg = await getServiceWorkerRegistration();
    if (reg && 'pushManager' in reg) {
      try {
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          const res = await api.notifications.getVapidKey();
          const pubKey = (res as any)?.publicKey;
          if (pubKey) {
            const appServerKey = urlBase64ToUint8Array(pubKey) as unknown as BufferSource;
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: appServerKey,
            });
            await api.notifications.pushSubscribe(sub.toJSON());
          }
        } else {
          // Keep active subscription refreshed on backend
          await api.notifications.pushSubscribe(sub.toJSON()).catch(() => {});
        }
      } catch (pushErr: any) {
        console.warn('Web push subscription warning (local notification fallback available):', pushErr.message);
      }
    }

    localStorage.setItem('retentio_device_notifications', 'true');
    return { ok: true, status: 'granted' };
  } catch (err: any) {
    return { ok: false, status: getNotificationPermission(), error: err.message };
  }
}

/** Disable device notifications */
export async function disableDeviceNotifications(): Promise<void> {
  localStorage.setItem('retentio_device_notifications', 'false');
  try {
    const reg = await getServiceWorkerRegistration();
    if (reg && 'pushManager' in reg) {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.notifications.pushUnsubscribe(sub.endpoint).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      }
    }
  } catch {}
}

/**
 * Send a native notification that appears in the device's OS notification tray / lockscreen
 * (Windows Action Center, macOS Notification Center, Android Notification Shade, etc.)
 */
export async function sendNativeNotification(opts: NativeNotificationOptions): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const isEnabled = localStorage.getItem('retentio_device_notifications') !== 'false';
  if (!isEnabled) return false;

  const title = opts.title || 'Retentio Notification';
  const icon = opts.icon || '/retentio-icon.png';
  const badge = opts.badge || '/retentio-icon.png';
  const tag = opts.tag || `notif_${Date.now()}`;
  const targetUrl = opts.url || '/inbox';

  // Play audio chime if not silent
  if (!opts.silent) {
    playNotificationChime();
  }

  // Mobile Chrome requirement: Android throws "Illegal constructor" on new Notification()
  // Must use ServiceWorkerRegistration.showNotification()
  const reg = await getServiceWorkerRegistration();
  if (reg && reg.showNotification) {
    try {
      await reg.showNotification(title, {
        body: opts.body,
        icon,
        badge,
        tag,
        renotify: true,
        data: { url: targetUrl },
      } as any);
      return true;
    } catch (err) {
      console.warn('ServiceWorker showNotification failed, trying fallback:', err);
    }
  }

  // Desktop fallback: new Notification()
  try {
    const notif = new Notification(title, {
      body: opts.body,
      icon,
      badge,
      tag,
      data: { url: targetUrl },
    } as any);

    notif.onclick = () => {
      window.focus();
      if (targetUrl && targetUrl !== '/') {
        window.location.hash = targetUrl;
      }
      notif.close();
    };

    return true;
  } catch (err) {
    console.warn('Native notification failed:', err);
    return false;
  }
}

/** Dispatch a test notification right now */
export async function sendTestNotification(): Promise<boolean> {
  const perm = getNotificationPermission();
  if (perm !== 'granted') {
    const res = await enableDeviceNotifications();
    if (!res.ok) return false;
  }

  return sendNativeNotification({
    title: '🔔 Retentio Notification Test',
    body: 'Awesome! Your device is ready to receive instant alerts on mobile & desktop.',
    url: '/inbox',
  });
}
