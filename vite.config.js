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
      '/data-api/ws': {
        target: 'ws://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/data-api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          console.log('Configuring proxy for /data-api');
          
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
            console.error('Error details:', {
              url: req.url,
              method: req.method,
              headers: req.headers,
              error: err.message
            });
            
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                error: 'Proxy Error', 
                message: err.message,
                url: req.url
              }));
            }
          });
          
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request:', req.method, req.url, '→', 'http://127.0.0.1:8000' + req.url);
            console.log('Request headers:', req.headers);
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received response:', proxyRes.statusCode, req.url);
            console.log('Response headers:', proxyRes.headers);
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
