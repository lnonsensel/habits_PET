import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND = 'http://localhost:3000'
const backendRoutes = ['/auth', '/habits', '/goals', '/users', '/habit_records', '/goal_records', '/notifications', '/api_keys', '/api']

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: Object.fromEntries(
      backendRoutes.map(route => [route, { target: BACKEND, changeOrigin: true }])
    ),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/test/**'],
    },
  },
})
