import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://d-abiyoga.github.io',
    base: '/personal-site',
	integrations: [mdx(), sitemap()],
});
