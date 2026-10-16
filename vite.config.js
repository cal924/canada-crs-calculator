import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from https://<user>.github.io/canada-crs-calculator/
export default defineConfig({
  plugins: [react()],
  base: '/canada-crs-calculator/',
});
