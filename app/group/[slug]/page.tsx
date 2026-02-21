import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import GroupClient from './group-client';

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
