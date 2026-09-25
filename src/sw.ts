/// <reference lib="webworker" />

import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision?: string | null }>;
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')));

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('push', (event) => {
  const pushEvent = event as unknown as ExtendableEvent;
  pushEvent.waitUntil(self.registration.showNotification('Finexy', {
    body: 'You have a new Finexy notification.',
    icon: '/icons/finexy-192.svg',
    badge: '/icons/finexy-192.svg',
    data: { route: '/overview' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  const notificationEvent = event as unknown as ExtendableEvent & {
    notification: Notification;
  };
  notificationEvent.notification.close();
  notificationEvent.waitUntil((async () => {
    const targetUrl = new URL('/overview', self.location.origin).href;
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = clients.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.focus();
      if ('navigate' in existing) await existing.navigate(targetUrl);
      return;
    }
    await self.clients.openWindow(targetUrl);
  })());
});
