import type { ReactNode } from 'react';

export default function JoinLayout({ children }: { children: ReactNode }) {
  return (
    <main className="max-w-3xl mx-auto px-4 py-6 md:py-12">
      {children}
    </main>
  );
}
