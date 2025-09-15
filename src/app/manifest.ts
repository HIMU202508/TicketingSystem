import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Billing Tracker',
		short_name: 'Billing',
		description: 'Billing Tracker',
		start_url: '/',
		display: 'standalone',
		background_color: '#f0fdf4',
		theme_color: '#10b981',
		icons: [
			{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
			{ src: '/favicon.ico', sizes: '32x32 48x48 64x64', type: 'image/x-icon' }
		]
	}
}