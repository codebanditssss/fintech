'use client';

import { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';

export function ScreenSizeGuard({ children }: { children: React.ReactNode }) {
  const [isScreenTooSmall, setIsScreenTooSmall] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setCurrentWidth(width);
      setIsScreenTooSmall(width < 600);
    };

    checkScreenSize();

    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  if (isScreenTooSmall) {
    return (
      <div className="fixed inset-0 bg-zinc-50 flex items-center justify-center p-6 z-50">
        <div className="max-w-md w-full bg-white rounded-xl border border-zinc-200 shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Monitor className="w-8 h-8 text-zinc-900" />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900 mb-4">
            Screen Size Required
          </h1>
          <p className="text-zinc-600 mb-2">
            This application requires a minimum screen width of <strong>600px</strong>.
          </p>
          <p className="text-sm text-zinc-500">
            Please resize your browser window or use a device with a larger screen.
          </p>
          <div className="mt-6 text-sm text-zinc-400">
            Current width: <span className="font-mono font-semibold">{currentWidth}px</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
