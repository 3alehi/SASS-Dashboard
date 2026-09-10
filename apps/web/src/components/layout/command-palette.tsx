import {
  Building2,
  ClipboardList,
  Handshake,
  Search,
  Settings,
  SunMoon,
  Target,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';

interface CommandAction {
  id: string;
  label: string;
  group: 'Navigate' | 'Create' | 'Preferences';
  icon: typeof Search;
  run: () => void;
}

export function CommandPalette() {
  const open = useUiStore((state) => state.commandPaletteOpen);
  const setOpen = useUiStore((state) => state.setCommandPaletteOpen);
  const setTheme = useUiStore((state) => state.setTheme);
  const theme = useUiStore((state) => state.theme);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(!open);
      }
      if (event.key === '/' && !open) {
        const target = event.target as HTMLElement;
        const isTyping = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;
        if (!isTyping) {
          event.preventDefault();
          setOpen(true);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  const actions = useMemo<CommandAction[]>(
    () => [
      {
        id: 'create-customer',
        label: 'Create customer',
        group: 'Create',
        icon: Building2,
        run: () => navigate('/app/customers?new=1'),
      },
      {
        id: 'create-lead',
        label: 'Create lead',
        group: 'Create',
        icon: Target,
        run: () => navigate('/app/leads?new=1'),
      },
      {
        id: 'create-deal',
        label: 'Create deal',
        group: 'Create',
        icon: Handshake,
        run: () => navigate('/app/deals?new=1'),
      },
      {
        id: 'create-task',
        label: 'Create task',
        group: 'Create',
        icon: ClipboardList,
        run: () => navigate('/app/tasks?new=1'),
      },
      {
        id: 'goto-settings',
        label: 'Open settings',
        group: 'Navigate',
        icon: Settings,
        run: () => navigate('/app/settings'),
      },
      {
        id: 'toggle-theme',
        label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        group: 'Preferences',
        icon: SunMoon,
        run: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      },
    ],
    [navigate, setTheme, theme],
  );

  const filtered = useMemo(
    () => actions.filter((action) => action.label.toLowerCase().includes(query.toLowerCase())),
    [actions, query],
  );

  function runAction(action: CommandAction) {
    action.run();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[20%] max-w-xl translate-y-0 gap-0 p-0">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              }
              if (event.key === 'Enter' && filtered[activeIndex]) {
                event.preventDefault();
                runAction(filtered[activeIndex]);
              }
            }}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            Esc
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No matching commands.
            </p>
          )}
          {filtered.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => runAction(action)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                  index === activeIndex ? 'bg-accent text-accent-foreground' : 'text-foreground',
                )}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {action.label}
                <span className="ml-auto text-xs text-muted-foreground">{action.group}</span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
