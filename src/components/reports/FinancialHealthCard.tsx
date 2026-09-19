import { Award, Gauge, ShieldCheck } from 'lucide-react';
import type { FinancialHealthMetric } from '../../types/reports';
import { Card } from '../ui/Card';

interface FinancialHealthCardProps {
  health: FinancialHealthMetric;
  peerBenchmark: string;
}

export function FinancialHealthCard({ health, peerBenchmark }: FinancialHealthCardProps) {
  return (
    <Card padding="none" className="h-full overflow-hidden p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">Prototype indicator</p><h2 className="mt-1 text-lg font-bold tracking-tight text-primary">Wealth Velocity</h2><p className="mt-1 text-xs text-secondary">Automated compounding readiness</p></div>
        <div className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-accent/10 text-accent"><Gauge className="h-4 w-4" /></div>
      </div>
      <div className="mt-6 flex items-center gap-5">
        <div className="relative flex h-[112px] w-[112px] shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#FF5A36 ${health.score}%, #ECECE8 0)` }}>
          <div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-white"><span className="text-3xl font-bold tracking-[-0.06em] text-primary">{health.score}</span><span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-secondary">/ 100</span></div>
        </div>
        <div className="min-w-0"><div className="flex items-center gap-2"><Award className="h-4 w-4 shrink-0 text-accent" /><p className="text-xs font-bold text-primary">{health.grade}</p></div><p className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-success">{health.label}</p><p className="mt-3 text-xs text-secondary">Runway Projection: <strong className="text-primary">{health.runway}</strong></p></div>
      </div>
      <div className="mt-5 grid gap-2 border-t border-border/70 pt-4 sm:grid-cols-2"><div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /><p className="text-[10px] leading-4 text-secondary">{health.context}</p></div><p className="text-[10px] leading-4 text-secondary sm:text-right"><strong className="font-semibold text-primary">Peer Benchmark</strong><br />Ranked #14 of 420 - {peerBenchmark}</p></div>
    </Card>
  );
}
