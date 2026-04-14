// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import Icons from 'astro-icon';

import alpinejs from '@astrojs/alpinejs';

// https://astro.build/config
export default defineConfig({
    integrations: [Icons(), alpinejs()],
    site: 'https://nathanlannon.work/',
    vite: {
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
    },
});