import { Badge } from '../ui/Badge';
import { IconButton } from '../ui/IconButton';
import { Icon } from '../ui/Icon';
import { StatusBadge } from '../ui/StatusBadge';
import { TableCell, TableRow } from '../ui/Table';
import type { Transaction } from '../../types/finance';
import {
  formatTransactionAmount,
  formatTransactionDate,
  getStatusBadgeType,
  getStatusLabel,
} from './transactionUtils';
import { cn } from '../../lib/utils';

export interface TransactionRowProps {
  transaction: Transaction;
  isActionMenuOpen: boolean;
  onToggleActionMenu: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TransactionRow({
  transaction,
  isActionMenuOpen,
  onToggleActionMenu,
  onView,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const directionIcon = isTransfer ? 'arrow-left-right' : isIncome ? 'arrow-down-left' : 'arrow-up-right';

  return (
    <TableRow className="group hover:bg-surface/70">
      <TableCell className="min-w-[260px]">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'w-8 h-8 mt-0.5 rounded-full flex items-center justify-center shrink-0 border',
              isTransfer
                ? 'bg-accent/10 text-accent border-accent/20'
                : isIncome
                ? 'bg-success/10 text-success border-success/20'
                : 'bg-surface text-primary border-border'
            )}
            aria-hidden="true"
          >
            <Icon name={directionIcon} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary truncate">{transaction.description}</p>
            <p className="text-xs text-secondary truncate mt-0.5">{transaction.payee}</p>
            <p className="text-[10px] text-secondary/80 font-mono mt-1 truncate">
              {transaction.reference} <span aria-hidden="true">•</span> {transaction.secondaryReference}
            </p>
          </div>
        </div>
      </TableCell>

      <TableCell className="min-w-[150px]">
        <Badge variant="neutral" className="text-[11px] whitespace-nowrap">
          {transaction.category}
        </Badge>
      </TableCell>

      <TableCell className="min-w-[180px]">
        <p className="text-xs font-semibold text-primary whitespace-nowrap">{transaction.wallet}</p>
        <p className="text-[11px] text-secondary mt-0.5 whitespace-nowrap">{transaction.method}</p>
      </TableCell>

      <TableCell className="min-w-[140px] whitespace-nowrap">
        <p className="text-xs font-medium text-primary">{formatTransactionDate(transaction.date)}</p>
        <p className="text-[11px] text-secondary mt-0.5">{transaction.time}</p>
      </TableCell>

      <TableCell className="text-right min-w-[125px] whitespace-nowrap">
        <span className={cn('text-sm font-bold tracking-tight', isTransfer ? 'text-accent' : isIncome ? 'text-success' : 'text-primary')}>
          {formatTransactionAmount(transaction)}
        </span>
      </TableCell>

      <TableCell className="min-w-[125px]">
        <StatusBadge
          status={getStatusBadgeType(transaction.status)}
          label={getStatusLabel(transaction.status)}
        />
      </TableCell>

      <TableCell className="w-14 text-right">
        <div className="relative inline-flex">
          <IconButton
            aria-label={`Actions for ${transaction.description}`}
            size="sm"
            variant="ghost"
            aria-expanded={isActionMenuOpen}
            onClick={onToggleActionMenu}
          >
            <Icon name="three-dots" />
          </IconButton>

          {isActionMenuOpen && (
            <div className="absolute right-0 top-9 z-20 w-32 rounded-xl border border-border bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={onView}
                className="w-full px-3 py-2 text-left text-xs font-medium text-primary hover:bg-surface cursor-pointer"
              >
                View Details
              </button>
              {!isTransfer && <button
                type="button"
                onClick={onEdit}
                className="w-full px-3 py-2 text-left text-xs font-medium text-primary hover:bg-surface cursor-pointer"
              >
                Edit
              </button>}
              {!isTransfer && <button
                type="button"
                onClick={onDelete}
                className="w-full px-3 py-2 text-left text-xs font-medium text-danger hover:bg-danger/10 cursor-pointer"
              >
                Delete
              </button>}
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default TransactionRow;
