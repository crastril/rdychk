import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

const DEMO_SLUG = 'demo-rdychk';
const getSecret = () =>
    process.env.SESSION_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default_secret';

function signMemberId(memberId: string): string {
    return crypto.createHmac('sha256', getSecret()).update(memberId).digest('hex');
}

export async function POST() {
    // 1. Upsert demo group
    const { data: group, error: groupError } = await supabase
        .from('groups')
        .upsert(
            {
                slug: DEMO_SLUG,
                name: 'Soirée Jeux Vidéo',
                type: 'in_person',
                city: 'Paris',
                location_voting_enabled: true,
                calendar_voting_enabled: true,
            },
            { onConflict: 'slug' }
        )
        .select()
        .single();

    if (groupError || !group) {
        return NextResponse.json({ error: 'Failed to upsert demo group' }, { status: 500 });
    }

    // 2. Reset all members, votes and proposals
    await supabase.from('location_proposal_votes').delete().in(
        'proposal_id',
        (await supabase.from('location_proposals').select('id').eq('group_id', group.id)).data?.map(r => r.id) ?? []
    );
    await supabase.from('location_proposals').delete().eq('group_id', group.id);
    await supabase.from('date_votes').delete().eq('group_id', group.id);
    await supabase.from('members').delete().eq('group_id', group.id);

    // 3. Create admin demo member
    const { data: adminMember, error: adminError } = await supabase
        .from('members')
        .insert({ group_id: group.id, name: 'Toi (Admin)', is_ready: true, role: 'admin' })
        .select()
        .single();

    if (adminError || !adminMember) {
        return NextResponse.json({ error: 'Failed to create admin member' }, { status: 500 });
    }

    // 4. Create fake members
    const { data: fakeMembers } = await supabase
        .from('members')
        .insert([
            { group_id: group.id, name: 'Mathieu', is_ready: true, role: 'member' },
            { group_id: group.id, name: 'Camille', is_ready: false, role: 'member' },
            { group_id: group.id, name: 'Théo', is_ready: true, role: 'member' },
            { group_id: group.id, name: 'Sophie', is_ready: false, role: 'member' },
        ])
        .select();

    // 5. Add date votes
    const today = new Date();
    const dates = [1, 3, 5].map(d => {
        const date = new Date(today);
        date.setDate(today.getDate() + d);
        return date.toISOString().split('T')[0];
    });

    const allMemberIds = [adminMember.id, ...(fakeMembers?.map(m => m.id) ?? [])];
    const dateVotes = [];
    for (const date of dates) {
        // Not everyone votes for every date
        const voters = allMemberIds.filter((_, i) => (i + dates.indexOf(date)) % 2 === 0);
        for (const memberId of voters) {
            dateVotes.push({ group_id: group.id, member_id: memberId, date });
        }
    }
    if (dateVotes.length > 0) {
        await supabase.from('date_votes').insert(dateVotes);
    }

    // 6. Add location proposals
    const proposals = [
        {
            group_id: group.id,
            member_id: fakeMembers?.[0]?.id ?? adminMember.id,
            name: 'Le Baron Rouge',
            description: 'Bar à vins sympa, super ambiance',
            link: 'https://maps.google.com',
            score: 2,
        },
        {
            group_id: group.id,
            member_id: fakeMembers?.[1]?.id ?? adminMember.id,
            name: 'MK2 Bibliothèque',
            description: 'Cinéma accessible depuis le métro',
            link: 'https://maps.google.com',
            score: 1,
        },
    ];
    await supabase.from('location_proposals').insert(proposals);

    // 7. Set HMAC session cookie
    const signature = signMemberId(adminMember.id);
    const cookieValue = `${adminMember.id}.${signature}`;

    const response = NextResponse.json({ slug: DEMO_SLUG, memberId: adminMember.id });
    response.cookies.set(`group_session_${DEMO_SLUG}`, cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
    });

    return response;
}
