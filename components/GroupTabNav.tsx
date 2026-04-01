'use client';

import { cn } from '@/lib/utils';
import { CalendarBlank, House, MapPin } from '@phosphor-icons/react';

export type GroupTab = 'calendar' | 'home' | 'location';

type PhosphorIcon = React.ComponentType<{ className?: string; weight?: 'fill' | 'regular' | 'bold' | 'duotone' | 'light' | 'thin' }>;

interface TabItem {
    id: GroupTab;
    label: string;
    icon: PhosphorIcon;
}

const TABS: TabItem[] = [
    { id: 'calendar', label: 'Calendrier', icon: CalendarBlank },
    { id: 'home',     label: 'Accueil',    icon: House },
    { id: 'location', label: 'Lieux',      icon: MapPin },
];

interface GroupTabNavProps {
    activeTab: GroupTab;
    onTabChange: (tab: GroupTab) => void;
    calendarEnabled?: boolean;
    locationEnabled?: boolean;
}

export function GroupTabNav({ activeTab, onTabChange, calendarEnabled = true, locationEnabled = true }: GroupTabNavProps) {
    const visibleTabs = TABS.filter(t => {
        if (t.id === 'calendar') return calendarEnabled;
        if (t.id === 'location') return locationEnabled;
        return true;
    });

    if (visibleTabs.length <= 1) return null;

    return (
        <>
            {/* ── Desktop ── */}
            <nav className="hidden sm:flex items-center justify-center w-full max-w-xl mx-auto px-4 py-3">
                <div className="flex items-center gap-2 p-1.5 bg-[#0c0c0c] border-2 border-white/12 rounded-2xl shadow-[4px_4px_0px_#000]">
                    {visibleTabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={cn(
                                    'relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.18em] transition-all duration-100 select-none',
                                    active
                                        ? [
                                            'bg-[var(--v2-primary)] text-white',
                                            'border-2 border-black/80',
                                            'shadow-[3px_3px_0px_rgba(0,0,0,0.85)]',
                                            '-translate-x-px -translate-y-px',
                                          ]
                                        : [
                                            'text-white/35 border-2 border-transparent',
                                            'hover:text-white/65 hover:bg-white/5 hover:border-white/10',
                                            'active:translate-y-px',
                                          ]
                                )}
                            >
                                <Icon
                                    className={cn('w-4 h-4 transition-transform duration-100', active && 'scale-110')}
                                    weight={active ? 'fill' : 'regular'}
                                />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* ── Mobile bottom bar ── */}
            <nav className="sm:hidden fixed bottom-5 left-3 right-3 z-50">
                {/* outer hard-shadow frame */}
                <div
                    className="flex items-stretch gap-1.5 p-1.5 rounded-2xl"
                    style={{
                        background: '#0c0c0c',
                        border: '2px solid rgba(255,255,255,0.1)',
                        boxShadow: '5px 5px 0px #000, inset 0 1px 0 rgba(255,255,255,0.06)',
                    }}
                >
                    {visibleTabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={cn(
                                    'flex-1 flex flex-col items-center justify-center gap-1 rounded-xl h-14 transition-all duration-100 select-none',
                                    active
                                        ? [
                                            'bg-[var(--v2-primary)] text-white',
                                            'border-2 border-black/80',
                                            'shadow-[2px_2px_0px_rgba(0,0,0,0.9)]',
                                            '-translate-x-px -translate-y-px',
                                          ]
                                        : [
                                            'text-white/35 border-2 border-transparent',
                                            'hover:text-white/60 hover:bg-white/5',
                                            'active:translate-y-px active:shadow-none',
                                          ]
                                )}
                            >
                                <Icon
                                    className={cn('w-5 h-5 transition-transform duration-100', active && 'scale-110')}
                                    weight={active ? 'fill' : 'regular'}
                                />
                                <span className="text-[8.5px] font-black uppercase tracking-[0.16em] leading-none">
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
