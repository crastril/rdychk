import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useId } from 'react';
import { cn } from '@/lib/utils';
import { Monitor, MapPin } from 'lucide-react';

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
