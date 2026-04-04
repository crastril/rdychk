const { performance } = require('perf_hooks');

const groupId = 'group-123';
const allMemberIds = Array.from({ length: 100 }, (_, i) => `member-${i}`);
const dates = Array.from({ length: 30 }, (_, i) => `2023-10-${(i+1).toString().padStart(2, '0')}`);

function baseline() {
    const dateVotes = [];
    for (const date of dates) {
        const voters = allMemberIds.filter((_, i) => (i + dates.indexOf(date)) % 2 === 0);
        for (const memberId of voters) {
            dateVotes.push({ group_id: groupId, member_id: memberId, date });
        }
    }
    return dateVotes;
}

function optimized() {
    const dateVotes = [];
    for (let dateIndex = 0; dateIndex < dates.length; dateIndex++) {
        const date = dates[dateIndex];
        for (let i = (dateIndex % 2 === 0 ? 0 : 1); i < allMemberIds.length; i += 2) {
            dateVotes.push({ group_id: groupId, member_id: allMemberIds[i], date });
        }
    }
    return dateVotes;
}

function benchmark(name, fn, iterations = 10000) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        fn();
    }
    const end = performance.now();
    console.log(`${name}: ${end - start} ms`);
}

// Warmup
baseline();
optimized();

benchmark('Baseline', baseline);
benchmark('Optimized', optimized);

const r1 = baseline();
const r2 = optimized();
console.log('Results match?', JSON.stringify(r1) === JSON.stringify(r2));
