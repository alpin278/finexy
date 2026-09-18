import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Layers } from 'lucide-react';

export function CategoriesPage() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[32px] font-bold text-[#171714] tracking-tight">
            Categories & Budgets
          </h1>
          <p className="text-xs sm:text-sm text-[#777771] mt-1">
            Organize spending limits and allocate monthly budgets per category.
          </p>
        </div>

        <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
          New Category
        </Button>
      </div>

      <Card padding="lg" className="border-dashed flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-[#ECECE8]/60 flex items-center justify-center text-[#777771] mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#171714]">Categories View Placeholder</h3>
        <p className="text-xs sm:text-sm text-[#777771] max-w-sm mt-1">
          Screen 5 (Categories Management Grid) components will render here inside the shared layout.
        </p>
      </Card>
    </div>
  );
}
