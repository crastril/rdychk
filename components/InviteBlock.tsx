'use client';

import { useState } from 'react';
import { UserPlus, QrCode, ShareNetwork, ChatCircle, FacebookLogo, InstagramLogo } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QRCode from 'react-qr-code';

interface InviteBlockProps {
    groupName: string;
    url: string;
    memberCount: number;
    isRemote?: boolean;
}

export function InviteBlock({ groupName, url, memberCount, isRemote }: InviteBlockProps) {
    const [qrOpen, setQrOpen] = useState(false);

    const handleShare = (platform: 'whatsapp' | 'messenger' | 'instagram') => {
        const text = `Rejoins mon groupe "${groupName}" sur rdychk !`;
        const encodedText = encodeURIComponent(text);
        const encodedUrl = encodeURIComponent(url);
        switch (platform) {
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodedText}%20${encodedUrl}`, '_blank', 'noopener,noreferrer');
                break;
            case 'messenger':
                window.open(`fb-messenger://share?link=${encodedUrl}`, '_blank', 'noopener,noreferrer');
                break;
            case 'instagram':
                navigator.clipboard.writeText(url).catch(() => {});
                window.location.href = 'instagram://';
                break;
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: `Rejoins ${groupName}`, text: `Rejoins mon groupe "${groupName}" sur rdychk !`, url });
            } catch { /* ignore */ }
        }
    };

    // ── REMOTE / CYBERPUNK VARIANT ──
    if (isRemote) {
        return (
            <>
                <div
                    style={{
                        borderRadius: '4px',
                        border: '1px dashed rgba(168,85,247,0.25)',
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
                                        style={{ borderRadius: '2px', border: '1px dashed rgba(168,85,247,0.25)' }}
                                    >
                                        <UserPlus className="w-3 h-3" style={{ color: 'rgba(168,85,247,0.35)' }} />
                                    </div>
                                ))}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-mono text-[10px] uppercase tracking-[0.2em] leading-none mb-0.5 truncate" style={{ color: '#a78bfa' }}>
                                    {`${memberCount}_PLAYERS · SLOT_AVAILABLE`}
                                </p>
                                <p className="font-mono text-[13px] uppercase tracking-[0.15em] leading-none" style={{ color: '#c4b5fd' }}>
                                    {'> INVITE_PLAYER'}
                                </p>
                            </div>
                        </div>

                        {/* Social buttons */}
                        <div className="grid grid-cols-3 gap-1.5">
                            {[
                                { label: 'WhatsApp', icon: <ChatCircle className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />, action: () => handleShare('whatsapp') },
                                { label: 'Messenger', icon: <FacebookLogo className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />, action: () => handleShare('messenger') },
                                { label: 'Instagram', icon: <InstagramLogo className="w-3.5 h-3.5" style={{ color: '#f472b6' }} />, action: () => handleShare('instagram') },
                            ].map(({ label, icon, action }) => (
                                <button
                                    key={label}
                                    onClick={action}
                                    className="flex items-center justify-center gap-1.5 py-3.5 transition-all duration-150 active:opacity-70"
                                    style={{
                                        borderRadius: '3px',
                                        border: '1px solid rgba(168,85,247,0.15)',
                                        background: 'rgba(8,0,20,0.6)',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)')}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.15)')}
                                >
                                    {icon}
                                    <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: '#a78bfa' }}>{label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                            <button
                                onClick={() => setQrOpen(true)}
                                className="flex items-center justify-center gap-1.5 py-3.5 transition-all duration-150 active:opacity-70"
                                style={{
                                    borderRadius: '3px',
                                    border: '1px solid rgba(168,85,247,0.15)',
                                    background: 'rgba(8,0,20,0.6)',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.15)')}
                            >
                                <QrCode className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
                                <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: '#a78bfa' }}>QR_CODE</span>
                            </button>
                            <button
                                onClick={handleNativeShare}
                                className="flex items-center justify-center gap-1.5 py-3.5 transition-all duration-150 active:opacity-70"
                                style={{
                                    borderRadius: '3px',
                                    border: '1px solid rgba(168,85,247,0.2)',
                                    background: 'rgba(168,85,247,0.06)',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)')}
                            >
                                <ShareNetwork className="w-3.5 h-3.5" style={{ color: '#c4b5fd' }} />
                                <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: '#c4b5fd' }}>PARTAGER</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* QR Dialog — cyberpunk */}
                <Dialog open={qrOpen} onOpenChange={setQrOpen}>
                    <DialogContent
                        className="flex flex-col items-center p-0 overflow-hidden"
                        style={{
                            maxWidth: '340px',
                            width: 'calc(100% - 2rem)',
                            background: 'rgba(8,0,20,0.99)',
                            border: '1px solid rgba(168,85,247,0.3)',
                            borderRadius: '4px',
                            boxShadow: '0 0 40px rgba(168,85,247,0.15)',
                        }}
                    >
                        <div className="w-full h-[2px]" style={{ background: 'linear-gradient(90deg, #a855f7, #d946ef, #6366f1)' }} />
                        <div className="p-6 flex flex-col items-center gap-5">
                            <DialogHeader>
                                <DialogTitle className="font-mono text-[0.8rem] uppercase tracking-[0.2em] text-center" style={{ color: '#c4b5fd' }}>
                                    {'> SCAN_TO_JOIN'}
                                </DialogTitle>
                            </DialogHeader>
                            <div
                                className="p-3"
                                style={{
                                    background: '#fff',
                                    border: '4px solid rgba(168,85,247,0.6)',
                                    borderRadius: '4px',
                                    boxShadow: '0 0 24px rgba(168,85,247,0.3)',
                                }}
                            >
                                <QRCode value={url} size={180} />
                            </div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-center" style={{ color: '#8b5cf6' }}>
                                {groupName}
                            </p>
                        </div>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    // ── IN-PERSON / NEO-BRUTALIST VARIANT ──
    return (
        <>
            <div
                className="rounded-2xl border-[3px] border-dashed overflow-hidden"
                style={{
                    borderColor: 'rgba(251,191,36,0.35)',
                    background: 'rgba(251,191,36,0.03)',
                }}
            >
                <div className="px-4 pt-4 pb-4 flex flex-col gap-3">
                    {/* Header */}
                    <div className="flex items-start gap-3">
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

                    {/* Social buttons */}
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: 'WhatsApp', icon: <ChatCircle className="w-4 h-4 text-green-500" />, action: () => handleShare('whatsapp') },
                            { label: 'Messenger', icon: <FacebookLogo className="w-4 h-4 text-blue-400" />, action: () => handleShare('messenger') },
                            { label: 'Instagram', icon: <InstagramLogo className="w-4 h-4 text-pink-400" />, action: () => handleShare('instagram') },
                        ].map(({ label, icon, action }) => (
                            <button
                                key={label}
                                onClick={action}
                                className="flex items-center justify-center gap-1.5 py-3.5 rounded-xl border-[2.5px] border-black transition-all duration-150 active:translate-y-[1px] active:translate-x-[1px]"
                                style={{ background: '#0c0c0c', boxShadow: '2px 2px 0px #000' }}
                            >
                                {icon}
                                <span
                                    className="text-[11px] font-black uppercase tracking-[0.06em] text-white/70"
                                    style={{ fontFamily: 'var(--font-barlow-condensed)' }}
                                >
                                    {label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setQrOpen(true)}
                            className="flex items-center justify-center gap-1.5 py-3.5 rounded-xl border-[2.5px] border-black transition-all duration-150 active:translate-y-[1px] active:translate-x-[1px]"
                            style={{ background: '#0c0c0c', boxShadow: '2px 2px 0px #000' }}
                        >
                            <QrCode className="w-4 h-4 text-white/50" />
                            <span
                                className="text-[11px] font-black uppercase tracking-[0.06em] text-white/60"
                                style={{ fontFamily: 'var(--font-barlow-condensed)' }}
                            >
                                QR Code
                            </span>
                        </button>
                        <button
                            onClick={handleNativeShare}
                            className="flex items-center justify-center gap-1.5 py-3.5 rounded-xl border-[2.5px] border-black transition-all duration-150 active:translate-y-[1px] active:translate-x-[1px]"
                            style={{ background: '#111', boxShadow: '2px 2px 0px #fbbf24' }}
                        >
                            <ShareNetwork className="w-4 h-4 text-amber-400" />
                            <span
                                className="text-[11px] font-black uppercase tracking-[0.06em] text-amber-400"
                                style={{ fontFamily: 'var(--font-barlow-condensed)' }}
                            >
                                Partager
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* QR Dialog — neo-brutalist */}
            <Dialog open={qrOpen} onOpenChange={setQrOpen}>
                <DialogContent
                    className="flex flex-col items-center p-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f]"
                    style={{ maxWidth: 320, width: 'calc(100% - 2rem)', boxShadow: '5px 5px 0 #000' }}
                >
                    <div className="flex flex-col items-center gap-5 p-6">
                        <DialogHeader>
                            <DialogTitle className="font-black uppercase tracking-widest text-white text-[0.85rem] text-center">
                                Scanner pour rejoindre
                            </DialogTitle>
                        </DialogHeader>
                        <div
                            className="rounded-xl border-2 border-white/20 p-3 bg-white"
                            style={{ boxShadow: '4px 4px 0 #000' }}
                        >
                            <QRCode value={url} size={180} />
                        </div>
                        <p className="font-black uppercase tracking-widest text-center text-[10px] text-white/40">
                            {groupName}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
