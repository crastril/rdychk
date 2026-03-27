'use client';

import { cn } from '@/lib/utils';
import { Calendar, Home, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export type GroupTab = 'calendar' | 'home' | 'location';

interface TabItem {
    id: GroupTab;
    label: string;
    icon: React.ReactNode;
}

const TABS: TabItem[] = [
    { id: 'calendar', label: 'Calendrier', icon: <Calendar className="w-5 h-5" /> },
    { id: 'home', label: 'Accueil', icon: <Home className="w-5 h-5" /> },
    { id: 'location', label: 'Lieux', icon: <MapPin className="w-5 h-5" /> },
];

interface GroupTabNavProps {
    activeTab: GroupTab;
    onTabChange: (tab: GroupTab) => void;
    calendarEnabled?: boolean;
    locationEnabled?: boolean;
}

export function GroupTabNav({ activeTab, onTabChange, calendarEnabled = true, locationEnabled = true }: GroupTabNavProps) {
    const activeTabs = TABS.filter(t => {
        if (t.id === 'calendar') return calendarEnabled;
        if (t.id === 'location') return locationEnabled;
        return true;
    });

    if (activeTabs.length <= 1) return null;

    return (
        <>
            {/* Desktop: floating glass component under header */}
            <nav className="hidden sm:flex items-center justify-center w-full max-w-xl mx-auto px-4 py-3">
                <div className="flex items-center gap-1 p-1.5 rounded-2xl frost-glass shadow-2xl relative">
                    {activeTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors duration-300 relative z-10',
                                activeTab === tab.id
                                    ? 'text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="desktop-active-tab"
                                    className="absolute inset-0 rounded-xl bg-white/10 border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md -z-10"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <div className={cn(
                                'transition-all duration-300',
                                activeTab === tab.id ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'scale-100'
                            )}>
                                {tab.icon}
                            </div>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Mobile: floating glass bottom bar */}
            <nav className="sm:hidden fixed bottom-6 left-4 right-4 z-50 transition-all duration-300">
                <div className="frost-glass flex items-stretch h-16 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] px-1 py-1 relative">
                    {activeTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                'flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-300 rounded-xl relative z-10',
                                activeTab === tab.id
                                    ? 'text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="mobile-active-tab"
                                    className="absolute inset-0 rounded-xl bg-white/10 border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.5)] backdrop-blur-md -z-10"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <div className={cn(
                                'transition-all duration-300 transform',
                                activeTab === tab.id ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] -translate-y-0.5' : 'scale-100'
                            )}>
                                {tab.icon}
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wider leading-none transition-all duration-300",
                                activeTab === tab.id ? "opacity-100" : "opacity-70"
                            )}>
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </div>
            </nav>
        </>
    );
}
