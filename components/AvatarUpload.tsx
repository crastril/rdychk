"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
    url?: string | null;
    uid: string;
    onUpload: (url: string) => void;
}

export function AvatarUpload({ url, uid, onUpload }: AvatarUploadProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error("Vous devez sélectionner une image à uploader.");
            }

            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const filePath = `${uid}/${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            console.log("Avatar uploaded successfully. Public URL:", publicUrl);
            onUpload(publicUrl);
        } catch (error) {
            console.error("Error uploading avatar:", error);
            alert(error instanceof Error ? error.message : "Erreur lors de l'upload.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative group">
                <div className={cn(
                    "w-24 h-24 rounded-2xl overflow-hidden glass-panel border-white/10 flex items-center justify-center relative transition-all duration-300 group-hover:border-[var(--v2-primary)]/50",
                    !url && "bg-black/20"
                )}>
                    {url ? (
                        <img
                            src={url}
                            alt="Avatar"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <User className="w-10 h-10 text-slate-600" />
                    )}

                    {uploading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-[var(--v2-primary)] animate-spin" />
                        </div>
                    )}
                </div>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[var(--v2-primary)] text-white shadow-neon-primary flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 z-20"
                >
                    <Camera className="w-4 h-4" />
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
            />

            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                Photo de profil
            </p>
        </div>
    );
}
