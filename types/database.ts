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
                };
                Insert: {
                    id?: string;
                    name: string;
                    slug: string;
                    created_at?: string;
                    created_by?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    slug?: string;
                    created_at?: string;
                };
            };
            members: {
                Row: {
                    id: string;
                    group_id: string;
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
