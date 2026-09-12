import { useEffect, useState } from 'react';

import { useUiStore } from '@/stores/ui-store';

/**
 * Resolves the actually-rendered color scheme (light or dark), accounting
 * for the 'system' theme setting by watching the OS media query. Chart
 * libraries like Recharts need concrete hex colors, not CSS custom
 * properties, so this is how chart code picks the light/dark palette.
 */
export function useIsDarkMode(): boolean {
  const theme = useUiStore((state) => state.theme);
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return systemPrefersDark;
}
