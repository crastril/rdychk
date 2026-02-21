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
import { Share2, Copy, Instagram, MessageCircle, Facebook } from 'lucide-react';

interface ShareMenuProps {
    groupName: string;
    url: string;
}

export function ShareMenu({ groupName, url }: ShareMenuProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            // We'll use a simple alert or toast if available, or just the state change
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
                // Messenger typically only allows sharing a link, not pre-filled text easily via web URL scheme without SDK
                // FB Messenger sharing is tricky via URL, often just fb-messenger://share/?link=... on mobile
                // or http://www.facebook.com/dialog/send?app_id=...&link=...&redirect_uri=...
                // Simpler fallback might be just copying or using generic share API if on mobile.
                // For now, we'll try a generic fb link or just copy for them if it's complex.
                // Actually, mobile only: fb-messenger://share?link=${encodedUrl}
                shareUrl = `fb-messenger://share?link=${encodedUrl}`;
                break;
            case 'instagram':
                // Instagram doesn't support web sharing URL directly to DMs easily.
                // We'll copy the link and open Instagram.
                handleCopy();
                window.location.href = 'instagram://'; // Try to open app
                return;
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
        }
    };

    // Use Web Share API if available (mobile mostly)
    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Rejoins ${groupName}`,
                    text: `Rejoins mon groupe "${groupName}" sur rdychk !`,
                    url: url,
                });
            } catch (err) {
                console.log('Error sharing', err);
            }
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Partager
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Inviter des amis</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleCopy} className="cursor-pointer gap-2">
                    <Copy className="w-4 h-4" />
                    {copied ? 'Lien copié !' : 'Copier le lien'}
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
    );
}
