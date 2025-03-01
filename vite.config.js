import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    port: 5173,
    https: false, // Enable HTTPS
    proxy: {
      '/user-api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/data-api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/python-api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.replace(/^\/python-api/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received response:', proxyRes.statusCode, req.url);
          });
        },
        allowedHosts: ['molytica.ai'],
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
