import type { PaymentCardData } from '../../types/finance';
import { Wifi } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface PaymentCardProps {
  card: PaymentCardData;
  className?: string;
}

export function PaymentCard({ card, className }: PaymentCardProps) {
  const isDark = card.variant === 'dark';

  return (
    <div
      className={cn(
        'w-64 sm:w-72 h-40 sm:h-44 p-4 sm:p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden shrink-0 select-none shadow-md transition-transform duration-200 hover:-translate-y-1',
        isDark
          ? 'bg-dark text-white'
          : 'bg-accent text-white',
        className
      )}
    >
      {/* Decorative background geometry */}
      <div
        className="absolute -right-8 -bottom-10 w-36 h-36 rounded-full opacity-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%)',
        }}
      />
      <div
        className="absolute right-10 -top-10 w-28 h-28 rounded-full opacity-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%)',
        }}
      />

      {/* Card Header: Chip/Contactless + Status Badge */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          {/* SIM chip aesthetic */}
          <div className="w-8 h-6 rounded-md bg-amber-200/40 border border-amber-100/60 flex items-center justify-center">
            <div className="w-4 h-3 border border-amber-300/60 rounded-xs" />
          </div>
          {/* Contactless symbol */}
          <Wifi className="w-4 h-4 text-white/80 rotate-90" />
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white backdrop-blur-xs">
          {card.status}
        </span>
      </div>

      {/* Card Number */}
      <div className="z-10 my-auto">
        <span className="text-sm sm:text-base font-mono tracking-widest font-semibold text-white/95">
          •••• •••• •••• {card.last4}
        </span>
      </div>

      {/* Card Footer: Expiry, CVV & Brand Logo */}
      <div className="flex items-end justify-between z-10">
        <div className="flex items-center gap-4 text-[10px] text-white/80">
          <div>
            <span className="block text-[8px] uppercase tracking-wider text-white/60">Expires</span>
            <span className="font-semibold text-white">{card.expiry}</span>
          </div>
          <div>
            <span className="block text-[8px] uppercase tracking-wider text-white/60">CVV</span>
            <span className="font-semibold text-white">{card.cvv}</span>
          </div>
        </div>

        {/* Brand Logo (Mastercard overlapping circles or Visa italic) */}
        {card.type === 'mastercard' ? (
          <div className="flex items-center -space-x-2">
            <div className="w-5 h-5 rounded-full bg-red-500/90" />
            <div className="w-5 h-5 rounded-full bg-amber-400/90" />
          </div>
        ) : (
          <div className="text-sm font-black italic tracking-wider text-white/95">
            VISA
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentCard;
