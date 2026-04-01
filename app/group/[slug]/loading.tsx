export default function GroupLoading() {
    return (
        <div
            className="text-slate-100 min-h-screen flex flex-col items-center"
            style={{ background: 'radial-gradient(circle at center, #2e0808, #0a0101)' }}
        >
            {/* ── NAV ── */}
            <nav className="w-full border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
                    <span className="text-2xl font-black tracking-tighter text-white">
                        rdychk<span style={{ color: 'var(--v2-primary)' }}>.</span>
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/8 animate-pulse" />
                </div>
            </nav>

            <div className="w-full max-w-xl mx-auto flex flex-col gap-4 p-4 mt-2 pb-12">

                {/* ── GROUP HEADER ── */}
                <div className="flex items-center gap-3">
                    <div
                        className="h-7 rounded-xl bg-white/5 animate-pulse flex-1"
                        style={{ animationDelay: '0ms' }}
                    />
                    <div
                        className="h-9 w-24 rounded-xl bg-white/5 animate-pulse shrink-0"
                        style={{ animationDelay: '50ms' }}
                    />
                </div>

                {/* ── STATUS STRIP ── */}
                <div className="flex items-center gap-2 px-0.5">
                    <div
                        className="h-7 w-28 rounded-full bg-white/5 animate-pulse"
                        style={{ animationDelay: '80ms' }}
                    />
                    <div
                        className="h-7 w-24 rounded-full bg-white/5 animate-pulse"
                        style={{ animationDelay: '130ms' }}
                    />
                </div>

                {/* ── HEROBLOCK ── */}
                <div
                    className="flex flex-col w-full rounded-2xl"
                    style={{ boxShadow: '5px 5px 0px #000' }}
                >
                    {/* Progress header bar */}
                    <div
                        className="h-11 flex items-center gap-3 px-4 rounded-t-2xl border-x-[3px] border-t-[3px] border-black"
                        style={{ background: '#0f0f0f' }}
                    >
                        <div
                            className="h-2.5 w-16 rounded bg-white/8 animate-pulse shrink-0"
                            style={{ animationDelay: '160ms' }}
                        />
                        <div
                            className="flex-1 h-[5px] rounded-full bg-white/5 animate-pulse"
                            style={{ animationDelay: '200ms' }}
                        />
                        <div
                            className="h-2.5 w-8 rounded bg-white/8 animate-pulse shrink-0"
                            style={{ animationDelay: '160ms' }}
                        />
                    </div>
                    {/* Ready button */}
                    <div
                        className="h-[4.75rem] rounded-b-2xl border-x-[3px] border-b-[3px] border-black flex flex-col items-center justify-center gap-1.5"
                        style={{ background: '#111' }}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-5 h-5 rounded bg-white/5 animate-pulse"
                                style={{ animationDelay: '240ms' }}
                            />
                            <div
                                className="h-3.5 w-44 rounded bg-white/5 animate-pulse"
                                style={{ animationDelay: '240ms' }}
                            />
                        </div>
                        <div
                            className="h-2.5 w-52 rounded bg-white/[0.03] animate-pulse"
                            style={{ animationDelay: '280ms' }}
                        />
                    </div>
                </div>

                {/* ── PRÉVOIR MON DÉPART ── */}
                <div
                    className="h-12 rounded-2xl border-2 border-white/8 flex items-center gap-3 px-4"
                    style={{ background: '#0c0c0c', boxShadow: '3px 3px 0px #000' }}
                >
                    <div
                        className="w-3.5 h-3.5 rounded bg-white/5 animate-pulse shrink-0"
                        style={{ animationDelay: '300ms' }}
                    />
                    <div
                        className="h-2.5 w-32 rounded bg-white/5 animate-pulse flex-1"
                        style={{ animationDelay: '300ms' }}
                    />
                    <div
                        className="w-3.5 h-3.5 rounded bg-white/5 animate-pulse shrink-0"
                        style={{ animationDelay: '300ms' }}
                    />
                </div>

                {/* ── MEMBERS COMPACT ── */}
                <div
                    className="flex items-center gap-1.5 px-4 py-3 rounded-2xl border-2 border-white/8"
                    style={{ background: '#0c0c0c', boxShadow: '3px 3px 0px #000' }}
                >
                    {[0, 1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            className="w-8 h-8 rounded-full bg-white/5 animate-pulse shrink-0"
                            style={{ animationDelay: `${340 + i * 35}ms` }}
                        />
                    ))}
                    <div className="flex-1" />
                    <div
                        className="h-2.5 w-12 rounded bg-white/5 animate-pulse"
                        style={{ animationDelay: '520ms' }}
                    />
                    <div
                        className="w-3 h-3 rounded bg-white/5 animate-pulse shrink-0"
                        style={{ animationDelay: '540ms' }}
                    />
                </div>

                {/* ── ACTION CARDS ── */}
                <div className="grid grid-cols-2 gap-3">
                    {[0, 1].map(i => (
                        <div
                            key={i}
                            className="flex flex-col gap-1 p-3.5 rounded-2xl border-2 border-white/8"
                            style={{
                                background: '#0c0c0c',
                                boxShadow: '3px 3px 0px #000',
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <div
                                        className="w-3.5 h-3.5 rounded bg-white/5 animate-pulse"
                                        style={{ animationDelay: `${560 + i * 60}ms` }}
                                    />
                                    <div
                                        className="h-2.5 w-14 rounded bg-white/5 animate-pulse"
                                        style={{ animationDelay: `${580 + i * 60}ms` }}
                                    />
                                </div>
                                <div
                                    className="w-3 h-3 rounded bg-white/5 animate-pulse"
                                    style={{ animationDelay: `${580 + i * 60}ms` }}
                                />
                            </div>
                            <div
                                className="h-[18px] w-28 rounded bg-white/5 animate-pulse mt-0.5"
                                style={{ animationDelay: `${620 + i * 60}ms` }}
                            />
                            <div
                                className="h-2.5 w-20 rounded bg-white/[0.03] animate-pulse"
                                style={{ animationDelay: `${660 + i * 60}ms` }}
                            />
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
