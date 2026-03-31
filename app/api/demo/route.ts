import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const DEMO_SLUG = 'demo-rdychk';

function getDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

function getSecret() {
    return process.env.SESSION_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default_secret';
}

function signMemberId(memberId: string): string {
    return crypto.createHmac('sha256', getSecret()).update(memberId).digest('hex');
}

export async function POST() {
    try {
        const db = getDb();

        // 1. Upsert demo group
        const { data: group, error: groupError } = await db
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
            return NextResponse.json({ error: 'Failed to upsert demo group', detail: groupError?.message }, { status: 500 });
        }

        // 2. Reset proposals/votes/members
        const { data: existingProposals } = await db
            .from('location_proposals')
            .select('id')
            .eq('group_id', group.id);

        if (existingProposals?.length) {
            await db.from('location_proposal_votes').delete().in('proposal_id', existingProposals.map(p => p.id));
        }
        await db.from('location_proposals').delete().eq('group_id', group.id);
        await db.from('date_votes').delete().eq('group_id', group.id);
        await db.from('members').delete().eq('group_id', group.id);

        // 3. Create demo admin member
        const { data: adminMember, error: adminError } = await db
            .from('members')
            .insert({ group_id: group.id, name: 'Toi (Admin)', is_ready: true, role: 'admin' })
            .select()
            .single();

        if (adminError || !adminMember) {
            return NextResponse.json({ error: 'Failed to create admin member', detail: adminError?.message }, { status: 500 });
        }

        // 4. Create fake members
        const { data: fakeMembers } = await db
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
        const dateVotes: { group_id: string; member_id: string; date: string }[] = [];
        for (const date of dates) {
            const voters = allMemberIds.filter((_, i) => (i + dates.indexOf(date)) % 2 === 0);
            for (const memberId of voters) {
                dateVotes.push({ group_id: group.id, member_id: memberId, date });
            }
        }
        if (dateVotes.length > 0) {
            await db.from('date_votes').insert(dateVotes);
        }

        // 6. Add location proposals
        await db.from('location_proposals').insert([
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
        ]);

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
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ error: 'Unexpected error', detail: msg }, { status: 500 });
    }
}
