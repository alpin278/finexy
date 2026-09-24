import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import {
  appearanceOptions,
  dateFormatOptions,
  defaultSettingsState,
  numberFormatOptions,
  settingsCurrencyOptions,
  settingsRegionOptions,
} from '../data/settings';
import { Button, Card, LoadingState, Modal, Select, StatusBadge } from '../components/ui';
import { DataBackupPanel, PreferenceToggle, SettingsSection } from '../components/settings';
import type { AppearancePreference, SettingsCurrency, SettingsProfile, SettingsState } from '../types/settings';
import { cn } from '../lib/utils';
import { loadSettings, saveSettings, settingsErrorMessage } from '../lib/settings';
import {
  loadTelegramDiagnostics,
  sendTelegramTestNotification,
  disconnectTelegram,
  generateTelegramLinkCode,
  loadTelegramBudgetNotificationPreferences,
  loadTelegramConnection,
  saveTelegramBudgetNotificationPreferences,
  buildTelegramDeepLink,
  type TelegramBudgetNotificationPreferences,
  type TelegramConnection,
  type TelegramDiagnostics,
} from '../lib/telegram';
import { useDataInvalidation } from '../context/DataRevalidationContext';
import { loadFxCacheStatus, refreshFxRates } from '../lib/fx';
import { useTheme } from '../context/useTheme';

const appearanceIcons: Record<AppearancePreference, string> = {
  light: 'sun',
  dark: 'moon',
  system: 'display',
};

const currencySymbols: Record<SettingsCurrency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  IDR: 'Rp',
};

const fieldLabelClass = 'mb-1.5 block text-xs font-semibold text-primary';
const fieldClass = 'h-10 w-full rounded-[12px] bg-card';
const testNotificationCooldownMs = 5 * 60 * 1000;
const settingsSections = [
  ['regional', 'Regional & Currency'],
  ['appearance', 'Appearance'],
  ['preferences', 'Transaction Preferences'],
  ['notifications', 'Notifications'],
  ['data-backup', 'Data & Backup'],
  ['telegram', 'Telegram'],
  ['security', 'Security & Account'],
] as const;

function formatCooldownRemaining(cooldownEndsAt: number | null) {
  if (!cooldownEndsAt) return null;
  const remainingMs = cooldownEndsAt - Date.now();
  if (remainingMs <= 0) return null;
  const remainingMinutes = Math.ceil(remainingMs / 60_000);
  return `About ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'} remaining.`;
}

function createInitialSettings(): SettingsState {
  return {
    ...defaultSettingsState,
    profile: { ...defaultSettingsState.profile },
    notifications: defaultSettingsState.notifications.map((notification) => ({ ...notification })),
  };
}

export function SettingsPage() {
  const location = useLocation();
  const invalidate = useDataInvalidation();
  const { preference, setPreference } = useTheme();
  const [settings, setSettings] = useState<SettingsState>(createInitialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [telegram, setTelegram] = useState<TelegramConnection>({ status: 'not_connected' });
  const [telegramBusy, setTelegramBusy] = useState(false);
  const [telegramError, setTelegramError] = useState('');
  const [telegramDiagnostics, setTelegramDiagnostics] = useState<TelegramDiagnostics | null>(null);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramTestFeedback, setTelegramTestFeedback] = useState('');
  const [testNotificationCooldownEndsAt, setTestNotificationCooldownEndsAt] = useState<number | null>(null);
  const [telegramNotifications, setTelegramNotifications] = useState<TelegramBudgetNotificationPreferences>({ nearLimit: false, overLimit: false, dailySummary: false, weeklySummary: false });
  const [showTelegramDiagnostics, setShowTelegramDiagnostics] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [fxStatus, setFxStatus] = useState<{ provider: string; rateDate: string; fetchedAt: string } | null>(null);
  const [refreshingFx, setRefreshingFx] = useState(false);
  useEffect(() => {
    void Promise.all([loadSettings(), loadTelegramConnection()])
      .then(async ([loadedSettings, connection]) => {
        setSettings(loadedSettings);
        setTelegram(connection);
        setTelegramNotifications(await loadTelegramBudgetNotificationPreferences(connection.status === 'connected'));
        setTelegramDiagnostics(await loadTelegramDiagnostics());
      })
      .catch((reason) => setError(settingsErrorMessage(reason)))
      .finally(() => setLoading(false));
  }, []);

  const linkExpiresAt = telegram.status === 'link_code_ready' ? telegram.expiresAt : '';

  // Temporary lightweight polling while waiting for Telegram deep link / code consumption
  useEffect(() => {
    if (telegram.status !== 'link_code_ready') return undefined;

    const expiresAtMs = new Date(linkExpiresAt).getTime();
    if (Number.isFinite(expiresAtMs) && Date.now() >= expiresAtMs) {
      const timeoutId = window.setTimeout(() => {
        setTelegram({ status: 'not_connected' });
        setTelegramError('Link expired. Generate a new Telegram connection.');
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }

    const intervalId = window.setInterval(async () => {
      if (Number.isFinite(expiresAtMs) && Date.now() >= expiresAtMs) {
        window.clearInterval(intervalId);
        setTelegram({ status: 'not_connected' });
        setTelegramError('Link expired. Generate a new Telegram connection.');
        return;
      }

      try {
        const connection = await loadTelegramConnection();
        if (connection.status === 'connected') {
          window.clearInterval(intervalId);
          setTelegram(connection);
          setTelegramError('');
          setSaveMessage('Telegram successfully connected!');
          setTelegramNotifications(await loadTelegramBudgetNotificationPreferences(true));
          setTelegramDiagnostics(await loadTelegramDiagnostics());
        }
      } catch {
        // Silently swallow transient poll errors to avoid disrupting user experience
      }
    }, 2500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [telegram.status, linkExpiresAt]);

  useEffect(() => { void loadFxCacheStatus().then(setFxStatus).catch(() => setFxStatus(null)); }, []);
  const [activeModal, setActiveModal] = useState<'security' | null>(null);

  useEffect(() => {
    if (loading || !location.hash) return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading, location.hash]);

  const updateProfile = (field: keyof SettingsProfile, value: string) => {
    setSettings((current) => ({ ...current, profile: { ...current.profile, [field]: value } }));
    setSaveMessage('');
  };

  const updateNotification = (id: SettingsState['notifications'][number]['id'], enabled: boolean) => {
    setSettings((current) => ({ ...current, notifications: current.notifications.map((notification) => notification.id === id ? { ...notification, enabled } : notification) }));
    setSaveMessage('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaveMessage('');
    try {
      await saveSettings({ ...settings, appearance: preference });
      if (telegram.status === 'connected') await saveTelegramBudgetNotificationPreferences(telegramNotifications);
      await invalidate(['settings', 'overview', 'transactions', 'reports', 'wallets', 'budgets']);
      setSaveMessage('Settings saved.');
    } catch (reason) {
      setError(settingsErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  };
  const enabledInAppNotifications = settings.notifications.filter((notification) => notification.enabled).length;
  const enabledTelegramNotifications = Object.values(telegramNotifications).filter(Boolean).length;
  const handleConnectTelegram = async () => {
    setTelegramBusy(true);
    setError('');
    setSaveMessage('');
    setTelegramError('');
    try {
      const existing = await loadTelegramConnection();
      if (existing.status === 'connected') {
        setTelegram(existing);
        setTelegramNotifications(await loadTelegramBudgetNotificationPreferences(true));
        setTelegramDiagnostics(await loadTelegramDiagnostics());
        return;
      }
      const newConnection = await generateTelegramLinkCode();
      setTelegram(newConnection);
    } catch (reason) {
      const msg = reason instanceof Error ? reason.message : String(reason);
      if (msg.toLowerCase().includes('already linked')) {
        const current = await loadTelegramConnection().catch(() => ({ status: 'not_connected' as const }));
        setTelegram(current);
        if (current.status === 'connected') {
          setTelegramNotifications(await loadTelegramBudgetNotificationPreferences(true).catch(() => telegramNotifications));
        } else {
          setTelegramError('Telegram is already connected to an account.');
        }
      } else {
        setTelegramError('We could not generate a Telegram link code. Confirm that you are signed in and try again.');
      }
    } finally {
      setTelegramBusy(false);
    }
  };
  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setTelegramError('');
    setTelegramTestFeedback('');
    try {
      const result = await sendTelegramTestNotification();
      if (result === 'queued') {
        setTelegramTestFeedback('Test notification sent. Check Telegram.');
        setTestNotificationCooldownEndsAt(Date.now() + testNotificationCooldownMs);
      } else {
        setTelegramTestFeedback('Test notification was recently sent. Try again in a few minutes.');
      }
    } catch {
      setTelegramError('We could not queue a test notification.');
    } finally {
      try {
        setTelegramDiagnostics(await loadTelegramDiagnostics());
      } catch {
        // The request result remains accurate even if diagnostics cannot be refreshed.
      }
      setTestingTelegram(false);
    }
  };
  const handleDisconnectTelegram = async () => {
    setTelegramBusy(true); setError(''); setSaveMessage(''); setTelegramError('');
    try { await disconnectTelegram(); setTelegram({ status: 'not_connected' }); setTelegramNotifications({ nearLimit: false, overLimit: false, dailySummary: false, weeklySummary: false }); setSaveMessage('Telegram disconnected. Link codes and active Telegram sessions were invalidated.'); }
    catch (reason) { setError(settingsErrorMessage(reason)); }
    finally { setTelegramBusy(false); }
  };
  const handleRefreshFx = async () => { setRefreshingFx(true); setError(''); try { const result = await refreshFxRates(); setFxStatus({ provider: result.provider, rateDate: result.rate_date, fetchedAt: new Date().toISOString() }); await invalidate(['fx', 'wallets', 'overview']); setSaveMessage(result.status === 'current' ? 'FX reference rates are already current.' : 'FX reference rates refreshed.'); } catch { setError('FX rates could not be refreshed. Native balances remain unchanged.'); } finally { setRefreshingFx(false); } };

  if (loading) return <LoadingState label="Loading your saved preferences" />;
  return (
    <div className="space-y-6 pb-8 animate-in fade-in-50 duration-200">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">Personal workspace</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-[32px]">Settings &amp; Preferences</h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-secondary sm:text-sm">Control money formats, appearance, transaction defaults, alerts, integrations, and account tools.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status="in_progress" label="Supabase preferences" />
          <Button variant="primary" size="sm" loading={saving} leftIcon={<Icon name="save" />} onClick={handleSave}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-xs font-medium text-danger">{error}</div>}
      {saveMessage && <div role="status" className="flex items-start gap-2 rounded-2xl border border-success/25 bg-success/10 px-4 py-3 text-xs font-medium text-primary"><Icon name="check-lg" className="mt-0.5 shrink-0 text-success" /><span>{saveMessage}</span></div>}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_240px] xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-6">
          <SettingsSection id="regional" icon="currency-dollar" eyebrow="Regional defaults" title="Currency & Regional" description="Choose the formats that make your balances and transactions easiest to read.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="settings-currency" className={fieldLabelClass}>Default currency</label><Select id="settings-currency" value={settings.currency} onChange={(event) => { setSettings((current) => ({ ...current, currency: event.target.value as SettingsCurrency })); setSaveMessage(''); }} options={settingsCurrencyOptions} className={fieldClass} /><p className="mt-1.5 text-[11px] text-secondary">New values will display with {currencySymbols[settings.currency]} ({settings.currency}).</p></div>
              <div><label htmlFor="settings-region" className={fieldLabelClass}>Locale / region</label><Select id="settings-region" value={settings.region} onChange={(event) => { setSettings((current) => ({ ...current, region: event.target.value })); setSaveMessage(''); }} options={settingsRegionOptions} className={fieldClass} /></div>
              <div><label htmlFor="settings-date-format" className={fieldLabelClass}>Date format</label><Select id="settings-date-format" value={settings.dateFormat} onChange={(event) => { setSettings((current) => ({ ...current, dateFormat: event.target.value })); setSaveMessage(''); }} options={dateFormatOptions} className={fieldClass} /></div>
              <div><label htmlFor="settings-number-format" className={fieldLabelClass}>Number format</label><Select id="settings-number-format" value={settings.numberFormat} onChange={(event) => { setSettings((current) => ({ ...current, numberFormat: event.target.value })); setSaveMessage(''); }} options={numberFormatOptions} className={fieldClass} /></div>
              <div><label htmlFor="settings-timezone" className={fieldLabelClass}>Timezone</label><Select id="settings-timezone" value={settings.profile.timezone} onChange={(event) => updateProfile('timezone', event.target.value)} options={[{ value: 'Asia/Jakarta (GMT+7)', label: 'Asia/Jakarta (GMT+7)' }, { value: 'America/New_York (GMT-5)', label: 'America/New York (GMT-5)' }, { value: 'Europe/London (GMT+0)', label: 'Europe/London (GMT+0)' }]} className={fieldClass} /></div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3.5 py-3"><div><p className="text-xs font-semibold text-primary">FX reference rates</p><p className="mt-1 text-[11px] text-secondary">{fxStatus ? `${fxStatus.provider} · rate date ${fxStatus.rateDate}` : 'No cached rates yet. Native balances remain unchanged.'}</p></div><Button variant="outline" size="sm" loading={refreshingFx} onClick={() => void handleRefreshFx}>{refreshingFx ? 'Refreshing...' : 'Refresh rates'}</Button></div>
          </SettingsSection>

          <SettingsSection id="appearance" icon="palette" eyebrow="Visual comfort" title="Theme & Appearance" description="Choose how Finexy should feel. Switch between light, dark, or automatically sync with your system.">
            <div className="grid gap-3 sm:grid-cols-3">
              {appearanceOptions.map((option) => {
                const iconName = appearanceIcons[option.value];
                const selected = preference === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={(e) => {
                      setPreference(option.value, e);
                      setSaveMessage('');
                    }}
                    className={cn(
                      'rounded-2xl border p-4 text-left transition-[border-color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 cursor-pointer',
                      selected ? 'border-dark bg-surface ring-2 ring-accent/15' : 'border-border bg-card hover:border-secondary/40 hover:bg-surface'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', selected ? 'bg-dark text-white' : 'bg-surface text-secondary')}>
                        <Icon name={iconName} className="text-base" />
                      </span>
                      {selected && <Icon name="check-lg" className="text-accent" />}
                    </div>
                    <p className="mt-4 text-sm font-semibold text-primary">{option.label}</p>
                    <p className="mt-1 text-xs text-secondary">{option.description}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-surface px-3.5 py-3 text-xs text-secondary"><Icon name="laptop" className="mt-0.5 shrink-0" /><span>Appearance changes apply immediately and persist with your account settings.</span></div>
          </SettingsSection>

          <SettingsSection id="preferences" icon="receipt" eyebrow="Money habits" title="Transaction Preferences" description="Set a few defaults that keep everyday personal finance tracking quick and consistent.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="settings-transaction-type" className={fieldLabelClass}>Default transaction type</label><Select id="settings-transaction-type" value={settings.transactionType} onChange={(event) => { setSettings((current) => ({ ...current, transactionType: event.target.value as SettingsState['transactionType'] })); setSaveMessage(''); }} options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]} className={fieldClass} /><p className="mt-1.5 text-[11px] text-secondary">Used when starting a new manual transaction.</p></div>
              <div><label htmlFor="settings-entry-mode" className={fieldLabelClass}>Entry style</label><Select id="settings-entry-mode" value={settings.entryMode} onChange={(event) => { setSettings((current) => ({ ...current, entryMode: event.target.value as SettingsState['entryMode'] })); setSaveMessage(''); }} options={[{ value: 'quick', label: 'Quick entry' }, { value: 'detailed', label: 'Detailed entry' }]} className={fieldClass} /><p className="mt-1.5 text-[11px] text-secondary">Saved for future transaction form defaults.</p></div>
            </div>
            <div className="mt-5 divide-y divide-border border-t border-border pt-2"><PreferenceToggle id="settings-auto-categorize" title="Suggest categories" description="Use the existing local category list to suggest a category while entering a transaction." checked={settings.autoCategorize} onChange={(autoCategorize) => { setSettings((current) => ({ ...current, autoCategorize })); setSaveMessage(''); }} /><PreferenceToggle id="settings-merchant-suggestions" title="Remember merchant labels" description="Keep merchant names consistent in this session so spending is easier to scan." checked={settings.merchantSuggestions} onChange={(merchantSuggestions) => { setSettings((current) => ({ ...current, merchantSuggestions })); setSaveMessage(''); }} /><PreferenceToggle id="settings-confirm-delete" title="Confirm before deleting" description="Ask for a confirmation before removing a local transaction or budget." checked={settings.confirmBeforeDeleting} onChange={(confirmBeforeDeleting) => { setSettings((current) => ({ ...current, confirmBeforeDeleting })); setSaveMessage(''); }} /></div>
          </SettingsSection>

          <SettingsSection id="data-backup" icon="database" eyebrow="Account data" title="Data &amp; Backup" description="Export a portable copy of your Finexy data or safely restore a Finexy backup into this authenticated account.">
            <DataBackupPanel />
          </SettingsSection>

          <SettingsSection id="telegram" icon="wallet2" eyebrow="Connections" title="Telegram" description="Link Telegram to your signed-in Finexy account. This foundation does not expose financial data or accept financial commands.">
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary">
                  <i className="bi bi-telegram text-lg" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">Telegram</p>
                  <p className="mt-1 text-xs text-secondary">
                    {telegram.status === 'connected'
                      ? 'Your Telegram account is linked.'
                      : telegram.status === 'link_code_ready'
                        ? 'Complete connection in Telegram.'
                        : 'Link Telegram to your signed-in Finexy account.'}
                  </p>
                  <div className="mt-2">
                    <StatusBadge
                      status={telegram.status === 'connected' ? 'active' : telegram.status === 'link_code_ready' ? 'in_progress' : 'inactive'}
                      label={telegram.status === 'connected' ? 'Connected' : telegram.status === 'link_code_ready' ? 'Connecting...' : 'Not Connected'}
                    />
                  </div>
                </div>
              </div>
              {telegram.status === 'connected' ? (
                <Button variant="outline" size="sm" disabled={telegramBusy} onClick={handleDisconnectTelegram}>
                  Disconnect Telegram
                </Button>
              ) : (
                <Button variant="accent" size="sm" disabled={telegramBusy} onClick={handleConnectTelegram}>
                  {telegramBusy ? 'Connecting...' : 'Connect Telegram'}
                </Button>
              )}
            </div>

            {telegramError && <div role="alert" className="mt-4 rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-3 text-xs font-medium text-danger">{telegramError}</div>}

            {telegram.status === 'link_code_ready' && (() => {
              const deepLink = buildTelegramDeepLink(telegram.code);
              return (
                <div className="mt-4 rounded-xl border border-accent/20 bg-accent/5 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">Connect Telegram</p>
                      <h3 className="mt-0.5 text-base font-bold text-primary">Open Telegram to Finish Linking</h3>
                      <p className="mt-1 text-xs text-secondary">
                        Expires at {new Date(telegram.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                      </p>
                    </div>
                    {deepLink ? (
                      <a
                        href={deepLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        <i className="bi bi-telegram text-sm" aria-hidden="true" />
                        Open Telegram
                      </a>
                    ) : (
                      import.meta.env.DEV ? (
                        <p className="text-xs text-danger font-medium">
                          VITE_TELEGRAM_BOT_USERNAME is not configured.
                        </p>
                      ) : null
                    )}
                  </div>

                  <div className="mt-4 border-t border-border/80 pt-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-xs text-secondary">
                        Or send <span className="font-semibold text-primary font-mono">/link {telegram.code}</span> to the Finexy bot.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="rounded-lg bg-surface px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-primary border border-border">
                        {telegram.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void navigator.clipboard.writeText(telegram.code);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        aria-label="Copy link code"
                      >
                        <Icon name={copiedCode ? "check-lg" : "copy"} className={copiedCode ? "text-success" : ""} />
                        {copiedCode ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Telegram health</p><p className="mt-1 text-xs text-secondary">{telegramDiagnostics?.worker === 'healthy' ? 'Healthy' : telegram.status === 'connected' ? 'Needs attention' : 'Disconnected'}</p></div><div className="flex items-center gap-2">{telegram.status === 'connected' && <Button variant="outline" size="sm" disabled={testingTelegram} onClick={handleTestTelegram}>{testingTelegram ? 'Queueing...' : 'Send test notification'}</Button>}<button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-secondary transition-colors hover:bg-card hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30" aria-expanded={showTelegramDiagnostics} onClick={() => setShowTelegramDiagnostics((open) => !open)}><Icon name="info-circle" />Details<Icon name="chevron-down" className={showTelegramDiagnostics ? 'rotate-180 transition-transform' : 'transition-transform'} /></button></div></div>{telegramTestFeedback && <div role="status" className="mt-3 rounded-xl border border-success/25 bg-success/10 px-3.5 py-3 text-xs font-medium text-primary"><p>{telegramTestFeedback}</p>{telegramTestFeedback.startsWith('Test notification was recently sent') && formatCooldownRemaining(testNotificationCooldownEndsAt) && <p className="mt-1 text-secondary">{formatCooldownRemaining(testNotificationCooldownEndsAt)}</p>}</div>}{showTelegramDiagnostics && <div className="mt-3 border-t border-border pt-3"><div className="grid grid-cols-3 gap-2 text-center text-xs">{telegram.status === 'connected' && telegramDiagnostics ? <><div><p className="font-semibold text-primary">{telegramDiagnostics.pending}</p><p className="text-secondary">Pending</p></div><div><p className="font-semibold text-primary">{telegramDiagnostics.retryable}</p><p className="text-secondary">Retrying</p></div><div><p className="font-semibold text-primary">{telegramDiagnostics.failed}</p><p className="text-secondary">Failed</p></div></> : <p className="col-span-3 text-left text-xs text-secondary">Connect Telegram to view delivery diagnostics.</p>}</div><p className="mt-3 text-[11px] text-secondary">Last delivery: {telegramDiagnostics?.last_delivered_at ? new Date(telegramDiagnostics.last_delivered_at).toLocaleString() : 'None yet'}{telegramDiagnostics?.last_failed_at ? ` · Last failure: ${telegramDiagnostics.failure_class ?? 'Needs attention'}` : ''}</p></div>}</div>
            <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2"><i className="bi bi-bell text-sm text-primary" aria-hidden="true" /><p className="text-sm font-semibold text-primary">Telegram notifications</p></div>
              {telegram.status === 'connected' ? <div className="mt-3 divide-y divide-border">
                <PreferenceToggle id="telegram-budget-near-limit" title="Budget hampir mencapai batas" description="Kirim notifikasi saat budget mencapai 80%." checked={telegramNotifications.nearLimit} onChange={(nearLimit) => { setTelegramNotifications((current) => ({ ...current, nearLimit })); setSaveMessage(''); }} />
                <PreferenceToggle id="telegram-budget-over-limit" title="Budget melewati batas" description="Kirim notifikasi saat budget mencapai atau melebihi 100%." checked={telegramNotifications.overLimit} onChange={(overLimit) => { setTelegramNotifications((current) => ({ ...current, overLimit })); setSaveMessage(''); }} />
                <PreferenceToggle id="telegram-daily-summary" title="Ringkasan harian" description="Dikirim sekitar pukul 20.00 sesuai timezone Anda." checked={telegramNotifications.dailySummary} onChange={(dailySummary) => { setTelegramNotifications((current) => ({ ...current, dailySummary })); setSaveMessage(''); }} />
                <PreferenceToggle id="telegram-weekly-summary" title="Ringkasan mingguan" description="Dikirim hari Minggu sekitar pukul 20.00 sesuai timezone Anda." checked={telegramNotifications.weeklySummary} onChange={(weeklySummary) => { setTelegramNotifications((current) => ({ ...current, weeklySummary })); setSaveMessage(''); }} />
              </div> : <p className="mt-2 text-xs text-secondary">Hubungkan Telegram terlebih dahulu untuk mengatur notifikasi Telegram.</p>}
            </div>
          </SettingsSection>

          <SettingsSection id="security" icon="shield-check" eyebrow="Account safety" title="Security & 2FA" description="Review the future security surface without storing passwords, secrets, or real authentication state.">
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary"><Icon name="lock" className="text-lg" /></div><div><p className="text-sm font-semibold text-primary">Two-factor authentication</p><p className="mt-1 text-xs text-secondary">{settings.demoTwoFactorEnabled ? 'Demo preference enabled for this session' : 'Not configured in the frontend prototype'}</p><div className="mt-2"><StatusBadge status={settings.demoTwoFactorEnabled ? 'active' : 'inactive'} label={settings.demoTwoFactorEnabled ? 'Demo enabled' : 'Demo only'} /></div></div></div><Button variant="outline" size="sm" leftIcon={<Icon name="key" />} onClick={() => setActiveModal('security')}>Review 2FA</Button></div>
            <p className="mt-4 text-[11px] leading-relaxed text-secondary">Security controls will be connected only when authentication is introduced. This screen does not accept or retain passwords.</p>
          </SettingsSection>

          <SettingsSection id="notifications" icon="bell" eyebrow="Stay informed" title="In-app notifications" description="Saved preference controls for future in-app delivery. Telegram delivery is configured separately above.">
            <div className="divide-y divide-border">{settings.notifications.map((notification) => <PreferenceToggle key={notification.id} id={`settings-${notification.id}`} title={notification.title} description={notification.description} checked={notification.enabled} onChange={(enabled) => updateNotification(notification.id, enabled)} />)}</div>
            <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-[11px] text-secondary"><i className="bi bi-bell" aria-hidden="true" /><span>In-app: {enabledInAppNotifications} of {settings.notifications.length} enabled</span></div>
          </SettingsSection>
        </div>

        <aside className="self-start space-y-6">
          <Card padding="sm">
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-secondary"><Icon name="list-ul" /></div><div><h2 className="text-sm font-semibold text-primary">Settings sections</h2><p className="mt-0.5 text-[11px] text-secondary">Jump directly to a preference area</p></div></div>
            <nav className="mt-4 space-y-1" aria-label="Settings sections">
              {settingsSections.map(([id, label]) => <a key={id} href={`#${id}`} className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-secondary transition-colors hover:bg-surface hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"><span>{label}</span><Icon name="chevron-right" className="text-[10px]" /></a>)}
            </nav>
          </Card>
          <Card padding="lg" className="border-accent/15"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent"><Icon name="sliders" className="text-lg" /></div><div><h2 className="text-sm font-semibold text-primary">At a glance</h2><p className="mt-0.5 text-xs text-secondary">Current defaults from your settings</p></div></div><dl className="mt-5 space-y-4"><div className="flex items-center justify-between gap-4"><dt className="text-xs text-secondary">Currency</dt><dd className="text-xs font-semibold text-primary">{settings.currency} {currencySymbols[settings.currency]}</dd></div><div className="flex items-center justify-between gap-4"><dt className="text-xs text-secondary">Region</dt><dd className="max-w-[150px] truncate text-right text-xs font-semibold text-primary">{settings.region}</dd></div><div className="flex items-center justify-between gap-4"><dt className="text-xs text-secondary">Appearance</dt><dd className="text-xs font-semibold capitalize text-primary">{preference}</dd></div><div className="flex items-center justify-between gap-4"><dt className="text-xs text-secondary">In-app alerts</dt><dd className="text-xs font-semibold text-primary">{enabledInAppNotifications} enabled</dd></div><div className="flex items-center justify-between gap-4"><dt className="text-xs text-secondary">Telegram alerts</dt><dd className="text-xs font-semibold text-primary">{telegram.status === 'connected' ? `${enabledTelegramNotifications} enabled` : 'Not connected'}</dd></div></dl><p className="mt-5 border-t border-border pt-4 text-[11px] leading-relaxed text-secondary">Use the sections on the left to change these defaults.</p></Card>
          <Card padding="lg" className="border-dark bg-dark text-white"><div className="flex items-center gap-2 text-accent"><Icon name="file-earmark-text" className="text-sm" /><span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Persistence notes</span></div><p className="mt-3 text-sm font-semibold">What stays with your account</p><p className="mt-2 text-xs leading-relaxed text-white/65">Regional, transaction, and notification preferences are saved to your Finexy account. Identity details are managed on your Profile page.</p><div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs"><span className="text-white/60">Data &amp; Backup</span><span className="font-semibold text-white">Available</span></div><div className="mt-2 flex items-center justify-between gap-3 text-xs"><span className="text-white/60">2FA</span><span className="font-semibold text-white">Demo control</span></div></Card>
        </aside>
      </div>

      <Modal isOpen={activeModal === 'security'} onClose={() => setActiveModal(null)} title="Two-factor authentication" description="Demo-only security preference." maxWidth="sm" footer={<><Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>Cancel</Button><Button variant="primary" size="sm" onClick={() => { setSettings((current) => ({ ...current, demoTwoFactorEnabled: !current.demoTwoFactorEnabled })); setSaveMessage(settings.demoTwoFactorEnabled ? 'Demo 2FA preference disabled locally.' : 'Demo 2FA preference enabled locally. No authentication was configured.'); setActiveModal(null); }}>{settings.demoTwoFactorEnabled ? 'Disable demo 2FA' : 'Enable demo 2FA'}</Button></>}><div className="space-y-4"><div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4"><Icon name="shield-check" className="mt-0.5 shrink-0 text-success" /><p className="text-xs leading-relaxed text-secondary">This preview lets you test the interaction and status copy. It does not create an authenticator secret, verify a code, or protect an account.</p></div><p className="text-xs text-secondary">Current status: <span className="font-semibold text-primary">{settings.demoTwoFactorEnabled ? 'Demo preference enabled' : 'Not configured'}</span></p></div></Modal>
    </div>
  );
}

export default SettingsPage;
