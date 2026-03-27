"use client";

import { cn } from "@/lib/utils";
import { User } from '@phosphor-icons/react';

interface AvatarSelectorProps {
    url?: string | null;
    onSelect: (url: string) => void;
}

const AVATARS = [
    '/avatars/avatar-1.png',
    '/avatars/avatar-2.png',
    '/avatars/avatar-3.png',
    '/avatars/avatar-4.png',
    '/avatars/avatar-5.png',
    '/avatars/avatar-6.png',
    '/avatars/avatar-7.png',
    '/avatars/avatar-8.png',
];

export function AvatarSelector({ url, onSelect }: AvatarSelectorProps) {

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center justify-center mb-2">
                 <div className={cn(
                    "w-24 h-24 rounded-2xl overflow-hidden bg-white/5 border-2 flex items-center justify-center relative transition-all duration-300 shadow-[4px_4px_0px_rgba(0,0,0,0.5)]",
                    "border-white"
                )}>
                    {url ? (
                        <img
                            src={url}
                            alt="Avatar sélectionné"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <User className="w-10 h-10 text-slate-500" />
                    )}
                </div>
            </div>

            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 text-center w-full">
                Choisissez votre avatar
            </p>

            <div className="grid grid-cols-4 gap-3 bg-black/20 p-4 rounded-2xl border border-white/5 w-full">
                {AVATARS.map((avatarUrl, index) => {
                    const isSelected = url === avatarUrl;
                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={() => onSelect(avatarUrl)}
                            className={cn(
                                "relative aspect-square rounded-xl overflow-hidden transition-all duration-200 border-2",
                                isSelected
                                    ? "border-[var(--v2-primary)] scale-110 shadow-[0_0_15px_rgba(255,46,46,0.4)] z-10"
                                    : "border-transparent hover:scale-105 hover:border-white/30 opacity-70 hover:opacity-100"
                            )}
                        >
                            <img
                                src={avatarUrl}
                                alt={`Avatar option ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    )
                })}
            </div>
        </div>
    );
}
