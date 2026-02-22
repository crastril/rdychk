'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useId } from 'react';
import { cn } from '@/lib/utils';

interface GroupTypeSelectorProps {
    value: 'remote' | 'in_person';
    onValueChange: (value: 'remote' | 'in_person') => void;
    disabled?: boolean;
    idPrefix?: string;
}

export function GroupTypeSelector({ value, onValueChange, disabled = false, idPrefix }: GroupTypeSelectorProps) {
    const generatedId = useId();
    const baseId = idPrefix || generatedId;

    return (
        <RadioGroup
            value={value}
            onValueChange={(val: string) => onValueChange(val as 'remote' | 'in_person')}
            className="flex flex-col gap-4"
            disabled={disabled}
        >
            <div
                className={cn(
                    "flex items-center space-x-3 border p-4 rounded-2xl cursor-pointer transition-all",
                    value === 'remote' ? "bg-[var(--v2-primary)]/10 border-[var(--v2-primary)]/30" : "bg-white/5 border-white/5 hover:bg-white/10"
                )}
                onClick={() => !disabled && onValueChange('remote')}
            >
                <RadioGroupItem
                    value="remote"
                    id={`${baseId}-remote`}
                    className="text-[var(--v2-primary)] border-white/20"
                />
                <div className="flex-1 cursor-pointer">
                    <Label htmlFor={`${baseId}-remote`} className="cursor-pointer font-bold text-white">À distance</Label>
                    <p className="text-xs text-slate-400 mt-1">
                        Pas de lieu physique. Idéal pour des appels vidéo ou jeux en ligne.
                    </p>
                </div>
            </div>
            <div
                className={cn(
                    "flex items-center space-x-3 border p-4 rounded-2xl cursor-pointer transition-all",
                    value === 'in_person' ? "bg-[var(--v2-primary)]/10 border-[var(--v2-primary)]/30" : "bg-white/5 border-white/5 hover:bg-white/10"
                )}
                onClick={() => !disabled && onValueChange('in_person')}
            >
                <RadioGroupItem
                    value="in_person"
                    id={`${baseId}-in_person`}
                    className="text-[var(--v2-primary)] border-white/20"
                />
                <div className="flex-1 cursor-pointer">
                    <Label htmlFor={`${baseId}-in_person`} className="cursor-pointer font-bold text-white">Sur place</Label>
                    <p className="text-xs text-slate-400 mt-1">
                        Définissez un lieu de rendez-vous pour que les membres s&apos;y retrouvent.
                    </p>
                </div>
            </div>
        </RadioGroup>
    );
}
