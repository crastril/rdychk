'use server';

import { supabase } from '@/lib/supabase';
import { verifyGuestSession } from './member';

/**
 * Toggle a date vote for a member. If the member already voted for this date, remove it.
 */
export async function voteDateAction(
    slug: string,
    memberId: string,
    date: string // 'YYYY-MM-DD'
) {
    const isAuthorized = await verifyGuestSession(slug, memberId);
    if (!isAuthorized) {
        return { success: false, error: 'Unauthorized' };
    }

    // Get group_id from member
    const { data: member } = await supabase
        .from('members')
        .select('group_id')
        .eq('id', memberId)
        .single();

    if (!member) {
        return { success: false, error: 'Member not found' };
    }

    // Check if vote already exists for this (group, member, date)
    const { data: existingVote } = await supabase
        .from('date_votes')
        .select('id')
        .eq('group_id', member.group_id)
        .eq('member_id', memberId)
        .eq('date', date)
        .single();

    if (existingVote) {
        // Toggle OFF: remove the vote
        const { error } = await supabase
            .from('date_votes')
            .delete()
            .eq('id', existingVote.id);

        if (error) return { success: false, error: error.message };
        return { success: true, action: 'removed' };
    } else {
        // Toggle ON: add the vote
        const { error } = await supabase
            .from('date_votes')
            .insert({ group_id: member.group_id, member_id: memberId, date });

        if (error) return { success: false, error: error.message };
        return { success: true, action: 'added' };
    }
}

/**
 * Admin-only: confirm a date as the official group date.
 */
export async function confirmDateAction(
    slug: string,
    memberId: string,
    date: string | null // null to clear
) {
    const isAuthorized = await verifyGuestSession(slug, memberId);
    if (!isAuthorized) {
        return { success: false, error: 'Unauthorized' };
    }

    // Verify admin role
    const { data: member } = await supabase
        .from('members')
        .select('group_id, role')
        .eq('id', memberId)
        .single();

    if (!member || member.role !== 'admin') {
        return { success: false, error: 'Only admins can confirm a date' };
    }

    const { error } = await supabase
        .from('groups')
        .update({ confirmed_date: date })
        .eq('id', member.group_id);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

/**
 * Admin-only: toggle calendar voting on/off for the group.
 */
export async function toggleCalendarVotingAction(
    slug: string,
    memberId: string,
    enabled: boolean
) {
    const isAuthorized = await verifyGuestSession(slug, memberId);
    if (!isAuthorized) {
        return { success: false, error: 'Unauthorized' };
    }

    const { data: member } = await supabase
        .from('members')
        .select('group_id, role')
        .eq('id', memberId)
        .single();

    if (!member || member.role !== 'admin') {
        return { success: false, error: 'Only admins can toggle calendar voting' };
    }

    const { error } = await supabase
        .from('groups')
        .update({ calendar_voting_enabled: enabled })
        .eq('id', member.group_id);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

/**
 * Admin-only: toggle location proposals voting on/off for the group.
 */
export async function toggleLocationVotingAction(
    slug: string,
    memberId: string,
    enabled: boolean
) {
    const isAuthorized = await verifyGuestSession(slug, memberId);
    if (!isAuthorized) {
        return { success: false, error: 'Unauthorized' };
    }

    const { data: member } = await supabase
        .from('members')
        .select('group_id, role')
        .eq('id', memberId)
        .single();

    if (!member || member.role !== 'admin') {
        return { success: false, error: 'Only admins can toggle location voting' };
    }

    const { error } = await supabase
        .from('groups')
        .update({ location_voting_enabled: enabled })
        .eq('id', member.group_id);

    if (error) return { success: false, error: error.message };
    return { success: true };
}
