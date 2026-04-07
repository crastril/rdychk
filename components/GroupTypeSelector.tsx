import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useId } from 'react';
import { cn } from '@/lib/utils';
import { Monitor, MapPin } from '@phosphor-icons/react';

interface GroupTypeSelectorProps {
    value: 'remote' | 'in_person';
    onValueChange: (value: 'remote' | 'in_person') => void;
    disabled?: boolean;
    idPrefix?: string;
    isRemote?: boolean;
}

export function GroupTypeSelector({ value, onValueChange, disabled = false, idPrefix, isRemote }: GroupTypeSelectorProps) {
    const generatedId = useId();
    const baseId = idPrefix || generatedId;

    // ── CYBERPUNK VARIANT ────────────────────────────────────────────────────
    if (isRemote) {
        return (
            <div className="flex flex-col gap-2">
                {/* Remote option */}
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && onValueChange('remote')}
                    className="flex items-center gap-3 px-3 py-3 text-left transition-all"
                    style={{
                        border: `1px solid ${value === 'remote' ? 'rgba(168,85,247,0.5)' : 'rgba(168,85,247,0.12)'}`,
                        borderRadius: '3px',
                        background: value === 'remote' ? 'rgba(168,85,247,0.1)' : 'rgba(168,85,247,0.02)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.6 : 1,
                    }}
                    onMouseEnter={e => {
                        if (!disabled && value !== 'remote') {
                            e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)';
                            e.currentTarget.style.background = 'rgba(168,85,247,0.05)';
                        }
                    }}
                    onMouseLeave={e => {
                        if (value !== 'remote') {
                            e.currentTarget.style.borderColor = 'rgba(168,85,247,0.12)';
                            e.currentTarget.style.background = 'rgba(168,85,247,0.02)';
                        }
                    }}
                >
                    {/* Radio indicator */}
                    <div
                        className="w-4 h-4 flex items-center justify-center shrink-0"
                        style={{
                            border: `1px solid ${value === 'remote' ? 'rgba(168,85,247,0.8)' : 'rgba(168,85,247,0.25)'}`,
                            borderRadius: '2px',
                            background: 'transparent',
                        }}
                    >
                        {value === 'remote' && (
                            <div
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '1px',
                                    background: '#a855f7',
                                    boxShadow: '0 0 6px rgba(168,85,247,0.8)',
                                }}
                            />
                        )}
                    </div>

                    {/* Icon */}
                    <div
                        className="w-8 h-8 flex items-center justify-center shrink-0"
                        style={{
                            border: `1px solid ${value === 'remote' ? 'rgba(168,85,247,0.4)' : 'rgba(168,85,247,0.15)'}`,
                            borderRadius: '2px',
                            background: value === 'remote' ? 'rgba(168,85,247,0.12)' : 'transparent',
                        }}
                    >
                        <Monitor className="w-4 h-4" style={{ color: value === 'remote' ? '#a855f7' : '#8b5cf6' }} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm" style={{ color: value === 'remote' ? '#c4b5fd' : '#a78bfa' }}>
                            REMOTE
                        </p>
                        <p className="font-mono" style={{ fontSize: '10px', color: '#8b5cf6' }}>
                            {'// appels vidéo · jeux en ligne'}
                        </p>
                    </div>
                </button>

                {/* In-person option */}
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && onValueChange('in_person')}
                    className="flex items-center gap-3 px-3 py-3 text-left transition-all"
                    style={{
                        border: `1px solid ${value === 'in_person' ? 'rgba(248,113,113,0.4)' : 'rgba(168,85,247,0.12)'}`,
                        borderRadius: '3px',
                        background: value === 'in_person' ? 'rgba(248,113,113,0.06)' : 'rgba(168,85,247,0.02)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.6 : 1,
                    }}
                    onMouseEnter={e => {
                        if (!disabled && value !== 'in_person') {
                            e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)';
                            e.currentTarget.style.background = 'rgba(168,85,247,0.05)';
                        }
                    }}
                    onMouseLeave={e => {
                        if (value !== 'in_person') {
                            e.currentTarget.style.borderColor = 'rgba(168,85,247,0.12)';
                            e.currentTarget.style.background = 'rgba(168,85,247,0.02)';
                        }
                    }}
                >
                    {/* Radio indicator */}
                    <div
                        className="w-4 h-4 flex items-center justify-center shrink-0"
                        style={{
                            border: `1px solid ${value === 'in_person' ? 'rgba(248,113,113,0.7)' : 'rgba(168,85,247,0.25)'}`,
                            borderRadius: '2px',
                            background: 'transparent',
                        }}
                    >
                        {value === 'in_person' && (
                            <div
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '1px',
                                    background: '#f87171',
                                    boxShadow: '0 0 6px rgba(248,113,113,0.7)',
                                }}
                            />
                        )}
                    </div>

                    {/* Icon */}
                    <div
                        className="w-8 h-8 flex items-center justify-center shrink-0"
                        style={{
                            border: `1px solid ${value === 'in_person' ? 'rgba(248,113,113,0.35)' : 'rgba(168,85,247,0.15)'}`,
                            borderRadius: '2px',
                            background: value === 'in_person' ? 'rgba(248,113,113,0.08)' : 'transparent',
                        }}
                    >
                        <MapPin className="w-4 h-4" style={{ color: value === 'in_person' ? '#f87171' : '#8b5cf6' }} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm" style={{ color: value === 'in_person' ? '#fca5a5' : '#a78bfa' }}>
                            IN_PERSON
                        </p>
                        <p className="font-mono" style={{ fontSize: '10px', color: '#8b5cf6' }}>
                            {'// lieu physique · rencontre IRL'}
                        </p>
                    </div>
                </button>
            </div>
        );
    }

    // ── NEO-BRUTALIST VARIANT ────────────────────────────────────────────────
    return (
        <RadioGroup
            value={value}
            onValueChange={(val: string) => onValueChange(val as 'remote' | 'in_person')}
            className="flex flex-col gap-4"
            disabled={disabled}
        >
            {/* Remote Option - Purple Theme */}
            <div
                className={cn(
                    "flex items-center space-x-4 border p-4 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group/item",
                    value === 'remote'
                        ? "bg-purple-500/10 border-purple-500/40 shadow-[0_0_20px_rgba(217,70,239,0.1)]"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                )}
                onClick={() => !disabled && onValueChange('remote')}
            >
                <div className={cn(
                    "flex items-center justify-center size-10 rounded-xl transition-colors",
                    value === 'remote' ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-slate-400"
                )}>
                    <Monitor className="size-5" />
                </div>

                <div className="flex-1 cursor-pointer">
                    <Label htmlFor={`${baseId}-remote`} className={cn(
                        "cursor-pointer font-bold text-base transition-colors",
                        value === 'remote' ? "text-purple-300" : "text-slate-200"
                    )}>
                        À distance
                    </Label>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Idéal pour les appels vidéos ou jeux en ligne.
                    </p>
                </div>

                <RadioGroupItem
                    value="remote"
                    id={`${baseId}-remote`}
                    className={cn(
                        "transition-all duration-300",
                        value === 'remote'
                            ? "text-purple-400 border-purple-500/50 fill-purple-400"
                            : "border-white/20"
                    )}
                />
            </div>

            {/* In Person Option - Red Theme */}
            <div
                className={cn(
                    "flex items-center space-x-4 border p-4 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group/item",
                    value === 'in_person'
                        ? "bg-red-500/10 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                )}
                onClick={() => !disabled && onValueChange('in_person')}
            >
                <div className={cn(
                    "flex items-center justify-center size-10 rounded-xl transition-colors",
                    value === 'in_person' ? "bg-red-500/20 text-red-400" : "bg-white/5 text-slate-400"
                )}>
                    <MapPin className="size-5" />
                </div>

                <div className="flex-1 cursor-pointer">
                    <Label htmlFor={`${baseId}-in_person`} className={cn(
                        "cursor-pointer font-bold text-base transition-colors",
                        value === 'in_person' ? "text-red-300" : "text-slate-200"
                    )}>
                        Sur place
                    </Label>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Définissez un lieu physique pour vous retrouver.
                    </p>
                </div>

                <RadioGroupItem
                    value="in_person"
                    id={`${baseId}-in_person`}
                    className={cn(
                        "transition-all duration-300",
                        value === 'in_person'
                            ? "text-red-400 border-red-500/50 fill-red-400"
                            : "border-white/20"
                    )}
                />
            </div>
        </RadioGroup>
    );
}
