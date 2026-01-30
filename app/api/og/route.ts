import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
        const response = await fetch(url, {
            headers: {
                // Mimic Facebook bot to get better OG tags from sites like Google Maps
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
                'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
            },
        });

        if (!response.ok) {
            console.error('Failed to fetch URL:', response.status, response.statusText);
            // Return empty metadata instead of failing, to be graceful
            return NextResponse.json({
                title: '',
                description: '',
                image: ''
            });
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const getMetaTag = (name: string) =>
            $(`meta[property="${name}"]`).attr('content') ||
            $(`meta[name="${name}"]`).attr('content') ||
            $(`meta[itemprop="${name}"]`).attr('content');

        const title = getMetaTag('og:title') || $('title').text() || '';
        const description = getMetaTag('og:description') || getMetaTag('description') || '';
        let image = getMetaTag('og:image') || getMetaTag('image') || '';

        // Fix relative protocol URLs (e.g. //example.com/img.jpg)
        if (image && image.startsWith('//')) {
            image = 'https:' + image;
        }

        return NextResponse.json({
            title,
            description,
            image
        });

    } catch (error) {
        console.error('Error fetching OG data:', error);
        return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
    }
}
