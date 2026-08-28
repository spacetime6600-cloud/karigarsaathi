import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
        host: true,
        fs: {
            allow: ['..', '../..'],
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
                    'vendor-icons': ['lucide-react'],
                },
            },
        },
    },
    // @ts-expect-error - vitest environment config
    test: {
        globals: true,
        environment: 'node',
        environmentMatchGlobs: [
            ['src/test/rules/**', 'node'],
            ['../../firebase/tests/**', 'node'],
            ['src/test/**', 'jsdom'],
        ],
        setupFiles: './src/test/setup.ts',
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        fileParallelism: false,
        css: false,
    },
});
