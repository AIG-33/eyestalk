'use client';

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto animate-slide-up rounded-xl px-5 py-3 shadow-lg text-sm font-medium flex items-center gap-2 max-w-sm"
            style={{
              backgroundColor: t.type === 'success'
                ? 'rgba(0,229,160,0.15)'
                : t.type === 'error'
                  ? 'rgba(255,71,87,0.15)'
                  : 'rgba(124,111,247,0.15)',
              color: t.type === 'success'
                ? 'var(--accent-success)'
                : t.type === 'error'
                  ? 'var(--accent-error)'
                  : 'var(--accent-light)',
              border: `1px solid ${
                t.type === 'success'
                  ? 'rgba(0,229,160,0.3)'
                  : t.type === 'error'
                    ? 'rgba(255,71,87,0.3)'
                    : 'rgba(124,111,247,0.3)'
              }`,
              backdropFilter: 'blur(12px)',
            }}
          >
            <span>
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
