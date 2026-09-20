import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  CalendarDays,
  Check,
  CircleDollarSign,
  FileText,
  Globe2,
  KeyRound,
  Laptop,
  LockKeyhole,
  Mail,
  Monitor,
  Moon,
  Palette,
  ReceiptText,
  Save,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  WalletCards,
} from 'lucide-react';
import {
  appearanceOptions,
  dateFormatOptions,
  defaultSettingsState,
  numberFormatOptions,
  settingsCurrencyOptions,
  settingsRegionOptions,
} from '../data/settings';
import { Avatar, Button, Card, Input, Modal, Select, StatusBadge } from '../components/ui';
import { PreferenceToggle, SettingsSection } from '../components/settings';
import type { AppearancePreference, SettingsCurrency, SettingsProfile, SettingsState } from '../types/settings';
import { cn } from '../lib/utils';
import { loadSettings, saveSettings, settingsErrorMessage } from '../lib/settings';
import { disconnectTelegram, generateTelegramLinkCode, loadTelegramConnection, type TelegramConnection } from '../lib/telegram';

const appearanceIcons: Record<AppearancePreference, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const currencySymbols: Record<SettingsCurrency, string> = {
  USD: '$',
  EUR: 'Ã¢â€šÂ¬',
  GBP: 'Ã‚£',
  IDR: 'Rp',
};

const fieldLabelClass = 'mb-1.5 block text-xs font-semibold text-primary';
const fieldClass = 'h-10 w-full rounded-[12px] bg-white';

function createInitialSettings(): SettingsState {
  return {
    ...defaultSettingsState,
    profile: { ...defaultSettingsState.profile },
    notifications: defaultSettingsState.notifications.map((notification) => ({ ...notification })),
  };
}

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(createInitialSettings);
  const [loading, setLoading] = useState(true);
  const [Saving�etSaving� useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [telegram, setTelegram] = useState<TelegramConnection>({ status: 'not_connected' });
  const [telegramBusy, setTelegramBusy] = useState(false);
  useEffect(() => { void Promise.all([loadSettings(), loadTelegramConnection()]).then(([loadedSettings, connection]) => { setSettings(loadedSettings); setTelegram(connection); }).catch((reason) => setError(settingsErrorMessage(reason))).finally(() => setLoading(false)); }, []);
  const [activeModal, setActiveModal] = useState<'security' | null>(null);

  const updateProfile = (field: keyof SettingsProfile, value: string) => {
    setSettings((current) => ({ ...current, profile: { ...current.profile, [field]: value } }));
    setSaveMessage('');
  };

  const updateNotification = (id: SettingsState['notifications'][number]['id'], enabled: boolean) => {
    setSettings((current) => ({ ...current, notifications: current.notifications.map((notification) => notification.id === id ? { ...notification, enabled } : notification) }));
    setSaveMessage('');
  };

  const handleSave = async () => { setSaving�ue); setError(''); setSaveMessage(''); try { await saveSettings(settings); setSaveMessage('Settings saved. Reporting currency updates on the next Overview or Reports load.'); } catch (reason) { setError(settingsErrorMessage(reason)); } finally { setSaving�lse); } };
  const enabledNotifications = settings.notifications.filter((notification) => notification.enabled).length;
  const handleGenerateTelegramCode = async () => {
    setTelegramBusy(true); setError(''); setSaveMessage('');
    try { setTelegram(await generateTelegramLinkCode()); }
    catch (reason) { setError(settingsErrorMessage(reason)); }
    finally { setTelegramBusy(false); }
  };
  const handleDisconnectTelegram = async () => {
    setTelegramBusy(true); setError(''); setSaveMessage('');
    try { await disconnectTelegram(); setTelegram({ status: 'not_connected' }); setSaveMessage('Telegram disconnected. Link codes and active Telegram sessions were invalidated.'); }
    catch (reason) { setError(settingsErrorMessage(reason)); }
    finally { setTelegramBusy(false); }
  };

  if (loading) return <div role="status" className="rounded-2xl border border-border bg-white p-10 text-center text-sm text-secondary">Loading your saved preferencesÃ¢€Â¦</div>;
  return (
    <div className="space-y-6 pb-8 animate-in fade-in-50 duration-200">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">Personal workspace</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-[32px]">Settings &amp; Preferences</h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-secondary sm:text-sm">Keep your Finexy profile, money formats, alerts, and personal finance habits in one place.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status="in_progress" label="Supabase preferences" />
          <Button variant="primary" size="sm" leftIcon={<Save className="h-3.5 w-3.5" />} onClick={handleSave}>{Saving�'Saving�¿Â½' : 'Save Changes'}</Button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-xs font-medium text-danger">{error}</div>}
      {saveMessage && <div role="status" className="flex items-start gap-2 rounded-2xl border border-success/25 bg-success/10 px-4 py-3 text-xs font-medium text-primary"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" /><span>{saveMessage}</span></div>}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-6">
          <SettingsSection icon={UserRound} eyebrow="Account" title="Profile & Identity" description="Make your workspace feel like yours. Your display name and location are saved to your Finexy profile. Email remains managed by Supabase Auth.">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
              <div className="flex shrink-0 items-center gap-3 lg:w-52 lg:flex-col lg:items-start">
                <Avatar name={settings.profile.name} size="lg" className="h-20 w-20 text-xl" />
                <div><p className="text-sm font-semibold text-primary">Your profile</p><p className="mt-1 text-xs text-secondary">Avatar preview only</p><button type="button" className="mt-2 text-xs font-semibold text-accent hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30" onClick={() => setSaveMessage('Avatar changes are demo-only and are not uploaded anywhere.')}>Use demo avatar</button></div>
              </div>
              <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
                <div><label htmlFor="settings-name" className={fieldLabelClass}>Display name</label><Input id="settings-name" value={settings.profile.name} onChange={(event) => updateProfile('name', event.target.value)} placeholder="Your name" /></div>
                <div><label htmlFor="settings-email" className={fieldLabelClass}>Email address</label><Input id="settings-email" type="email" value={settings.profile.email} onChange={(event) => updateProfile('email', event.target.value)} placeholder="you@example.com" leftIcon={<Mail className="h-4 w-4" />} /></div>
                <div><label htmlFor="settings-location" className={fieldLabelClass}>Location</label><Input id="settings-location" value={settings.profile.location} onChange={(event) => updateProfile('location', event.target.value)} placeholder="City, country" leftIcon={<Globe2 className="h-4 w-4" />} /></div>
                <div><label htmlFor="settings-timezone" className={fieldLabelClass}>Timezone</label><Select id="settings-timezone" value={settings.profile.timezone} onChange={(event) => updateProfile('timezone', event.target.value)} options={[{ value: 'Asia/Jakarta (GMT+7)', label: 'Asia/Jakarta (GMT+7)' }, { value: 'America/New_York (GMT-5)', label: 'America/New York (GMT-5)' }, { value: 'Europe/London (GMT+0)', label: 'Europe/London (GMT+0)' }]} className={fieldClass} /></div>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection icon={CircleDollarSign} eyebrow="Regional defaults" title="Currency & Regional" description="Choose the formats that make your balances and transactions easiest to read.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="settings-currency" className={fieldLabelClass}>Default currency</label><Select id="settings-currency" value={settings.currency} onChange={(event) => { setSettings((current) => ({ ...current, currency: event.target.value as SettingsCurrency })); setSaveMessage(''); }} options={settingsCurrencyOptions} className={fieldClass} /><p className="mt-1.5 text-[11px] text-secondary">New values will display with {currencySymbols[settings.currency]} ({settings.currency}).</p></div>
              <div><label htmlFor="settings-region" className={fieldLabelClass}>Locale / region</label><Select id="settings-region" value={settings.region} onChange={(event) => { setSettings((current) => ({ ...current, region: event.target.value })); setSaveMessage(''); }} options={settingsRegionOptions} className={fieldClass} /></div>
              <div><label htmlFor="settings-date-format" className={fieldLabelClass}>Date format</label><Select id="settings-date-format" value={settings.dateFormat} onChange={(event) => { setSettings((current) => ({ ...current, dateFormat: event.target.value })); setSaveMessage(''); }} options={dateFormatOptions} className={fieldClass} /></div>
              <div><label htmlFor="settings-number-format" className={fieldLabelClass}>Number format</label><Select id="settings-number-format" value={settings.numberFormat} onChange={(event) => { setSettings((current) => ({ ...current, numberFormat: event.target.value })); setSaveMessage(''); }} options={numberFormatOptions} className={fieldClass} /></div>
            </div>
          </SettingsSection>

          <SettingsSection icon={Palette} eyebrow="Visual comfort" title="Theme & Appearance" description="Choose how Finexy should feel. Theme preference is saved; visual theme switching remains deferred.">
            <div className="grid gap-3 sm:grid-cols-3">
              {appearanceOptions.map((option) => { const Icon = appearanceIcons[option.value]; const selected = settings.appearance === option.value; return <button key={option.value} type="button" aria-pressed={selected} onClick={() => { setSettings((current) => ({ ...current, appearance: option.value })); setSaveMessage(''); }} className={cn('rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20', selected ? 'border-dark bg-surface ring-2 ring-accent/15' : 'border-border bg-white hover:border-secondary/40 hover:bg-surface')}><div className="flex items-center justify-between gap-3"><span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', selected ? 'bg-dark text-white' : 'bg-surface text-secondary')}><Icon className="h-4 w-4" aria-hidden="true" /></span>{selected && <Check className="h-4 w-4 text-accent" aria-hidden="true" />}</div><p className="mt-4 text-sm font-semibold text-primary">{option.label}</p><p className="mt-1 text-xs text-secondary">{option.description}</p></button>; })}
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-surface px-3.5 py-3 text-xs text-secondary"><Laptop className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>Dark and System are preference previews for now. The app stays on the current light design system until a global theme foundation is introduced.</span></div>
          </SettingsSection>

          <SettingsSection icon={ReceiptText} eyebrow="Money habits" title="Transaction Preferences" description="Set a few defaults that keep everyday personal finance tracking quick and consistent.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="settings-transaction-type" className={fieldLabelClass}>Default transaction type</label><Select id="settings-transaction-type" value={settings.transactionType} onChange={(event) => { setSettings((current) => ({ ...current, transactionType: event.target.value as SettingsState['transactionType'] })); setSaveMessage(''); }} options={[{ value: 'expense', label: 'Expense' }, { value: 'income', label: 'Income' }]} className={fieldClass} /><p className="mt-1.5 text-[11px] text-secondary">Used when starting a new manual transaction.</p></div>
              <div><label htmlFor="settings-entry-mode" className={fieldLabelClass}>Entry style</label><Select id="settings-entry-mode" value={settings.entryMode} onChange={(event) => { setSettings((current) => ({ ...current, entryMode: event.target.value as SettingsState['entryMode'] })); setSaveMessage(''); }} options={[{ value: 'quick', label: 'Quick entry' }, { value: 'detailed', label: 'Detailed entry' }]} className={fieldClass} /><p className="mt-1.5 text-[11px] text-secondary">Saved for future transaction form defaults.</p></div>
            </div>
            <div className="mt-5 divide-y divide-border border-t border-border pt-2"><PreferenceToggle id="settings-auto-categorize" title="Suggest categories" description="Use the existing local category list to suggest a category while entering a transaction." checked={settings.autoCategorize} onChange={(autoCategorize) => { setSettings((current) => ({ ...current, autoCategorize })); setSaveMessage(''); }} /><PreferenceToggle id="settings-merchant-suggestions" title="Remember merchant labels" description="Keep merchant names consistent in this session so spending is easier to scan." checked={settings.merchantSuggestions} onChange={(merchantSuggestions) => { setSettings((current) => ({ ...current, merchantSuggestions })); setSaveMessage(''); }} /><PreferenceToggle id="settings-confirm-delete" title="Confirm before deleting" description="Ask for a confirmation before removing a local transaction or budget." checked={settings.confirmBeforeDeleting} onChange={(confirmBeforeDeleting) => { setSettings((current) => ({ ...current, confirmBeforeDeleting })); setSaveMessage(''); }} /></div>
          </SettingsSection>

          <SettingsSection icon={WalletCards} eyebrow="Connections" title="Telegram" description="Link Telegram to your signed-in Finexy account. This foundation does not expose financial data or accept financial commands.">
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary"><i className="bi bi-telegram text-lg" aria-hidden="true" /></div><div><p className="text-sm font-semibold text-primary">Telegram</p><p className="mt-1 text-xs text-secondary">{telegram.status === 'connected' ? 'Your Telegram account is linked.' : telegram.status === 'link_code_ready' ? 'Send the code below to the Finexy bot.' : 'Generate a one-time code to link your account.'}</p><div className="mt-2"><StatusBadge status={telegram.status === 'connected' ? 'active' : telegram.status === 'link_code_ready' ? 'in_progress' : 'inactive'} label={telegram.status === 'connected' ? 'Connected' : telegram.status === 'link_code_ready' ? 'Link Code Ready' : 'Not Connected'} /></div></div></div>
              {telegram.status === 'connected' ? <Button variant="outline" size="sm" disabled={telegramBusy} onClick={handleDisconnectTelegram}>Disconnect Telegram</Button> : <Button variant="accent" size="sm" disabled={telegramBusy} onClick={handleGenerateTelegramCode}>{telegramBusy ? 'Generating…' : 'Generate Link Code'}</Button>}
            </div>
            {telegram.status === 'link_code_ready' && <div className="mt-4 rounded-xl border border-accent/20 bg-accent/10 p-3.5"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">One-time link code</p><p className="mt-1 font-mono text-lg font-bold tracking-[0.16em] text-primary">{telegram.code}</p><p className="mt-1.5 text-xs text-secondary">Send <span className="font-semibold text-primary">/link {telegram.code}</span> to the Finexy bot. Expires {new Date(telegram.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</p></div>}
          </SettingsSection>

          <SettingsSection icon={ShieldCheck} eyebrow="Account safety" title="Security & 2FA" description="Review the future security surface without storing passwords, secrets, or real authentication state.">
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary"><LockKeyhole className="h-5 w-5" aria-hidden="true" /></div><div><p className="text-sm font-semibold text-primary">Two-factor authentication</p><p className="mt-1 text-xs text-secondary">{settings.demoTwoFactorEnabled ? 'Demo preference enabled for this session' : 'Not configured in the frontend prototype'}</p><div className="mt-2"><StatusBadge status={settings.demoTwoFactorEnabled ? 'active' : 'inactive'} label={settings.demoTwoFactorEnabled ? 'Demo enabled' : 'Demo only'} /></div></div></div><Button variant="outline" size="sm" leftIcon={<KeyRound className="h-3.5 w-3.5" />} onClick={() => setActiveModal('security')}>Review 2FA</Button></div>
            <p className="mt-4 text-[11px] leading-relaxed text-secondary">Security controls will be connected only when authentication is introduced. This screen does not accept or retain passwords.</p>
          </SettingsSection>

          <SettingsSection icon={Bell} eyebrow="Stay informed" title="Notifications" description="Choose which personal finance moments deserve a gentle reminder in the app.">
            <div className="divide-y divide-border">{settings.notifications.map((notification) => <PreferenceToggle key={notification.id} id={`settings-${notification.id}`} title={notification.title} description={notification.description} checked={notification.enabled} onChange={(enabled) => updateNotification(notification.id, enabled)} />)}</div>
            <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-[11px] text-secondary"><CalendarDays className="h-4 w-4" aria-hidden="true" /><span>{enabledNotifications} of {settings.notifications.length} notification preferences enabled</span></div>
          </SettingsSection>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6">
          <Card padding="lg"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-dark text-white"><Sparkles className="h-5 w-5" aria-hidden="true" /></div><div><h2 className="text-sm font-semibold text-primary">Your preferences</h2><p className="mt-0.5 text-xs text-secondary">A quick local snapshot</p></div></div><dl className="mt-5 space-y-4"><div className="flex items-center justify-between gap-4"><dt className="text-xs text-secondary">Currency</dt><dd className="text-xs font-semibold text-primary">{settings.currency} {currencySymbols[settings.currency]}</dd></div><div className="flex items-center justify-between gap-4"><dt className="text-xs text-secondary">Region</dt><dd className="text-xs font-semibold text-primary">{settings.region}</dd></div><div className="flex items-center justify-between gap-4"><dt className="text-xs text-secondary">Appearance</dt><dd className="text-xs font-semibold capitalize text-primary">{settings.appearance}</dd></div><div className="flex items-center justify-between gap-4"><dt className="text-xs text-secondary">Alerts</dt><dd className="text-xs font-semibold text-primary">{enabledNotifications} enabled</dd></div></dl></Card>
          <Card padding="lg" className="border-dark bg-dark text-white"><div className="flex items-center gap-2 text-accent"><FileText className="h-4 w-4" aria-hidden="true" /><span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Prototype boundaries</span></div><p className="mt-3 text-sm font-semibold">Everything here is safe to explore.</p><ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-white/65"><li>Ã¢€Â¢ Changes live in local React state.</li><li>Ã¢€Â¢ Refreshing the page resets this demo.</li><li>Ã¢€Â¢ No bank, OAuth, password, or secret data is used.</li></ul></Card>
        </aside>
      </div>

      <Modal isOpen={activeModal === 'security'} onClose={() => setActiveModal(null)} title="Two-factor authentication" description="Demo-only security preference." maxWidth="sm" footer={<><Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>Cancel</Button><Button variant="primary" size="sm" onClick={() => { setSettings((current) => ({ ...current, demoTwoFactorEnabled: !current.demoTwoFactorEnabled })); setSaveMessage(settings.demoTwoFactorEnabled ? 'Demo 2FA preference disabled locally.' : 'Demo 2FA preference enabled locally. No authentication was configured.'); setActiveModal(null); }}>{settings.demoTwoFactorEnabled ? 'Disable demo 2FA' : 'Enable demo 2FA'}</Button></>}><div className="space-y-4"><div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" /><p className="text-xs leading-relaxed text-secondary">This preview lets you test the interaction and status copy. It does not create an authenticator secret, verify a code, or protect an account.</p></div><p className="text-xs text-secondary">Current status: <span className="font-semibold text-primary">{settings.demoTwoFactorEnabled ? 'Demo preference enabled' : 'Not configured'}</span></p></div></Modal>
    </div>
  );
}

export default SettingsPage;
