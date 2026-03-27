'use server';

import { supabase } from '@/lib/supabase';
import { verifyGuestSession } from './member';

export async function updateLocationAction(
    slug: string,
    memberId: string,
    groupId: string,
    newLocation: any
) {
    const isAuthorized = await verifyGuestSession(slug, memberId);

    if (!isAuthorized) {
        return { success: false, error: 'Unauthorized access: Invalid or missing session cookie.' };
    }

    // Verify member exists in group
    const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('id', memberId)
        .eq('group_id', groupId)
        .single();

    if (!member) {
        return { success: false, error: 'Member is not in the group.' };
    }

    // Update the group location
    const { error: updateError } = await supabase
        .from('groups')
        .update({ location: newLocation })
        .eq('id', groupId);

    if (updateError) {
        console.error('Error updating location via action:', updateError);
        return { success: false, error: updateError.message };
    }

    // Reset votes when location changes
    await supabase.from('location_votes').delete().eq('group_id', groupId);

    return { success: true };
}

export async function updateGroupBaseLocationAction(
    slug: string,
    memberId: string,
    groupId: string,
    baseLat: number | null,
    baseLng: number | null
) {
    const isAuthorized = await verifyGuestSession(slug, memberId);

    if (!isAuthorized) {
        return { success: false, error: 'Unauthorized access: Invalid or missing session cookie.' };
    }

    // Verify member exists in group
    const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('id', memberId)
        .eq('group_id', groupId)
        .single();

    if (!member) {
        return { success: false, error: 'Member is not in the group.' };
    }

    const { error: updateError } = await supabase
        .from('groups')
        .update({ base_lat: baseLat, base_lng: baseLng })
        .eq('id', groupId);

    if (updateError) {
        console.error('Error updating base location:', updateError);
        return { success: false, error: updateError.message };
    }

    return { success: true };
}

export async function addLocationProposalAction(
    slug: string,
    memberId: string,
    data: { name: string; link?: string; description?: string; image?: string | null }
) {
    const isAuthorized = await verifyGuestSession(slug, memberId);
    if (!isAuthorized) return { success: false, error: 'Unauthorized' };

    const { data: member } = await supabase
        .from('members')
        .select('group_id')
        .eq('id', memberId)
        .single();

    if (!member) return { success: false, error: 'Member not found' };

    const { data: proposal, error } = await supabase
        .from('location_proposals')
        .insert({
            group_id: member.group_id,
            member_id: memberId,
            name: data.name,
            description: data.description,
            link: data.link,
            image: data.image
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding location proposal:', error);
        return { success: false, error: error.message };
    }

    return { success: true, proposal };
}

export async function voteLocationProposalAction(
    slug: string,
    memberId: string,
    proposalId: string,
    vote: 1 | -1
) {
    const isAuthorized = await verifyGuestSession(slug, memberId);
    if (!isAuthorized) return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
        .from('location_proposal_votes')
        .upsert({
            proposal_id: proposalId,
            member_id: memberId,
            vote: vote
        }, {
            onConflict: 'proposal_id,member_id'
        });

    if (error) {
        console.error('Error voting for location proposal:', error);
        return { success: false, error: error.message };
    }

    // Calculate new score (sum of all votes for this proposal)
    const { data: votes, error: scoreError } = await supabase
        .from('location_proposal_votes')
        .select('vote')
        .eq('proposal_id', proposalId);

    if (scoreError) {
        console.error('Error calculating score:', scoreError);
        return { success: true }; // Still return success since vote was recorded
    }

    const newScore = (votes || []).reduce((sum, v) => sum + v.vote, 0);

    // Update the proposal's score in the database for redundancy/caching
    await supabase
        .from('location_proposals')
        .update({ score: newScore })
        .eq('id', proposalId);

    return { success: true, score: newScore, myVote: vote };
}

export async function deleteLocationProposalAction(
    slug: string,
    memberId: string,
    proposalId: string
) {
    const isAuthorized = await verifyGuestSession(slug, memberId);
    if (!isAuthorized) return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
        .from('location_proposals')
        .delete()
        .eq('id', proposalId)
        .eq('member_id', memberId);

    if (error) {
        console.error('Error deleting location proposal:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}
