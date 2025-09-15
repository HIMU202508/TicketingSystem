import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	reactStrictMode: false,
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	images: {
		formats: ['image/avif', 'image/webp'],
		minimumCacheTTL: 60,
	},
	experimental: {
		optimizePackageImports: ['react', 'react-dom'],
	},
	// Performance optimizations
	compress: true,
	poweredByHeader: false,
	generateEtags: true,
	// Bundle analyzer for production builds
	...(process.env.ANALYZE === 'true' && {
		webpack: (config: any) => {
			config.optimization.splitChunks = {
				chunks: 'all',
				cacheGroups: {
					vendor: {
						test: /[\\/]node_modules[\\/]/,
						name: 'vendors',
						chunks: 'all',
					},
				},
			}
			return config
		},
	}),
}

export default nextConfig
