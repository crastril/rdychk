'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ShareNetwork, Copy, InstagramLogo, ChatCircle, FacebookLogo, QrCode, Check } from '@phosphor-icons/react';
import QRCode from 'react-qr-code';

interface ShareMenuProps {
    groupName: string;
    url: string;
    variant?: 'icon' | 'button';
    isRemote?: boolean;
}

export function ShareMenu({ groupName, url, variant = 'icon', isRemote }: ShareMenuProps) {
    const [copied, setCopied] = useState(false);
    const [qrOpen, setQrOpen] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const handleShare = (platform: 'whatsapp' | 'messenger' | 'instagram') => {
        const text = `Rejoins mon groupe "${groupName}" sur rdychk !`;
        const encodedText = encodeURIComponent(text);
        const encodedUrl = encodeURIComponent(url);
        let shareUrl = '';
        switch (platform) {
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
                break;
            case 'messenger':
                shareUrl = `fb-messenger://share?link=${encodedUrl}`;
                break;
            case 'instagram':
                handleCopy();
                window.location.href = 'instagram://';
                return;
        }
        if (shareUrl) window.open(shareUrl, '_blank', 'noopener,noreferrer');
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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        {variant === 'icon' ? (
                            <button
                                className="w-8 h-8 flex items-center justify-center transition-colors"
                                style={{ border: '1px solid rgba(168,85,247,0.2)', borderRadius: '2px', background: 'transparent', color: '#8b5cf6' }}
                                onMouseEnter={e => { (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'); (e.currentTarget.style.color = '#c4b5fd'); }}
                                onMouseLeave={e => { (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)'); (e.currentTarget.style.color = '#8b5cf6'); }}
                            >
                                <ShareNetwork className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors"
                                style={{ border: '1px solid rgba(168,85,247,0.2)', borderRadius: '3px', background: 'transparent', color: '#8b5cf6' }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#c4b5fd')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#8b5cf6')}
                            >
                                <ShareNetwork className="w-3.5 h-3.5" />
                                <span>SHARE</span>
                            </button>
                        )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-52 p-1"
                        style={{
                            background: 'rgba(8,0,20,0.99)',
                            border: '1px solid rgba(168,85,247,0.25)',
                            borderRadius: '4px',
                            boxShadow: '0 0 24px rgba(168,85,247,0.12)',
                            color: '#c4b5fd',
                        }}
                    >
                        <div className="px-2 py-1.5">
                            <p className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: '#8b5cf6' }}>INVITE_PLAYER</p>
                        </div>
                        <div className="h-px mx-1 mb-1" style={{ background: 'rgba(168,85,247,0.12)' }} />

                        <button
                            onClick={handleCopy}
                            className="w-full flex items-center gap-2.5 px-2 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors text-left"
                            style={{ borderRadius: '2px', color: copied ? '#4ade80' : '#a78bfa' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(168,85,247,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            {copied ? <Check className="w-3.5 h-3.5 shrink-0" style={{ color: '#4ade80' }} /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                            {copied ? 'LINK_COPIED' : 'COPY_LINK'}
                        </button>

                        <button
                            onClick={() => setQrOpen(true)}
                            className="w-full flex items-center gap-2.5 px-2 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors text-left"
                            style={{ borderRadius: '2px', color: '#a78bfa' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(168,85,247,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            <QrCode className="w-3.5 h-3.5 shrink-0" />
                            QR_CODE
                        </button>

                        <button
                            onClick={handleNativeShare}
                            className="w-full flex items-center gap-2.5 px-2 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors text-left sm:hidden"
                            style={{ borderRadius: '2px', color: '#a78bfa' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(168,85,247,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            <ShareNetwork className="w-3.5 h-3.5 shrink-0" />
                            MORE_OPTIONS
                        </button>

                        <div className="h-px mx-1 my-1" style={{ background: 'rgba(168,85,247,0.08)' }} />

                        <button
                            onClick={() => handleShare('whatsapp')}
                            className="w-full flex items-center gap-2.5 px-2 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors text-left"
                            style={{ borderRadius: '2px', color: '#a78bfa' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(168,85,247,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            <ChatCircle className="w-3.5 h-3.5 shrink-0 text-green-500" />
                            WhatsApp
                        </button>
                        <button
                            onClick={() => handleShare('messenger')}
                            className="w-full flex items-center gap-2.5 px-2 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors text-left"
                            style={{ borderRadius: '2px', color: '#a78bfa' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(168,85,247,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            <FacebookLogo className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                            Messenger
                        </button>
                        <button
                            onClick={() => handleShare('instagram')}
                            className="w-full flex items-center gap-2.5 px-2 py-2 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors text-left"
                            style={{ borderRadius: '2px', color: '#a78bfa' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(168,85,247,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            <InstagramLogo className="w-3.5 h-3.5 shrink-0 text-pink-400" />
                            Instagram
                        </button>
                    </DropdownMenuContent>
                </DropdownMenu>

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
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    {variant === 'icon' ? (
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <ShareNetwork className="w-5 h-5" />
                        </Button>
                    ) : (
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white flex items-center gap-2 px-3 py-1.5 h-auto text-sm">
                            <ShareNetwork className="w-4 h-4" />
                            <span>Partager</span>
                        </Button>
                    )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-panel border-white/10 text-white rounded-2xl">
                    <DropdownMenuLabel className="font-bold text-slate-300">Inviter des amis</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />

                    <DropdownMenuItem onClick={handleCopy} className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white dark:focus:bg-white/10">
                        <Copy className="w-4 h-4" />
                        {copied ? 'Lien copié !' : 'Copier le lien'}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setQrOpen(true)} className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white dark:focus:bg-white/10">
                        <QrCode className="w-4 h-4" />
                        Code QR
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer gap-2 sm:hidden focus:bg-white/10 focus:text-white dark:focus:bg-white/10">
                        <ShareNetwork className="w-4 h-4" />
                        Autres options...
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-white/10" />

                    <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white dark:focus:bg-white/10">
                        <ChatCircle className="w-4 h-4 text-green-500" />
                        WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('messenger')} className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white dark:focus:bg-white/10">
                        <FacebookLogo className="w-4 h-4 text-blue-500" />
                        Messenger
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('instagram')} className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white dark:focus:bg-white/10">
                        <InstagramLogo className="w-4 h-4 text-pink-500" />
                        Instagram
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={qrOpen} onOpenChange={setQrOpen}>
                <DialogContent className="sm:max-w-md glass-panel border-white/10 text-white rounded-3xl p-0 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--v2-primary)] to-[var(--v2-accent)]"></div>
                    <div className="flex flex-col items-center justify-center p-8">
                        <DialogHeader className="mb-4">
                            <DialogTitle className="text-center">Scanner pour rejoindre</DialogTitle>
                        </DialogHeader>
                        <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                            <QRCode value={url} size={200} />
                        </div>
                        <p className="mt-6 text-sm text-center text-slate-400 w-full font-medium">{groupName}</p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
