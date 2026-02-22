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
