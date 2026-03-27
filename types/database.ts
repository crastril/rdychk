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
                    base_lat?: number | null;
                    base_lng?: number | null;
                    city: string | null;
                    calendar_voting_enabled: boolean;
                    location_voting_enabled: boolean;
                    confirmed_date: string | null;
                };
                Insert: {
                    id?: string;
                    name: string;
                    slug: string;
                    created_at?: string;
                    created_by?: string;
                    type?: 'remote' | 'in_person';
                    location?: { name: string; address?: string; link?: string; image?: string; description?: string; preview_title?: string; proposed_by?: string; proposed_by_id?: string } | null;
                    base_lat?: number | null;
                    base_lng?: number | null;
                    city?: string | null;
                    calendar_voting_enabled?: boolean;
                    location_voting_enabled?: boolean;
                    confirmed_date?: string | null;
                };
                Update: {
                    id?: string;
                    name?: string;
                    slug?: string;
                    created_at?: string;
                    type?: 'remote' | 'in_person';
                    location?: { name: string; address?: string; link?: string; image?: string; description?: string; preview_title?: string; proposed_by?: string; proposed_by_id?: string } | null;
                    base_lat?: number | null;
                    base_lng?: number | null;
                    city?: string | null;
                    calendar_voting_enabled?: boolean;
                    location_voting_enabled?: boolean;
                    confirmed_date?: string | null;
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
            profiles: {
                Row: {
                    id: string;
                    updated_at: string | null;
                    display_name: string | null;
                    avatar_url: string | null;
                };
                Insert: {
                    id: string;
                    updated_at?: string | null;
                    display_name?: string | null;
                    avatar_url?: string | null;
                };
                Update: {
                    id?: string;
                    updated_at?: string | null;
                    display_name?: string | null;
                    avatar_url?: string | null;
                };
            };
        };
    };
};

export type Group = Database['public']['Tables']['groups']['Row'];
export type Member = Database['public']['Tables']['members']['Row'] & {
    avatar_url?: string | null;
};

export type DateVote = {
    id: string;
    group_id: string;
    member_id: string;
    date: string;
    created_at: string;
};

export type LocationProposal = {
    id: string;
    group_id: string;
    member_id: string;
    name: string;
    description: string | null;
    image: string | null;
    link: string | null;
    score: number;
    created_at: string;
    preview_title?: string | null;
};

export type LocationVote = {
    id: string;
    proposal_id: string;
    member_id: string;
    vote: 1 | -1;
    created_at: string;
};
