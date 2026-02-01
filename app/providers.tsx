'use client';

import { GeistProvider, CssBaseline } from '@geist-ui/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GeistProvider>
      <CssBaseline />
      {children}
    </GeistProvider>
  );
}

