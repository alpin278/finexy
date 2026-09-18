import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Settings, Save } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-bold text-primary tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Manage your personal profile, currency defaults, and security preferences.
          </p>
        </div>

        <Button variant="primary" size="sm" leftIcon={<Save className="w-3.5 h-3.5" />}>
          Save Changes
        </Button>
      </div>

      <Card padding="lg" className="border-dashed flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-border/60 flex items-center justify-center text-secondary mb-3">
          <Settings className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-primary">Settings Page Placeholder</h3>
        <p className="text-xs sm:text-sm text-secondary max-w-sm mt-1">
          Screen 6 (Settings & Preferences with profile toggles and configuration) will be wired here.
        </p>
      </Card>
    </div>
  );
}

export default SettingsPage;
