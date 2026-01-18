'use client';

import { useState } from 'react';
import { Icons } from './Icons';

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
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="glass-strong rounded-3xl p-8 max-w-md w-full shadow-2xl animate-slide-up border-2 border-slate-600/50">
                <div className="text-center mb-6">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-violet-500 to-blue-500 rounded-full flex items-center justify-center">
                        <Icons.User className="w-10 h-10 text-white" />
                    </div>
                    <h2 id="modal-title" className="text-3xl font-extrabold text-slate-50 mb-2">
                        Bienvenue !
                    </h2>
                    {groupName && (
                        <p className="text-slate-300 text-lg mb-2">
                            Groupe : <span className="font-semibold text-white">{groupName}</span>
                        </p>
                    )}
                    <p className="text-slate-400">
                        Entre ton prénom pour rejoindre
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <label htmlFor="name-input" className="sr-only">
                        Votre prénom
                    </label>
                    <input
                        id="name-input"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ton prénom"
                        className="w-full px-6 py-4 text-lg bg-slate-700 border-2 border-slate-600 rounded-2xl
                     text-slate-50 placeholder-slate-400
                     focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50
                     transition-all"
                        autoFocus
                        maxLength={20}
                        required
                    />

                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full px-6 py-4 text-xl font-bold text-white
                     bg-gradient-to-r from-violet-500 to-blue-500
                     rounded-2xl
                     hover:from-violet-600 hover:to-blue-600
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-300 transform active:scale-95
                     shadow-lg hover:shadow-xl hover:shadow-violet-500/30
                     flex items-center justify-center gap-2"
                        aria-label="Rejoindre le groupe"
                    >
                        Rejoindre
                        <Icons.Sparkles className="w-5 h-5" />
                    </button>
                </form>

                <p className="text-center text-slate-500 text-sm mt-6">
                    Ton nom sera visible par tous les membres du groupe
                </p>
            </div>
        </div>
    );
}
