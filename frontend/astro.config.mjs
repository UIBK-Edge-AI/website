import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://edgeai.uibk.ac.at',
  build: {
    format: 'directory'
  },
  server: {
    port: 3000,
    host: true
  }
});
