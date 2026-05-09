import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Tsutsyk Live',
        short_name: 'Tsutsyk Live',
        description: 'An app to track your beloved one',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
            {
                src: '/favicon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/favicon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}