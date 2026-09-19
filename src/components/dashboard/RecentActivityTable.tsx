import { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import { SearchInput } from '../ui/SearchInput';
import { StatusBadge } from '../ui/StatusBadge';
import { Checkbox } from '../ui/Checkbox';
import type { RecentActivity, ActivityStatus } from '../../types/finance';
import { SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface RecentActivityTableProps {
  activities: RecentActivity[];
  className?: string;
}

export function RecentActivityTable({ activities, className }: RecentActivityTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Local mock search & filter
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesSearch =
        act.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === 'All' || act.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [activities, searchQuery, selectedStatus]);

  const isAllSelected =
    filteredActivities.length > 0 &&
    filteredActivities.every((act) => selectedRows[act.id]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRows({});
    } else {
      const next: Record<string, boolean> = {};
      filteredActivities.forEach((act) => {
        next[act.id] = true;
      });
      setSelectedRows(next);
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const mapStatusToBadge = (status: ActivityStatus) => {
    switch (status) {
      case 'Completed':
        return 'completed';
      case 'Pending':
        return 'pending';
      case 'In Progress':
        return 'in_progress';
      default:
        return 'completed';
    }
  };

  return (
    <Card className={cn('p-5 sm:p-6 flex flex-col justify-between overflow-hidden', className)}>
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-primary">Recent Transactions</h3>
          <p className="text-xs text-secondary mt-0.5">
            A quick view of recent income and expenses
          </p>
        </div>

        {/* Search & Filter Buttons */}
        <div className="flex items-center gap-2.5">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search transactions..."
            className="w-44 sm:w-56"
          />

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                'h-9 px-3 rounded-full border border-border bg-surface hover:bg-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                selectedStatus !== 'All' ? 'text-accent border-accent/40 bg-accent/5' : 'text-secondary hover:text-primary'
              )}
              aria-label="Filter transactions"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filter</span>
              {selectedStatus !== 'All' && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white border border-border rounded-xl shadow-lg py-1 z-30 animate-in fade-in-80 duration-150">
                {['All', 'Completed', 'Pending', 'In Progress'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setSelectedStatus(status);
                      setIsFilterOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                      selectedStatus === status
                        ? 'bg-surface text-primary font-semibold'
                        : 'text-secondary hover:bg-surface hover:text-primary'
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="w-full overflow-x-auto my-2">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all rows"
                />
              </TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Transaction / Merchant</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Date & Time</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-secondary">
                  No matching transactions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredActivities.map((act) => {
                const isSelected = Boolean(selectedRows[act.id]);
                return (
                  <TableRow
                    key={act.id}
                    data-state={isSelected ? 'selected' : undefined}
                    className="hover:bg-surface/60 transition-colors"
                  >
                    {/* Checkbox */}
                    <TableCell className="w-10">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleSelectRow(act.id)}
                        aria-label={`Select ${act.invoiceId}`}
                      />
                    </TableCell>

                    {/* Invoice ID */}
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {act.invoiceId}
                    </TableCell>

                    {/* Recipient & Category */}
                    <TableCell>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-primary">{act.name}</p>
                        <p className="text-[11px] text-secondary">{act.category}</p>
                      </div>
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="font-semibold text-xs sm:text-sm text-primary">
                      ${act.amount.toLocaleString()}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusBadge
                        status={mapStatusToBadge(act.status)}
                        label={act.status}
                      />
                    </TableCell>

                    {/* Date & Time */}
                    <TableCell className="text-right text-xs text-secondary whitespace-nowrap">
                      {act.date}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Table Footer: Count and simple pagination controls */}
      <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs text-secondary">
        <span>
          Showing {filteredActivities.length} of {activities.length} entries
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled
            aria-label="Previous page"
            className="w-7 h-7 rounded-full flex items-center justify-center border border-border text-secondary opacity-50 cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled
            aria-label="Next page"
            className="w-7 h-7 rounded-full flex items-center justify-center border border-border text-secondary opacity-50 cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Card>
  );
}

export default RecentActivityTable;
