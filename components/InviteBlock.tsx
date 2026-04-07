'use client';

import { useState } from 'react';
import { Copy, Check, ShareNetwork, UserPlus } from '@phosphor-icons/react';
import { ShareMenu } from '@/components/ShareMenu';

interface InviteBlockProps {
    groupName: string;
    url: string;
    memberCount: number;
    isRemote?: boolean;
}

export function InviteBlock({ groupName, url, memberCount, isRemote }: InviteBlockProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback silent
        }
    };

    const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // ── REMOTE / CYBERPUNK VARIANT ──
    if (isRemote) {
        return (
            <div
                style={{
                    borderRadius: '4px',
                    border: '1px solid rgba(168,85,247,0.25)',
                    borderStyle: 'dashed',
                    background: 'rgba(168,85,247,0.03)',
                    boxShadow: '0 0 16px rgba(168,85,247,0.06)',
                }}
            >
                <div className="px-4 pt-3 pb-3 flex flex-col gap-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 shrink-0">
                            {[0, 1].map(i => (
                                <div
                                    key={i}
                                    className="w-6 h-6 flex items-center justify-center"
                                    style={{
                                        borderRadius: '2px',
                                        border: '1px dashed rgba(168,85,247,0.25)',
                                    }}
                                >
                                    <UserPlus className="w-3 h-3" style={{ color: 'rgba(168,85,247,0.35)' }} />
                                </div>
                            ))}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p
                                className="font-mono text-[10px] uppercase tracking-[0.2em] leading-none mb-0.5 truncate"
                                style={{ color: '#a78bfa' }}
                            >
                                {`${memberCount}_PLAYERS · SLOT_AVAILABLE`}
                            </p>
                            <p
                                className="font-mono text-[13px] uppercase tracking-[0.15em] leading-none"
                                style={{ color: '#c4b5fd' }}
                            >
                                {'> INVITE_PLAYER'}
                            </p>
                        </div>
                    </div>

                    {/* Link + actions row */}
                    <div className="flex items-center gap-2">
                        {/* URL display */}
                        <div
                            className="flex-1 min-w-0 px-3 py-2 overflow-hidden"
                            style={{
                                background: 'rgba(8,0,20,0.6)',
                                border: '1px solid rgba(168,85,247,0.12)',
                                borderRadius: '3px',
                            }}
                        >
                            <p className="font-mono text-[11px] truncate leading-none" style={{ color: '#a78bfa' }}>
                                {`>_ ${displayUrl}`}
                            </p>
                        </div>

                        {/* Copy button */}
                        <button
                            onClick={handleCopy}
                            className="shrink-0 h-8 px-3 flex items-center gap-1.5 transition-all duration-150 active:opacity-70"
                            style={{
                                background: copied ? 'rgba(5,46,22,0.6)' : 'rgba(8,0,20,0.9)',
                                border: `1px solid ${copied ? 'rgba(34,197,94,0.5)' : 'rgba(168,85,247,0.4)'}`,
                                borderRadius: '3px',
                                boxShadow: copied ? '0 0 10px rgba(34,197,94,0.2)' : '0 0 8px rgba(168,85,247,0.1)',
                            }}
                        >
                            {copied
                                ? <Check className="w-3 h-3 shrink-0" style={{ color: '#4ade80' }} />
                                : <Copy className="w-3 h-3 shrink-0" style={{ color: '#a855f7' }} />
                            }
                            <span
                                className="font-mono text-[10px] uppercase tracking-[0.15em]"
                                style={{ color: copied ? '#4ade80' : '#c4b5fd' }}
                            >
                                {copied ? 'COPIED' : 'COPY'}
                            </span>
                        </button>

                        {/* Share */}
                        <div className="shrink-0">
                            <ShareMenu groupName={groupName} url={url} variant="icon" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── IN-PERSON / NEO-BRUTALIST VARIANT ──
    return (
        <div
            className="rounded-2xl border-[3px] border-dashed overflow-hidden"
            style={{
                borderColor: 'rgba(251,191,36,0.35)',
                background: 'rgba(251,191,36,0.03)',
            }}
        >
            <div className="px-4 pt-4 pb-3 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                    {/* Dashed avatar slots — visual "room for more" */}
                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                        {[0, 1].map(i => (
                            <div
                                key={i}
                                className="w-7 h-7 rounded-full border-2 border-dashed border-amber-400/30 flex items-center justify-center"
                            >
                                <UserPlus className="w-3 h-3 text-amber-400/35" />
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p
                            className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-400/55 leading-none mb-1"
                            style={{ fontFamily: 'var(--font-barlow-condensed)' }}
                        >
                            {memberCount} membre{memberCount !== 1 ? 's' : ''} · encore de la place !
                        </p>
                        <p
                            className="text-lg font-black uppercase leading-none text-white"
                            style={{ fontFamily: 'var(--font-barlow-condensed)', letterSpacing: '0.02em' }}
                        >
                            Invite tes amis
                        </p>
                    </div>
                </div>

                {/* Link + actions row */}
                <div className="flex items-center gap-2">
                    {/* URL pill */}
                    <div className="flex-1 min-w-0 bg-black/50 rounded-xl px-3 py-2 border border-white/6 overflow-hidden">
                        <p className="text-[11px] font-mono text-white/35 truncate leading-none">
                            {displayUrl}
                        </p>
                    </div>

                    {/* Copy button */}
                    <button
                        onClick={handleCopy}
                        className="shrink-0 h-9 px-3 rounded-xl border-[2.5px] border-black flex items-center gap-1.5 transition-all duration-150 active:translate-y-[1px] active:translate-x-[1px]"
                        style={{
                            background: copied ? '#052e16' : '#0c0c0c',
                            boxShadow: copied ? '2px 2px 0px #22c55e' : '2px 2px 0px #fbbf24',
                        }}
                    >
                        {copied
                            ? <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                            : <Copy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        }
                        <span
                            className="text-[11px] font-black uppercase tracking-[0.1em]"
                            style={{
                                fontFamily: 'var(--font-barlow-condensed)',
                                color: copied ? '#4ade80' : '#fbbf24',
                            }}
                        >
                            {copied ? 'Copié !' : 'Copier'}
                        </span>
                    </button>

                    {/* More share options */}
                    <div className="shrink-0">
                        <ShareMenu groupName={groupName} url={url} variant="icon" />
                    </div>
                </div>
            </div>
        </div>
    );
}
