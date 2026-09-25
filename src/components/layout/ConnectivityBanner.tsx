import { useConnectivity } from '../../context/connectivity-context';
import { Icon } from '../ui/Icon';

export function ConnectivityBanner() {
  const { status } = useConnectivity();
  if (status === 'online') return null;

  const reconnecting = status === 'reconnecting';
  return (
    <div role="status" aria-live="polite" className="finexy-safe-inline flex min-w-0 items-start gap-2 border-b border-warning/30 bg-warning/10 py-2.5 text-primary">
      <Icon name={reconnecting ? 'arrow-repeat' : 'wifi-off'} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs font-semibold">{reconnecting ? 'Reconnecting…' : "You're offline"}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-secondary">
          {reconnecting ? 'Checking your connection before refreshing your data.' : 'Some actions are unavailable until your connection returns.'}
        </p>
      </div>
    </div>
  );
}
