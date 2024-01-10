import vercel from '@sveltejs/adapter-vercel';
import preprocess from 'svelte-preprocess';

const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess({ postcss: true }),

	extensions: ['.svelte'], // Add this

	kit: {
		adapter: vercel({
			// default options are shown. On some platforms
			// these options are set automatically — see below
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false
		})
	},
	vite: {
		server: {
			hmr: {
				clientPort: process.env.HMR_HOST ? 443 : 24678,
				host: process.env.HMR_HOST ? process.env.HMR_HOST.substring("https://".length) : "localhost"
			}
		}
	}
};

export default config;