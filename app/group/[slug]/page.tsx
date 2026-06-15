import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import GroupClient from './group-client';
import { Metadata } from 'next';
import { cleanupPastDatesAction } from '@/app/actions/calendar';
import type { Member, DateVote, LocationProposal } from '@/types/database';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    // Fetch the group name to set as the title
    const { data: group } = await supabase
        .from('groups')
        .select('name')
        .eq('slug', slug)
        .single();

    if (!group) {
        return {
            title: 'Groupe introuvable',
        };
    }

    return {
        title: `${group.name} · rdychk`,
        description: 'Rejoins le groupe et indique quand tu es prêt.',
        openGraph: {
            title: `${group.name} · rdychk`,
            description: 'Rejoins le groupe et indique quand tu es prêt.',
            siteName: 'rdychk',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${group.name} · rdychk`,
            description: 'Rejoins le groupe et indique quand tu es prêt.',
        },
    };
}

export default async function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    const { data: group, error } = await supabase
        .from('groups')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !group) {
        notFound();
    }

    // Cleanup past date votes and reset confirmed_date if it has passed
    const { confirmed_date } = await cleanupPastDatesAction(group.id);
    const cleanGroup = { ...group, confirmed_date };

    // Seed the client with the rest of the group data so the first paint isn't blocked
    // on a client round-trip. Realtime + handleRefresh keep these fresh afterwards.
    const [membersRes, votesRes, proposalsRes] = await Promise.all([
        supabase.from('members').select('*, profiles(avatar_url)').eq('group_id', group.id).order('joined_at', { ascending: true }),
        supabase.from('date_votes').select('*').eq('group_id', group.id),
        supabase.from('location_proposals').select('*').eq('group_id', group.id),
    ]);

    const initialMembers = (membersRes.data ?? []).map((m) => {
        const rawProfile = m.profiles as { avatar_url: string | null } | { avatar_url: string | null }[] | null;
        const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
        return { ...m, avatar_url: profile?.avatar_url };
    }) as Member[];

    return (
        <GroupClient
            initialGroup={cleanGroup}
            initialMembers={initialMembers}
            initialVotes={(votesRes.data ?? []) as DateVote[]}
            initialProposals={(proposalsRes.data ?? []) as LocationProposal[]}
            slug={slug}
        />
    );
}
