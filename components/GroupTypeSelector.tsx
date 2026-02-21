'use client';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useId } from 'react';

interface GroupTypeSelectorProps {
    value: 'remote' | 'in_person';
    onValueChange: (value: 'remote' | 'in_person') => void;
    disabled?: boolean;
}

export function GroupTypeSelector({ value, onValueChange, disabled = false }: GroupTypeSelectorProps) {
    const idPrefix = useId();

    return (
        <RadioGroup
            value={value}
            onValueChange={(val: string) => onValueChange(val as 'remote' | 'in_person')}
            className="flex flex-col gap-4"
            disabled={disabled}
        >
            <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="remote" id={`${idPrefix}-remote`} />
                <div className="flex-1 cursor-pointer" onClick={() => !disabled && onValueChange('remote')}>
                    <Label htmlFor={`${idPrefix}-remote`} className="cursor-pointer font-semibold text-base">À distance</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                        Pas de lieu physique. Idéal pour des appels vidéo ou jeux en ligne.
                    </p>
                </div>
            </div>
            <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="in_person" id={`${idPrefix}-in_person`} />
                <div className="flex-1 cursor-pointer" onClick={() => !disabled && onValueChange('in_person')}>
                    <Label htmlFor={`${idPrefix}-in_person`} className="cursor-pointer font-semibold text-base">Sur place</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                        Définissez un lieu de rendez-vous pour que les membres s&apos;y retrouvent.
                    </p>
                </div>
            </div>
        </RadioGroup>
    );
}
