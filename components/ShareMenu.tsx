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
import { Share2, Copy, Instagram, MessageCircle, Facebook, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';

interface ShareMenuProps {
    groupName: string;
    url: string;
    variant?: 'icon' | 'button'; // Added variant prop
}

export function ShareMenu({ groupName, url, variant = 'icon' }: ShareMenuProps) {
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

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Rejoins ${groupName}`,
                    text: `Rejoins mon groupe "${groupName}" sur rdychk !`,
                    url: url,
                });
            } catch {
                // Ignore share errors
            }
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    {variant === 'icon' ? (
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <Share2 className="w-5 h-5" />
                        </Button>
                    ) : (
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white flex items-center gap-2 px-3 py-1.5 h-auto text-sm">
                            <Share2 className="w-4 h-4" />
                            <span>Partager</span>
                        </Button>
                    )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Inviter des amis</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleCopy} className="cursor-pointer gap-2">
                        <Copy className="w-4 h-4" />
                        {copied ? 'Lien copié !' : 'Copier le lien'}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setQrOpen(true)} className="cursor-pointer gap-2">
                        <QrCode className="w-4 h-4" />
                        Code QR
                    </DropdownMenuItem>

                    {/* Native share for mobile users preference */}
                    <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer gap-2 sm:hidden">
                        <Share2 className="w-4 h-4" />
                        Autres options...
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="cursor-pointer gap-2">
                        <MessageCircle className="w-4 h-4 text-green-500" />
                        WhatsApp
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleShare('messenger')} className="cursor-pointer gap-2">
                        <Facebook className="w-4 h-4 text-blue-500" />
                        Messenger
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleShare('instagram')} className="cursor-pointer gap-2">
                        <Instagram className="w-4 h-4 text-pink-500" />
                        Instagram
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={qrOpen} onOpenChange={setQrOpen}>
                <DialogContent className="sm:max-w-md flex flex-col items-center justify-center p-8">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-center">Scanner pour rejoindre</DialogTitle>
                    </DialogHeader>
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <QRCode value={url} size={200} />
                    </div>
                    <p className="mt-4 text-sm text-center text-muted-foreground w-full">
                        {groupName}
                    </p>
                </DialogContent>
            </Dialog>
        </>
    );
}
