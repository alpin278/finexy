import { ArrowRight, Lightbulb } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface SurplusInsightProps {
  message: string;
  onReview: () => void;
}

export function SurplusInsight({ message, onReview }: SurplusInsightProps) {
  return (
    <Card padding="none" className="h-full overflow-hidden border-dark bg-dark p-4 text-white sm:p-6">
      <div className="flex h-full flex-col justify-between gap-7">
        <div><div className="flex items-center gap-2 text-accent"><Lightbulb className="h-4 w-4" /><p className="text-[10px] font-bold uppercase tracking-[0.12em]">Surplus Insight</p></div><h2 className="mt-5 text-xl font-bold tracking-tight">A clearer next step for your surplus.</h2><p className="mt-2 text-xs leading-5 text-white/65">{message}</p></div>
        <div><p className="mb-3 text-[10px] leading-4 text-white/45">Neutral prototype guidance only. No investment recommendation or action is performed.</p><Button variant="secondary" size="sm" onClick={onReview} rightIcon={<ArrowRight className="h-3.5 w-3.5" />} className="border-white/15 bg-white/10 text-white hover:bg-white/15">Review Allocation</Button></div>
      </div>
    </Card>
  );
}
