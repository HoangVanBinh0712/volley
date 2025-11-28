'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast, { ToastProps } from './Toast';

interface ToastMessage extends ToastProps {
    id: string;
}

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((
        message: string,
        type: 'success' | 'error' | 'info' | 'warning' = 'success',
        duration: number = 3000
    ) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: ToastMessage = { id, message, type, duration };
        
        setToasts(prev => [...prev, newToast]);

        const timer = setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);

        return () => clearTimeout(timer);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 right-4 space-y-2 z-50 pointer-events-none">
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            duration={toast.duration}
                            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
