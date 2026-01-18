export type Database = {
    public: {
        Tables: {
            groups: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    slug: string;
                    created_at?: string;
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
                };
                Insert: {
                    id?: string;
                    group_id: string;
                    name: string;
                    is_ready?: boolean;
                    joined_at?: string;
                    updated_at?: string;
                    timer_end_time?: string | null;
                };
                Update: {
                    id?: string;
                    group_id?: string;
                    name?: string;
                    is_ready?: boolean;
                    joined_at?: string;
                    updated_at?: string;
                };
            };
        };
    };
};

export type Group = Database['public']['Tables']['groups']['Row'];
export type Member = Database['public']['Tables']['members']['Row'];
