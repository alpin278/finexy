import { Card } from '../ui/Card';
import { PaymentCard } from './PaymentCard';
import type { PaymentCardData } from '../../types/finance';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface PaymentCardsProps {
  cards: PaymentCardData[];
  onAddCard?: () => void;
  className?: string;
}

export function PaymentCards({ cards, onAddCard, className }: PaymentCardsProps) {
  return (
    <Card className={cn('p-5 sm:p-6 flex flex-col justify-between overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <h3 className="text-sm font-bold text-primary">My Cards</h3>

        <button
          type="button"
          onClick={onAddCard}
          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add new</span>
        </button>
      </div>

      {/* Cards container: horizontally scrollable on mobile/tablet, flex gap on desktop */}
      <div className="flex items-center gap-3.5 pt-4 overflow-x-auto pb-2 scrollbar-none">
        {cards.map((card) => (
          <PaymentCard key={card.id} card={card} />
        ))}
      </div>
    </Card>
  );
}

export default PaymentCards;
