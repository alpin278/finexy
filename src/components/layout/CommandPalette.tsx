import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { cn } from '../../lib/utils';
import type { FinexyAction } from '../../lib/interaction-actions';

export interface PaletteCommand {
  id: string;
  label: string;
  group: 'Navigate' | 'Quick actions';
  icon: string;
  keywords?: string;
  shortcut?: string;
  route: string;
  action?: FinexyAction;
}

export function CommandPalette({ open, commands, onClose, onExecute }: { open: boolean; commands: PaletteCommand[]; onClose: () => void; onExecute: (command: PaletteCommand) => void }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? commands.filter((command) => `${command.label} ${command.group} ${command.keywords ?? ''}`.toLowerCase().includes(term)) : commands;
  }, [commands, query]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const execute = (command: PaletteCommand | undefined) => {
    if (!command) return;
    onExecute(command);
    onClose();
  };

  return <Modal isOpen={open} onClose={onClose} title="Command palette" description="Navigate or start a task without leaving the keyboard." maxWidth="lg">
    <div className="-m-1">
      <div className="relative">
        <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
        <input ref={inputRef} value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={(event) => {
          if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => filtered.length ? (index + 1) % filtered.length : 0); }
          else if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => filtered.length ? (index - 1 + filtered.length) % filtered.length : 0); }
          else if (event.key === 'Enter') { event.preventDefault(); execute(filtered[activeIndex]); }
          else if (event.key === 'Escape') { event.preventDefault(); onClose(); }
        }} aria-label="Search commands" aria-controls="finexy-command-list" aria-activedescendant={filtered[activeIndex] ? `finexy-command-${filtered[activeIndex].id}` : undefined} role="combobox" aria-expanded="true" aria-autocomplete="list" placeholder="Search pages and actions…" className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm text-primary outline-none transition-[border-color,box-shadow] focus:border-accent focus:ring-2 focus:ring-accent/15" />
      </div>
      <div id="finexy-command-list" role="listbox" aria-label="Commands" className="mt-3 max-h-[min(50vh,380px)] space-y-1 overflow-y-auto">
        {filtered.map((command, index) => <button id={`finexy-command-${command.id}`} key={command.id} type="button" role="option" aria-selected={index === activeIndex} onMouseEnter={() => setActiveIndex(index)} onClick={() => execute(command)} className={cn('flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-[background-color,border-color,color] duration-150', index === activeIndex ? 'border-accent/20 bg-accent/[0.07]' : 'border-transparent hover:bg-surface')}>
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', index === activeIndex ? 'bg-accent text-white' : 'bg-surface text-secondary')}><Icon name={command.icon} /></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-primary">{command.label}</span><span className="block text-[10px] font-medium uppercase tracking-[0.1em] text-secondary">{command.group}</span></span>
          {command.shortcut && <kbd className="rounded-md border border-border bg-white px-1.5 py-0.5 text-[10px] font-semibold text-secondary">{command.shortcut}</kbd>}
        </button>)}
        {!filtered.length && <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center"><Icon name="search" className="text-secondary" /><p className="mt-2 text-sm font-semibold text-primary">No matching commands</p><p className="mt-1 text-xs text-secondary">Try a page name or financial action.</p></div>}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-[10px] text-secondary"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div>
    </div>
  </Modal>;
}
