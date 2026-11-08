'use client';
import { createContext, useContext, useState, useSyncExternalStore } from 'react';
import { createDemoState, parseDemoState, type DemoState } from '@/lib/demo-model';

function createStore(today: string) {
  const initial = createDemoState(today);
  let current = initial,
    loaded = false;
  const listeners = new Set<() => void>();
  const key = `barber-luke-demo-v1:${today}`;
  return {
    getSnapshot: () => current,
    getServerSnapshot: () => initial,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      if (!loaded) {
        loaded = true;
        try {
          const stored = sessionStorage.getItem(key);
          if (stored) {
            const parsed = parseDemoState(JSON.parse(stored));
            if (parsed.success) {
              current = parsed.data;
              listener();
            }
          }
        } catch {}
      }
      return () => {
        listeners.delete(listener);
      };
    },
    update: (change: (state: DemoState) => DemoState) => {
      current = change(current);
      try {
        sessionStorage.setItem(key, JSON.stringify(current));
      } catch {}
      listeners.forEach((l) => l());
    },
    reset: () => {
      current = createDemoState(today);
      try {
        sessionStorage.removeItem(key);
      } catch {}
      listeners.forEach((l) => l());
    },
  };
}
type Store = ReturnType<typeof createStore>;
const DemoContext = createContext<{
  state: DemoState;
  store: Store;
  today: string;
  now: string;
} | null>(null);
export function DemoProvider({
  today,
  now,
  children,
}: {
  today: string;
  now: string;
  children: React.ReactNode;
}) {
  const [store] = useState(() => createStore(today));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return (
    <DemoContext.Provider value={{ state, store, today, now }}>{children}</DemoContext.Provider>
  );
}
export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error('DemoProvider requerido');
  return context;
}
