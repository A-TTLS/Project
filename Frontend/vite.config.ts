import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { spawn } from 'node:child_process';
import type { Plugin } from 'vite';

function cloudflareQuickTunnel(): Plugin {
  return {
    name: 'caloriesnap-cloudflare-quick-tunnel',
    apply: 'serve',
    configureServer(server) {
      const tunnel = spawn(
        'cloudflared',
        ['tunnel', '--url', 'http://127.0.0.1:5173'],
        { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }
      );
      let output = '';
      let urlPrinted = false;

      const readTunnelOutput = (chunk: Buffer) => {
        output = `${output}${chunk.toString()}`.slice(-12_000);
        if (urlPrinted) return;

        const tunnelUrl = output.match(/https:\/\/(?:[a-z0-9]+-){2,}[a-z0-9]+\.trycloudflare\.com/i)?.[0];
        if (tunnelUrl) {
          urlPrinted = true;
          server.config.logger.info(`Phone preview: ${tunnelUrl}`);
          server.config.logger.info('Open this HTTPS link on your phone and allow camera access.');
        }
      };

      tunnel.stdout.on('data', readTunnelOutput);
      tunnel.stderr.on('data', readTunnelOutput);
      tunnel.on('error', (error) => {
        server.config.logger.error(`Could not start cloudflared: ${error.message}`);
      });
      tunnel.on('exit', (code) => {
        if (code && code !== 0) {
          server.config.logger.error(`cloudflared exited with code ${code}.`);
        }
      });

      server.httpServer?.once('close', () => tunnel.kill());
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflareQuickTunnel()],
  optimizeDeps: {
    exclude: ['@tensorflow/tfjs'],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      'react-native': 'react-native-web',
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    open: true,
    host: '127.0.0.1',
    allowedHosts: ['.trycloudflare.com'],
  },
});
