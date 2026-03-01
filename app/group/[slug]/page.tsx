import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import GroupClient from './group-client';
import { Metadata } from 'next';

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
        title: group.name,
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

    return <GroupClient initialGroup={group} slug={slug} />;
}
