'use client';

import * as React from 'react';
import { flushSync } from 'react-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const toggleTheme = React.useCallback(() => {
    if (isTransitioning) {
      return;
    }

    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';

    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => {
        finished: Promise<void>;
      };
    };

    if (!doc.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    setIsTransitioning(true);

    try {
      const transition = doc.startViewTransition(() => {
        flushSync(() => {
          setTheme(nextTheme);
        });
      });

      transition.finished
        .catch(() => {})
        .finally(() => {
          setIsTransitioning(false);
        });
    } catch {
      setTheme(nextTheme);
      setIsTransitioning(false);
    }
  }, [isTransitioning, resolvedTheme, setTheme]);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" aria-label="Toggle theme" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      disabled={isTransitioning}
      onClick={toggleTheme}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-transform duration-300" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-transform duration-300" />
      )}
    </Button>
  );
}
