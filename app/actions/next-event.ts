'use server';

import { supabase } from '@/lib/supabase';
import { verifyGuestSession } from './member';
import type { PastEvent } from '@/types/database';

/**
 * Server Action: archive the current event and reset the group for planning
 * the next one.
 *
 * What gets archived (stored in groups.past_events):
 *   confirmed_date, location name/image, ready/total member counts
 *
 * What gets reset:
 *   groups  → confirmed_date, location, calendar_voting_enabled,
 *             location_voting_enabled
 *   members → is_ready, proposed_time, timer_end_time,
 *             en_route_at, current_lat/lng, location_updated_at, arrived_at
 *   date_votes          → deleted
 *   location_proposals  → deleted (cascades to location_proposal_votes)
 */
export async function resetGroupForNextEventAction(
    slug: string,
    memberId: string,
) {
    // ── Auth: must be a valid session AND an admin ──────────────────────────
    const ok = await verifyGuestSession(slug, memberId);
    if (!ok) return { success: false, error: 'Unauthorized' };

    const { data: requester } = await supabase
        .from('members')
        .select('role, group_id')
        .eq('id', memberId)
        .single();

    if (!requester || requester.role !== 'admin') {
        return { success: false, error: 'Admin only' };
    }

    const groupId = requester.group_id;

    // ── Fetch current state to build the archive snapshot ──────────────────
    const { data: group } = await supabase
        .from('groups')
        .select('confirmed_date, location, past_events, calendar_voting_enabled, location_voting_enabled')
        .eq('id', groupId)
        .single();

    if (!group) return { success: false, error: 'Group not found' };

    const { data: allMembers } = await supabase
        .from('members')
        .select('id, is_ready')
        .eq('group_id', groupId);

    const totalCount = allMembers?.length ?? 0;
    const readyCount = allMembers?.filter(m => m.is_ready).length ?? 0;

    // ── Build the past event snapshot ──────────────────────────────────────
    const loc = group.location as { name?: string; image?: string } | null;
    const snapshot: PastEvent = {
        date: group.confirmed_date ?? new Date().toISOString().slice(0, 10),
        location_name: loc?.name,
        location_image: loc?.image,
        ready_count: readyCount,
        total_count: totalCount,
        archived_at: new Date().toISOString(),
    };

    const updatedPastEvents: PastEvent[] = [
        snapshot,
        ...((group.past_events as PastEvent[]) ?? []),
    ];

    // ── Reset the group ────────────────────────────────────────────────────
    const { error: groupErr } = await supabase
        .from('groups')
        .update({
            confirmed_date: null,
            location: null,
            calendar_voting_enabled: true,
            location_voting_enabled: true,
            past_events: updatedPastEvents,
        })
        .eq('id', groupId);

    if (groupErr) return { success: false, error: groupErr.message };

    // ── Reset all members ──────────────────────────────────────────────────
    const { error: membersErr } = await supabase
        .from('members')
        .update({
            is_ready: false,
            proposed_time: null,
            timer_end_time: null,
            en_route_at: null,
            current_lat: null,
            current_lng: null,
            location_updated_at: null,
            arrived_at: null,
            updated_at: new Date().toISOString(),
        })
        .eq('group_id', groupId);

    if (membersErr) return { success: false, error: membersErr.message };

    // ── Delete votes & proposals ───────────────────────────────────────────
    await supabase.from('date_votes').delete().eq('group_id', groupId);
    // location_proposal_votes cascade via FK on proposal_id
    await supabase.from('location_proposals').delete().eq('group_id', groupId);

    return { success: true, snapshot };
}
