"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { AuthButton } from "@/components/auth-button";

export function Navbar() {
    return (
        <header className="fixed top-0 w-full z-50 border-b bg-background/80 backdrop-blur-sm support-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
                <Link href="/" className="flex items-center gap-2 font-bold transition-opacity hover:opacity-90">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                        <Sparkles className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="hidden leading-none sm:inline-block">rdychk</span>
                </Link>
                <div className="flex items-center gap-2">
                    <ModeToggle />
                    <AuthButton view="icon" />
                </div>
            </div>
        </header>
    );
}
