import { useEffect, useState } from 'react';
import { Avatar, Button, Card, Input, LoadingState } from '../components/ui';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../context/useAuth';
import { loadProfileDetails, saveProfileDetails, settingsErrorMessage, type ProfileDetails } from '../lib/settings';

const emptyProfile: ProfileDetails = { name: '', email: '', location: '' };

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [value, setValue] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    void loadProfileDetails()
      .then((details) => { if (active) setValue(details); })
      .catch((reason) => { if (active) setError(settingsErrorMessage(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await saveProfileDetails(value);
      await refreshProfile();
      setMessage('Profile saved.');
    } catch (reason) {
      setError(settingsErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading your profile" />;

  return <div className="mx-auto w-full max-w-4xl space-y-6 pb-8">
    <header>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">Account identity</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-[32px]">Profile</h1>
      <p className="mt-1 max-w-2xl text-xs leading-relaxed text-secondary sm:text-sm">Manage the identity shown across Finexy. Application behavior and notifications remain in Settings.</p>
    </header>
    {error && <div role="alert" className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-xs font-medium text-danger">{error}</div>}
    {message && <div role="status" className="flex items-center gap-2 rounded-2xl border border-success/25 bg-success/10 px-4 py-3 text-xs font-medium text-primary"><Icon name="check-lg" className="text-success" />{message}</div>}
    <Card padding="lg" className="overflow-hidden">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex shrink-0 items-center gap-3 sm:w-44 sm:flex-col sm:items-start">
          <Avatar name={value.name || value.email} src={profile?.avatar_url ?? undefined} size="lg" className="h-20 w-20 text-xl" />
          <div><p className="text-sm font-semibold text-primary">Account profile</p><p className="mt-1 text-xs leading-relaxed text-secondary">Shared with your authenticated Finexy session.</p></div>
        </div>
        <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
          <div><label htmlFor="profile-name" className="mb-1.5 block text-xs font-semibold text-primary">Display name</label><Input id="profile-name" value={value.name} onChange={(event) => { setValue((current) => ({ ...current, name: event.target.value })); setMessage(''); }} placeholder="Your name" /></div>
          <div><label htmlFor="profile-email" className="mb-1.5 block text-xs font-semibold text-primary">Email address</label><Input id="profile-email" type="email" value={value.email} readOnly aria-readonly="true" leftIcon={<Icon name="envelope" />} /><p className="mt-1.5 text-[11px] text-secondary">Email is owned by your authenticated account.</p></div>
          <div className="sm:col-span-2"><label htmlFor="profile-location" className="mb-1.5 block text-xs font-semibold text-primary">Location</label><Input id="profile-location" value={value.location} onChange={(event) => { setValue((current) => ({ ...current, location: event.target.value })); setMessage(''); }} placeholder="City, country" leftIcon={<Icon name="globe2" />} /></div>
          <div className="flex justify-end border-t border-border pt-4 sm:col-span-2"><Button variant="primary" size="sm" loading={saving} leftIcon={<Icon name="save" />} onClick={() => void save()}>{saving ? 'Saving...' : 'Save Profile'}</Button></div>
        </div>
      </div>
    </Card>
  </div>;
}

export default ProfilePage;
