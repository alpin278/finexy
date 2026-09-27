import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useEffect } from 'react';
import { getNativeAuthCallbackDestination } from '../../lib/auth-redirect';
import { router } from '../../router/AppRouter';

export function NativeAuthDeepLinkListener() {
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    let active = true;
    let initialUrl: string | undefined;
    let removeListener: (() => Promise<void>) | undefined;

    void (async () => {
      try {
        initialUrl = (await App.getLaunchUrl())?.url;
      } catch {
        initialUrl = undefined;
      }

      const listener = await App.addListener('appUrlOpen', ({ url }) => {
        if (url === initialUrl) {
          initialUrl = undefined;
          return;
        }

        void getNativeAuthCallbackDestination(url)
          .then((destination) => {
            if (active && destination) {
              void router.navigate(destination, { replace: true });
            }
          })
          .catch(() => undefined);
      });

      if (!active) {
        await listener.remove();
        return;
      }

      removeListener = () => listener.remove();
    })();

    return () => {
      active = false;
      void removeListener?.();
    };
  }, []);

  return null;
}
