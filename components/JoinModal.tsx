'use client';

import { useState } from 'react';

interface JoinModalProps {
    onJoin: (name: string) => void;
    groupName?: string;
}

export default function JoinModal({ onJoin, groupName }: JoinModalProps) {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onJoin(name.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="glass-strong rounded-3xl p-8 max-w-md w-full shadow-2xl animate-slide-up">
                <div className="text-center mb-6">
                    <div className="text-6xl mb-4">👋</div>
                    <h2 className="text-3xl font-extrabold text-white mb-2">
                        Bienvenue !
                    </h2>
                    {groupName && (
                        <p className="text-white/80 text-lg mb-2">
                            Groupe : <span className="font-semibold">{groupName}</span>
                        </p>
                    )}
                    <p className="text-white/70">
                        Entre ton prénom pour rejoindre
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ton prénom"
                        className="w-full px-6 py-4 text-lg bg-white/20 border-2 border-white/30 rounded-2xl
                     text-white placeholder-white/50
                     focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/20
                     transition-all backdrop-blur-sm"
                        autoFocus
                        maxLength={20}
                    />

                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full px-6 py-4 text-xl font-bold text-white
                     bg-gradient-to-r from-purple-500 to-blue-500
                     rounded-2xl
                     hover:from-purple-600 hover:to-blue-600
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-300 transform active:scale-95
                     shadow-lg hover:shadow-xl"
                    >
                        Rejoindre 🚀
                    </button>
                </form>

                <p className="text-center text-white/50 text-sm mt-6">
                    Ton nom sera visible par tous les membres du groupe
                </p>
            </div>
        </div>
    );
}
