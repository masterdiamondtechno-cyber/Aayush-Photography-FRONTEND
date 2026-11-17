import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://app-8a9a7cdf-e2ae-43e0-a03e-54f85bc69503.cleverapps.io',
        changeOrigin: true,
        secure: false,
      },
      '/dashboard': {
        target: 'https://app-8a9a7cdf-e2ae-43e0-a03e-54f85bc69503.cleverapps.io',
        changeOrigin: true,
        secure: false,
      },
      '/AddSchool': {
        target: 'https://app-8a9a7cdf-e2ae-43e0-a03e-54f85bc69503.cleverapps.io',
        changeOrigin: true,
        secure: false,
      },
      '/academicYear': {
        target: 'https://app-8a9a7cdf-e2ae-43e0-a03e-54f85bc69503.cleverapps.io',
        changeOrigin: true,
        secure: false,
      },
      '/standard': {
        target: 'https://app-8a9a7cdf-e2ae-43e0-a03e-54f85bc69503.cleverapps.io',
        changeOrigin: true,
        secure: false,
      },
      '/batch': {
        target: 'https://app-8a9a7cdf-e2ae-43e0-a03e-54f85bc69503.cleverapps.io',
        changeOrigin: true,
        secure: false,
      },
      '/division': {
        target: 'https://app-8a9a7cdf-e2ae-43e0-a03e-54f85bc69503.cleverapps.io',
        changeOrigin: true,
        secure: false,
      },
      '/subject': {
        target: 'https://app-8a9a7cdf-e2ae-43e0-a03e-54f85bc69503.cleverapps.io',
        changeOrigin: true,
        secure: false,
      },
      '/exam': {
        target: 'https://app-8a9a7cdf-e2ae-43e0-a03e-54f85bc69503.cleverapps.io',
        changeOrigin: true,
        secure: false,
      },
      '/workspace': {
        target: 'https://app-8a9a7cdf-e2ae-43e0-a03e-54f85bc69503.cleverapps.io',
        changeOrigin: true,
        secure: false,
      },
      '/timetable': {
        target: 'https://app-8a9a7cdf-e2ae-43e0-a03e-54f85bc69503.cleverapps.io',
        changeOrigin: true,
        secure: false,
      },
      '/payroll': {
        target: 'https://app-8a9a7cdf-e2ae-43e0-a03e-54f85bc69503.cleverapps.io',
        changeOrigin: true,
        secure: false,
      },
      '/study-material': {
        target: 'https://app-8a9a7cdf-e2ae-43e0-a03e-54f85bc69503.cleverapps.io',
        changeOrigin: true,
        secure: false,
      },
      '/fee': {
        target: 'https://app-8a9a7cdf-e2ae-43e0-a03e-54f85bc69503.cleverapps.io',
        changeOrigin: true,
        secure: false,
      },
      '/tickets': {
        target: 'https://app-8a9a7cdf-e2ae-43e0-a03e-54f85bc69503.cleverapps.io',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
