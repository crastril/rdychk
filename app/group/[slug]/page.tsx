import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import GroupClient from './group-client';
import { Metadata } from 'next';
import { cleanupPastDatesAction } from '@/app/actions/calendar';

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

    return <GroupClient initialGroup={cleanGroup} slug={slug} />;
}
