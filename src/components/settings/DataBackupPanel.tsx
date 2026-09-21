import { useRef, useState } from 'react';
import { getBackupPreview, importBackup, readBackupFile, exportFullBackup, type BackupDocument, type BackupImportSummary, type BackupPreview } from '../../lib/data-backup';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Select } from '../ui/Select';
import { useDataInvalidation } from '../../context/DataRevalidationContext';

function previewRows(preview: BackupPreview) {
  return [
    ['Wallets', preview.wallets],
    ['Categories', preview.categories],
    ['Transactions', preview.transactions],
    ['Transfers', preview.transfers],
    ['Budgets', preview.budgets],
    ['Recurring rules', preview.recurringRules],
    ['Split allocations', preview.splits],
  ] as const;
}

function summaryRows(summary: BackupImportSummary) {
  return [
    ['Wallets', summary.wallets],
    ['Categories', summary.categories],
    ['Transactions', summary.transactions],
    ['Transfers', summary.transfers],
    ['Budgets', summary.budgets],
    ['Recurring rules', summary.recurring_rules],
    ['Split allocations', summary.splits ?? 0],
  ] as const;
}

export function DataBackupPanel() {
  const invalidate = useDataInvalidation();
  const fileInput = useRef<HTMLInputElement>(null);
  const [backup, setBackup] = useState<BackupDocument | null>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [mode, setMode] = useState<'merge' | 'restore_empty'>('merge');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [summary, setSummary] = useState<BackupImportSummary | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');

  const handleExport = async () => {
    setBusy(true); setError(''); setFeedback(''); setSummary(null);
    try { await exportFullBackup(); setFeedback('Backup downloaded. Keep it somewhere safe.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'We could not export your backup.'); }
    finally { setBusy(false); }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setSelectedFileName(file.name);
    setBusy(true); setError(''); setFeedback(''); setSummary(null);
    try { const nextBackup = await readBackupFile(file); setBackup(nextBackup); setPreview(getBackupPreview(nextBackup)); }
    catch (reason) { setBackup(null); setPreview(null); setSelectedFileName(''); setError(reason instanceof Error ? reason.message : 'We could not read this backup.'); }
    finally { setBusy(false); if (fileInput.current) fileInput.current.value = ''; }
  };

  const handleImport = async () => {
    if (!backup) return;
    setBusy(true); setError(''); setFeedback('');
    try { const result = await importBackup(backup, mode); await invalidate(['transactions', 'wallets', 'budgets', 'overview', 'reports', 'categories', 'recurring', 'settings']); setSummary(result); setFeedback(result.already_imported ? 'This backup was already imported; no records were duplicated.' : 'Backup imported successfully.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'We could not import this backup.'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary"><Icon name="download" className="text-lg" /></div><div><p className="text-sm font-semibold text-primary">Export full backup</p><p className="mt-1 text-xs leading-relaxed text-secondary">Download your profile, preferences, wallets, categories, ledger, transfers, budgets, and recurring rules as versioned JSON.</p></div></div>
        <Button className="mt-4" variant="primary" size="sm" loading={busy} leftIcon={<Icon name="file-earmark-arrow-down" />} onClick={() => void handleExport}>Export backup</Button>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary"><Icon name="upload" className="text-lg" /></div><div><p className="text-sm font-semibold text-primary">Import backup</p><p className="mt-1 text-xs leading-relaxed text-secondary">Only Finexy JSON backups are accepted. The file is parsed and validated before anything can be written.</p></div></div>
        <input ref={fileInput} className="sr-only" type="file" accept=".json,application/json" aria-label="Choose Finexy backup file" onChange={(event) => void handleFile(event.target.files?.[0])} />
        <div className="mt-4 flex min-w-0 items-center gap-2 rounded-xl border border-dashed border-border bg-white p-2">
          <Button variant="outline" size="sm" loading={busy} leftIcon={<Icon name="folder2-open" />} onClick={() => fileInput.current?.click()}>Choose file</Button>
          <span className="min-w-0 truncate text-[11px] text-secondary">{selectedFileName || 'No backup selected'}</span>
        </div>
      </div>
    </div>

    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-primary">Backup format</p><p className="mt-1 text-xs leading-relaxed text-secondary">Finexy backup v1 uses opaque relationship references. It never contains passwords, auth tokens, Telegram secrets, Vault values, service-role data, or integration sessions.</p></div><span className="shrink-0 rounded-full bg-surface px-3 py-1 text-[11px] font-semibold text-secondary">finexy-backup · v1</span></div>
      {preview && backup && <div className="mt-4 rounded-xl border border-accent/20 bg-accent/5 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-primary">Import preview</p><p className="mt-1 max-w-sm truncate text-xs font-medium text-primary">{selectedFileName}</p><p className="mt-1 text-xs text-secondary">Backup date: {new Date(preview.backupDate).toLocaleString()} · Version {preview.version}</p><p className="mt-1 text-xs text-secondary">Currencies: {preview.currencies.join(', ') || 'None'}</p></div><div className="w-full sm:w-64"><label htmlFor="backup-import-mode" className="mb-1.5 block text-xs font-semibold text-primary">Import mode</label><Select id="backup-import-mode" value={mode} onChange={(event) => setMode(event.target.value as 'merge' | 'restore_empty')} options={[{ value: 'merge', label: 'Merge into this account' }, { value: 'restore_empty', label: 'Restore into empty account' }]} className="w-full bg-white" /></div></div><dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{previewRows(preview).map(([label, value]) => <div key={label} className="rounded-xl border border-border/70 bg-white px-3 py-2"><dt className="text-[11px] text-secondary">{label}</dt><dd className="mt-0.5 text-sm font-semibold text-primary">{value}</dd></div>)}</dl><div className="mt-3 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5 text-[11px] leading-relaxed text-primary">Review the counts and import mode before continuing. Merge keeps existing history; restore only works for an empty account.</div><div className="mt-4 flex flex-wrap items-center gap-2"><Button variant="accent" size="sm" loading={busy} leftIcon={<Icon name="shield-check" />} onClick={() => void handleImport}>Confirm import</Button><Button variant="ghost" size="sm" disabled={busy} onClick={() => { setBackup(null); setPreview(null); setSelectedFileName(''); }}>Choose another file</Button></div></div>}
      {!preview && <p className="mt-4 text-xs text-secondary">Choose a backup file to see its counts, currencies, date, and version before confirmation.</p>}
    </div>

    {error && <div role="alert" className="rounded-xl border border-danger/25 bg-danger/10 px-3.5 py-3 text-xs font-medium text-danger">{error}</div>}
    {feedback && <div role="status" className="rounded-xl border border-success/25 bg-success/10 px-3.5 py-3 text-xs font-medium text-primary"><Icon name="check-lg" className="mr-2 text-success" />{feedback}</div>}
    {summary && <div className="rounded-xl border border-border bg-surface p-4"><p className="text-sm font-semibold text-primary">Import summary</p><dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{summaryRows(summary).map(([label, value]) => <div key={label}><dt className="text-[11px] text-secondary">{label}</dt><dd className="text-sm font-semibold text-primary">{value}</dd></div>)}</dl></div>}
  </div>;
}
