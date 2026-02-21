'use server';

import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

// Secret key for HMAC (In production, use a secure env variable like process.env.SESSION_SECRET)
// For this standalone app, we can use the Anon Key as a basic salt if no other is provided.
const getSecretStr = () => process.env.SESSION_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default_secret';

/**
 * Generates an HMAC signature for a given Member ID to prevent tampering.
 */
function signMemberId(memberId: string): string {
    const secret = getSecretStr();
    return crypto.createHmac('sha256', secret).update(memberId).digest('hex');
}

/**
 * Creates a secure cookie containing the Member ID and its signature.
 */
async function setSecureGuestCookie(slug: string, memberId: string) {
    const signature = signMemberId(memberId);
    const cookieValue = `${memberId}.${signature}`;

    const cookieStore = await cookies();
    cookieStore.set(`group_session_${slug}`, cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
    });
}

/**
 * Verifies the secure cookie to ensure the user is authorized to act as this member.
 */
export async function verifyGuestSession(slug: string, expectedMemberId: string): Promise<boolean> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(`group_session_${slug}`);

    if (!sessionCookie?.value) return false;

    const [cookieMemberId, signature] = sessionCookie.value.split('.');

    if (cookieMemberId !== expectedMemberId) return false;

    const expectedSignature = signMemberId(expectedMemberId);
    // Use timingSafeEqual to prevent timing attacks, though basic string comparison is okay for simple apps
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Clears the secure cookie for a specific group.
 */
export async function clearSecureGuestCookie(slug: string) {
    const cookieStore = await cookies();
    cookieStore.delete(`group_session_${slug}`);
}

/**
 * Server Action: Join a group and set secure session.
 */
export async function joinGroupAction(groupId: string, slug: string, name: string, userId?: string | null) {
    // 1. Determine role
    let role = 'member';

    const { count, error: countError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

    if (!countError && count === 0) {
        role = 'admin';
    } else if (userId) {
        // Check if user is creator of the group
        const { data: group } = await supabase.from('groups').select('created_by').eq('id', groupId).single();
        if (group && group.created_by === userId) {
            role = 'admin';
        }
    }

    // 2. Insert member
    const { data: member, error } = await supabase
        .from('members')
        .insert({
            group_id: groupId,
            name,
            user_id: userId || null,
            role
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating member via action:", error);
        return { success: false, error: error.message };
    }

    if (!member) return { success: false, error: "Failed to create member." };

    // 3. Set secure cookie for guests AND users (unified approach)
    await setSecureGuestCookie(slug, member.id);

    revalidatePath(`/group/${slug}`);
    return { success: true, member };
}

/**
 * Server Action: Link a guest membership to an authenticated user ID.
 * Used when a guest logs in and we want to preserve their history and identity in that group.
 */
export async function linkGuestToUserAction(slug: string, memberId: string, userId: string) {
    const isAuthorized = await verifyGuestSession(slug, memberId);
    if (!isAuthorized) {
        return { success: false, error: 'Unauthorized: Invalid guest session.' };
    }

    const { error } = await supabase
        .from('members')
        .update({ user_id: userId, updated_at: new Date().toISOString() })
        .eq('id', memberId);

    if (error) {
        console.error('Error linking guest to user:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/group/${slug}`);
    return { success: true };
}

/**
 * Server Action: Reclaim an existing guest session (usually called when selecting an existing name).
 * In a highly secure app, we'd need email/password here. For this app, simply picking the name
 * grants access (as designed in the original UI), but we still set the secure cookie to lock it down afterwards.
 */
export async function reclaimSessionAction(slug: string, memberId: string) {
    // Just set the cookie so future actions (toggleReady) are authenticated for this device.
    await setSecureGuestCookie(slug, memberId);
    return { success: true };
}

/**
 * Server Action: Toggle readiness status securely.
 */
export async function toggleReadyAction(slug: string, memberId: string, isReady: boolean) {
    // 1. Verify authorization (Cookie check)
    const isAuthorized = await verifyGuestSession(slug, memberId);

    if (!isAuthorized) {
        return { success: false, error: "Unauthorized access: Invalid or missing session cookie." };
    }

    // 2. Perform safe update
    const { error } = await supabase
        .from('members')
        .update({
            is_ready: isReady,
            updated_at: new Date().toISOString(),
            timer_end_time: null
        })
        .eq('id', memberId);

    if (error) {
        console.error("Error updating status securely:", error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/group/${slug}`);
    return { success: true };
}

/**
 * Server Action: Update member fields (timer, proposal) securely.
 */
export async function updateMemberAction(
    slug: string,
    memberId: string,
    updates: {
        timer_end_time?: string | null;
        is_ready?: boolean;
        proposed_time?: string | null;
    }
) {
    const isAuthorized = await verifyGuestSession(slug, memberId);

    if (!isAuthorized) {
        return { success: false, error: 'Unauthorized access: Invalid or missing session cookie.' };
    }

    const { error } = await supabase
        .from('members')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', memberId);

    if (error) {
        console.error('Error updating member via action:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/group/${slug}`);
    return { success: true };
}

/**
 * Server Action: Leave group securely.
 */
export async function leaveGroupAction(slug: string, memberId: string) {
    // 1. Verify authorization
    const isAuthorized = await verifyGuestSession(slug, memberId);

    if (!isAuthorized) {
        return { success: false, error: "Unauthorized access" };
    }

    // 2. Delete member and cookie
    await supabase.from('members').delete().eq('id', memberId);
    await clearSecureGuestCookie(slug);

    revalidatePath(`/group/${slug}`);
    return { success: true };
}

/**
 * Server Action: Promote a member to admin (requester must be admin or first admin).
 */
export async function promoteToAdminAction(slug: string, requesterId: string, targetMemberId: string) {
    const isAuthorized = await verifyGuestSession(slug, requesterId);
    if (!isAuthorized) {
        return { success: false, error: 'Unauthorized: No valid session.' };
    }

    // Check requester's role and group
    const { data: requester } = await supabase
        .from('members')
        .select('role, group_id')
        .eq('id', requesterId)
        .single();

    if (!requester) return { success: false, error: 'Requester not found.' };

    // Allow promotion if there are no admins at all (bootstrap case), or requester is admin
    const { count: adminCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', requester.group_id)
        .eq('role', 'admin');

    if (requester.role !== 'admin' && (adminCount ?? 0) > 0) {
        return { success: false, error: 'Forbidden: Only admins can promote members.' };
    }

    const { error } = await supabase
        .from('members')
        .update({ role: 'admin', updated_at: new Date().toISOString() })
        .eq('id', targetMemberId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/group/${slug}`);
    return { success: true };
}

/**
 * Server Action: Kick a member from the group (requester must be admin).
 */
export async function kickMemberAction(slug: string, requesterId: string, targetMemberId: string) {
    if (requesterId === targetMemberId) {
        return { success: false, error: 'Cannot kick yourself. Use leaveGroupAction instead.' };
    }

    const isAuthorized = await verifyGuestSession(slug, requesterId);
    if (!isAuthorized) {
        return { success: false, error: 'Unauthorized: No valid session.' };
    }

    const { data: requester } = await supabase
        .from('members')
        .select('role')
        .eq('id', requesterId)
        .single();

    if (!requester || requester.role !== 'admin') {
        return { success: false, error: 'Forbidden: Only admins can kick members.' };
    }

    const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', targetMemberId);

    if (error) return { success: false, error: error.message };

    revalidatePath(`/group/${slug}`);
    return { success: true };
}
