// @ts-check
import { defineConfig } from 'astro/config';
import Icons from 'astro-icon';

// https://astro.build/config
export default defineConfig({
    integrations: [Icons()],
    site: 'https://nathanlannon.work/'
});
