export type GroupMode = 'planning' | 'day-of';

export function getGroupMode(
    confirmedDate: string | null,
    calendarVotingEnabled: boolean = true,
    locationVotingEnabled: boolean = true,
): GroupMode {
    // If no voting feature is active, the group is in day-of coordination mode
    if (!calendarVotingEnabled && !locationVotingEnabled) return 'day-of';
    if (!confirmedDate) return 'planning';
    const today = new Date().toISOString().slice(0, 10);
    return confirmedDate <= today ? 'day-of' : 'planning';
}
