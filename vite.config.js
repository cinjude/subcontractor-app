import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000
    },
    build: {
        outDir: 'dist',
        chunkSizeWarningLimit: 2000,
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'bootstrap': ['bootstrap'],
                    'pdf': ['jspdf', 'jspdf-autotable'],
                    'charts': ['html2canvas'],
                }
            }
        }
    }
})