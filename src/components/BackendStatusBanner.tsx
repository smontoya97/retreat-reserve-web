import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface BackendStatusBannerProps {
    status: 'online' | 'degraded' | 'offline';
    message: string | null;
    onRetry?: () => void;
}

export const BackendStatusBanner: React.FC<BackendStatusBannerProps> = ({ status, message, onRetry }) => {
    if (status === 'online' || !message) {
        return null;
    }

    return (
        <div className="border-b border-amber-200 bg-amber-50 text-amber-900" role="status" aria-live="polite">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{message}</span>
                </div>
                {onRetry ? (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="inline-flex items-center gap-1 self-start rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800 transition hover:bg-amber-100"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Reintentar
                    </button>
                ) : null}
            </div>
        </div>
    );
};
