import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get('q');
    if (!q || q.trim().length < 2) {
        return NextResponse.json({ results: [] });
    }

    const apiKey = process.env.RAWG_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'RAWG_API_KEY not configured' }, { status: 500 });
    }

    const url = new URL('https://api.rawg.io/api/games');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('search', q.trim());
    url.searchParams.set('page_size', '12');
    url.searchParams.set('platforms', '1,2,3,4,5,6,7,8,14,18,27'); // PC, PS, Xbox, mobile, Switch

    const res = await fetch(url.toString(), {
        next: { revalidate: 3600 }, // cache 1h
    });

    if (!res.ok) {
        return NextResponse.json({ error: 'RAWG API error' }, { status: res.status });
    }

    const data = await res.json();

    const results = (data.results ?? []).map((g: {
        name: string;
        slug: string;
        background_image: string | null;
        metacritic: number | null;
        genres: { name: string }[];
        platforms: { platform: { name: string } }[] | null;
    }) => ({
        name: g.name,
        slug: g.slug,
        image: g.background_image,
        metacritic: g.metacritic,
        genres: g.genres?.slice(0, 2).map((g: { name: string }) => g.name) ?? [],
        url: `https://rawg.io/games/${g.slug}`,
    }));

    return NextResponse.json({ results });
}
