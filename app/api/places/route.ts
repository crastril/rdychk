import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!query) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Google Maps Server API key is missing' }, { status: 500 });
    }

    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=fr&key=${apiKey}`;

    if (lat && lng) {
        url += `&location=${lat},${lng}&radius=50000`; // 50km radius
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error('Google Places API Error:', data);
            return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 });
        }

        const results = data.results.map((place: any) => ({
            place_id: place.place_id,
            name: place.name,
            formatted_address: place.formatted_address,
            image: place.photos && place.photos.length > 0
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
                : null,
            url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
        }));

        return NextResponse.json({ results });

    } catch (error) {
        console.error('API /places error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
