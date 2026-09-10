import { LogOut, Moon, Settings, Sun, SunMoon, User } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUiStore } from '@/stores/ui-store';

const MOCK_USER = {
  name: 'Amir Salehi',
  email: 'amir@northwindretail.com',
};

export function UserMenu() {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  const initials = MOCK_USER.name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {MOCK_USER.name}
            </span>
            <span className="truncate text-xs text-muted-foreground">{MOCK_USER.email}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-60">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2">
          <User className="h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs">Appearance</DropdownMenuLabel>
        <DropdownMenuItem className="gap-2" onSelect={() => setTheme('light')}>
          <Sun className="h-4 w-4" />
          Light {theme === 'light' && '✓'}
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onSelect={() => setTheme('dark')}>
          <Moon className="h-4 w-4" />
          Dark {theme === 'dark' && '✓'}
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onSelect={() => setTheme('system')}>
          <SunMoon className="h-4 w-4" />
          System {theme === 'system' && '✓'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
