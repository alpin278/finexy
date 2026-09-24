import { IconButton } from '../ui/IconButton';
import { Icon } from '../ui/Icon';
import { StatusBadge } from '../ui/StatusBadge';
import { TableCell, TableRow } from '../ui/Table';
import type { Transaction } from '../../types/finance';
import { formatTransactionAmount, formatTransactionDate, getStatusBadgeType, getStatusLabel } from './transactionUtils';
import { cn } from '../../lib/utils';

export interface TransactionRowProps {
  transaction: Transaction;
  isActionMenuOpen: boolean;
  onToggleActionMenu: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  selected?: boolean;
  rowIndex?: number;
  onSelect?: () => void;
}

/** Compact logical-activity row: lower-priority fields move into metadata/detail. */
export function TransactionRow({
  transaction,
  isActionMenuOpen,
  onToggleActionMenu,
  onView,
  onEdit,
  onDelete,
  selected = false,
  rowIndex,
  onSelect,
}: TransactionRowProps) {
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const directionIcon = isTransfer ? 'arrow-left-right' : isIncome ? 'arrow-down-left' : 'arrow-up-right';

  return (
    <TableRow
      data-transaction-row={rowIndex}
      data-state={selected ? 'selected' : undefined}
      aria-selected={selected}
      onClick={onSelect}
      className="group hover:bg-surface/70 data-[state=selected]:bg-accent/[0.06] data-[state=selected]:shadow-[inset_3px_0_0_#FF5A36]"
    >
      <TableCell className="min-w-0 pl-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
              isTransfer ? 'border-accent/20 bg-accent/10 text-accent' : isIncome ? 'border-success/20 bg-success/10 text-success' : 'border-border bg-surface text-primary'
            )}
            aria-hidden="true"
          >
            <Icon name={directionIcon} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">{transaction.description}</p>
            <p className="mt-0.5 truncate text-xs text-secondary">
              {transaction.category} <span aria-hidden="true">·</span> {transaction.wallet} <span aria-hidden="true">·</span> {formatTransactionDate(transaction.date)}{transaction.time ? `, ${transaction.time}` : ''}
            </p>
            <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-wider text-secondary">
              {transaction.splits?.length ? `Split · ${transaction.splits.length} categories` : isTransfer ? 'Wallet transfer' : transaction.method}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="w-[1%] whitespace-nowrap text-right">
        <span className={cn('money-value text-sm font-bold tracking-tight', isTransfer ? 'text-accent' : isIncome ? 'text-success' : 'text-primary')}>
          {formatTransactionAmount(transaction)}
        </span>
      </TableCell>
      <TableCell className="hidden w-[1%] whitespace-nowrap sm:table-cell">
        <StatusBadge status={getStatusBadgeType(transaction.status)} label={getStatusLabel(transaction.status)} />
      </TableCell>
      <TableCell className="w-14 pr-5 text-right">
        <div className="relative inline-flex">
          <IconButton
            aria-label={`Actions for ${transaction.description}`}
            size="sm"
            variant="ghost"
            aria-expanded={isActionMenuOpen}
            onClick={(event) => { event.stopPropagation(); onToggleActionMenu(); }}
          >
            <Icon name="three-dots" />
          </IconButton>
          {isActionMenuOpen && (
            <div className="menu-enter absolute right-0 top-9 z-20 w-32 rounded-xl border border-border bg-card py-1 shadow-dropdown">
              <button type="button" onClick={onView} className="w-full px-3 py-2 text-left text-xs font-medium text-primary hover:bg-surface">View Details</button>
              {!isTransfer && <button type="button" onClick={onEdit} className="w-full px-3 py-2 text-left text-xs font-medium text-primary hover:bg-surface">Edit</button>}
              {!isTransfer && <button type="button" onClick={onDelete} className="w-full px-3 py-2 text-left text-xs font-medium text-danger hover:bg-danger/10">Delete</button>}
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default TransactionRow;
