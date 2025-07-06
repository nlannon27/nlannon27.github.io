// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import Icons from 'astro-icon';

// https://astro.build/config
export default defineConfig({
    integrations: [Icons()],
    site: 'https://nathanlannon.work/',
    vite: {
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
    },
});
