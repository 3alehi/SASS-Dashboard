import { Outlet } from 'react-router-dom';

import { CommandPalette } from '@/components/layout/command-palette';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <MobileNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileBottomNav />
      <CommandPalette />
    </div>
  );
}
