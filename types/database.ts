export type Database = {
    public: {
        Tables: {
            groups: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    created_at: string;
                    created_by?: string;
                    type: 'remote' | 'in_person';
                    location?: { name: string; address?: string; link?: string; image?: string; description?: string; preview_title?: string; proposed_by?: string; proposed_by_id?: string } | null;
                };
                Insert: {
                    id?: string;
                    name: string;
                    slug: string;
                    created_at?: string;
                    created_by?: string;
                    type?: 'remote' | 'in_person';
                    location?: { name: string; address?: string; link?: string; image?: string; description?: string; preview_title?: string; proposed_by?: string; proposed_by_id?: string } | null;
                };
                Update: {
                    id?: string;
                    name?: string;
                    slug?: string;
                    created_at?: string;
                    type?: 'remote' | 'in_person';
                    location?: { name: string; address?: string; link?: string; image?: string; description?: string; preview_title?: string; proposed_by?: string; proposed_by_id?: string } | null;
                };
            };
            members: {
                Row: {
                    id: string;
                    group_id: string;
                    user_id: string | null;
                    name: string;
                    is_ready: boolean;
                    joined_at: string;
                    updated_at: string;
                    timer_end_time: string | null;
                    proposed_time: string | null;
                    role: 'admin' | 'member';
                };
                Insert: {
                    id?: string;
                    group_id: string;
                    user_id?: string | null;
                    name: string;
                    is_ready?: boolean;
                    joined_at?: string;
                    updated_at?: string;
                    timer_end_time?: string | null;
                    proposed_time?: string | null;
                    role?: 'admin' | 'member';
                };
                Update: {
                    id?: string;
                    group_id?: string;
                    name?: string;
                    is_ready?: boolean;
                    joined_at?: string;
                    updated_at?: string;
                    role?: 'admin' | 'member';
                };
            };
        };
    };
};

export type Group = Database['public']['Tables']['groups']['Row'];
export type Member = Database['public']['Tables']['members']['Row'];
