'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Threshold for auto-refresh in milliseconds (90 seconds — catches most mobile wake-ups)
const REFRESH_THRESHOLD = 90 * 1000;

interface ConnectionStatusProps {
    onRefresh: () => Promise<void>;
}

export function ConnectionStatus({ onRefresh }: ConnectionStatusProps) {
    const [isOffline, setIsOffline] = useState(false);
    const [lastVisibleTime, setLastVisibleTime] = useState<number>(Date.now());
    const [showRefreshModal, setShowRefreshModal] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        // Handle Online/Offline status
        const handleOnline = () => {
            setIsOffline(false);
            handleSmartRefresh();
        };
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Handle Visibility Change (Tab switch / Mobile wake up)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const now = Date.now();
                const timeDiff = now - lastVisibleTime;

                if (timeDiff > REFRESH_THRESHOLD) {
                    console.log(`User returned after ${timeDiff / 1000}s. Refreshing...`);
                    handleSmartRefresh();
                } else {
                    // Even if short absence, consider a quick silent poll? 
                    // For now, let's stick to the threshold to avoid spamming.
                }
                setLastVisibleTime(now);
            } else {
                setLastVisibleTime(Date.now());
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastVisibleTime]); // Depend on lastVisibleTime to calculate diff correctly

    const handleSmartRefresh = async () => {
        setIsRefreshing(true);
        try {
            await onRefresh();
        } catch (error) {
            console.error("Auto-refresh failed:", error);
            // Optionally show modal if refresh fails critically
            setShowRefreshModal(true);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleManualRefresh = () => {
        window.location.reload();
    };

    if (isOffline) {
        return (
            <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5">
                <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <WifiOff className="h-4 w-4" />
                        <span className="font-medium text-sm">Connexion perdue</span>
                    </div>
                </div>
            </div>
        );
    }

    if (isRefreshing && !showRefreshModal) {
        // Optional: Show a tiny indicator? 
        // For now, let's keep it silent or minimal.
        // Maybe a small spinner top right?
        // User didn't explicitly ask for a spinner, but "updating..." toast was mentioned.
        return (
            <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                <div className="bg-background/80 backdrop-blur-sm border px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in slide-in-from-top-2">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Mise à jour...</span>
                </div>
            </div>
        );
    }

    return (
        <Dialog open={showRefreshModal} onOpenChange={setShowRefreshModal}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Mise à jour nécessaire</DialogTitle>
                    <DialogDescription>
                        Nous n&apos;arrivons pas à récupérer les dernières informations. Veuillez rafraîchir la page.
                    </DialogDescription>
                </DialogHeader>
                <Button onClick={handleManualRefresh} className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Rafraîchir la page
                </Button>
            </DialogContent>
        </Dialog>
    );
}
