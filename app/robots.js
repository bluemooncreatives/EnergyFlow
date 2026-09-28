const BASE_URL = 'https://www.energyflow.in'

export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                // Keep crawlers out of private, transactional and API routes —
                // API responses are not search documents. Private HTML routes
                // remain crawlable so bots can read their explicit `noindex`
                // response headers and metadata; access control is enforced by
                // middleware, never by robots.txt.
                disallow: [
                    '/api/',
                ],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
        host: BASE_URL,
    }
}
