'use client';

import { useEffect, useState } from 'react';

export interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    onClose?: () => void;
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            onClose?.();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!isVisible) return null;

    const bgColors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-amber-500'
    };

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };

    return (
        <div className={`fixed top-4 right-4 max-w-sm ${bgColors[type]} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 z-50`}>
            <span className="text-xl font-bold">{icons[type]}</span>
            <p className="font-medium">{message}</p>
        </div>
    );
}
