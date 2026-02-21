import { lookup } from 'dns/promises';
import { isIP } from 'net';

/**
 * Checks if a URL is safe to fetch (prevents SSRF).
 * Specifically checks for private IP ranges and local addresses.
 */
export async function isSafeUrl(url: string): Promise<boolean> {
    try {
        const parsedUrl = new URL(url);

        // Protocol check: only allow http and https
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return false;
        }

        const hostname = parsedUrl.hostname;

        // If hostname is already an IP, check it directly
        if (isIP(hostname)) {
            return !isPrivateIP(hostname);
        }

        // Resolve hostname to IP
        // dns.lookup uses the OS resolver (like getaddrinfo)
        // This handles /etc/hosts, etc.
        let address: string;
        try {
            const result = await lookup(hostname);
            address = result.address;
        } catch {
            // DNS resolution failed, treat as unsafe
            // (e.g. domain doesn't exist, or network error)
            // It's safer to block if we can't verify the IP
            return false;
        }

        // IP check
        if (isPrivateIP(address)) {
            return false;
        }

        return true;
    } catch {
        // URL parsing failed
        return false;
    }
}

/**
 * Checks if an IP address is private or reserved.
 */
function isPrivateIP(ip: string): boolean {
    // IPv4 private ranges
    // 10.0.0.0/8
    // 172.16.0.0/12
    // 192.168.0.0/16
    // 127.0.0.0/8 (Loopback)
    // 169.254.0.0/16 (Link-local)
    // 0.0.0.0/8 (Current network)

    // IPv6 private ranges
    // fc00::/7 (Unique Local Address)
    // fe80::/10 (Link-local)
    // ::1 (Loopback)

    // Basic IPv4 check
    if (ip.includes('.')) {
        const parts = ip.split('.');
        if (parts.length !== 4) return false; // Not a valid IPv4 structure

        const first = parseInt(parts[0], 10);
        const second = parseInt(parts[1], 10);

        // 0.0.0.0/8
        if (first === 0) return true;

        // 10.0.0.0/8
        if (first === 10) return true;

        // 172.16.0.0/12 -> 172.16.0.0 - 172.31.255.255
        if (first === 172 && second >= 16 && second <= 31) return true;

        // 192.168.0.0/16
        if (first === 192 && second === 168) return true;

        // 127.0.0.0/8
        if (first === 127) return true;

        // 169.254.0.0/16
        if (first === 169 && second === 254) return true;

        return false;
    }

    // Basic IPv6 check
    // ::1
    if (ip === '::1') return true;
    // fc00::/7 -> fc00... to fdff...
    if (ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd')) return true;
    // fe80::/10 -> fe80... to febf...
    // The first 10 bits are 1111 1110 10.
    // The first byte is FE.
    // The second byte's first 2 bits are 10.
    // So the second byte ranges from 10000000 (80) to 10111111 (BF).
    // Hex: 8, 9, a, b.
    if (ip.toLowerCase().match(/^fe[89ab]/)) return true;

    // IPv4 mapped IPv6
    if (ip.toLowerCase().startsWith('::ffff:')) {
        return isPrivateIP(ip.substring(7));
    }

    return false;
}

/**
 * Safer fetch wrapper that validates URL and redirects against SSRF.
 */
export async function safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const maxRedirects = 5;
    let currentUrl = url;
    let redirectCount = 0;

    while (redirectCount < maxRedirects) {
        if (!(await isSafeUrl(currentUrl))) {
            throw new Error(`Unsafe URL: ${currentUrl}`);
        }

        const response = await fetch(currentUrl, {
            ...options,
            redirect: 'manual',
        });

        if (response.status >= 301 && response.status <= 308) {
            const location = response.headers.get('location');
            if (!location) {
                // Redirect without location? treat as error or stop
                throw new Error('Redirect without Location header');
            }

            // Handle relative URLs
            try {
                // Resolving relative to currentUrl
                const nextUrl = new URL(location, currentUrl).toString();
                currentUrl = nextUrl;
                redirectCount++;
                continue;
            } catch {
                throw new Error('Invalid redirect URL');
            }
        }

        return response;
    }

    throw new Error('Too many redirects');
}
