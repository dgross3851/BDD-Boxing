import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        portal: resolve(__dirname, 'portal.html'),
        programs: resolve(__dirname, 'programs.html'),
        aboutCoach: resolve(__dirname, 'about-coach.html'),
        training: resolve(__dirname, 'training.html'),
        schedule: resolve(__dirname, 'schedule.html'),
        events: resolve(__dirname, 'events.html'),
        contact: resolve(__dirname, 'contact.html')
      }
    }
  },
  server: {
    port: 3000
  }
});
