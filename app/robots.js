const BASE_URL = 'https://www.energyflow.com'

export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                // Keep crawlers out of private, transactional and API routes —
                // they're either auth-gated (middleware redirects them to login)
                // or meaningless in search results.
                disallow: [
                    '/admin',
                    '/api/',
                    '/auth/',
                    '/cart',
                    '/checkout',
                    '/my-account',
                    '/profile',
                    '/orders',
                    '/order-details/',
                ],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
    }
}
