import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { handleApiRequest } from './server/apiHandler.js';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'backend-api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api')) {
              try {
                await handleApiRequest(req, res);
              } catch (err) {
                console.error('API middleware error:', err);
                if (!res.headersSent) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                }
              }
              return;
            }

            if (req.url && req.url.startsWith('/figures/')) {
              try {
                const fs = await import('node:fs');
                const path = await import('node:path');
                const filename = path.basename(req.url.split('?')[0]);
                const baseNameNoExt = filename.replace(/\.[^.]+$/, '');
                
                const candidates = [
                  path.resolve(process.cwd(), 'public', 'figures', filename),
                  path.resolve(process.cwd(), 'figures', filename),
                  path.resolve(process.cwd(), 'public', 'figures', `${baseNameNoExt}.png`),
                  path.resolve(process.cwd(), 'figures', `${baseNameNoExt}.png`),
                ];

                for (const candidate of candidates) {
                  if (fs.existsSync(candidate)) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', candidate.endsWith('.png') ? 'image/png' : 'image/jpeg');
                    fs.createReadStream(candidate).pipe(res);
                    return;
                  }
                }
              } catch (figErr) {
                console.warn('Figures middleware error:', figErr.message);
              }
            }

            next();
          });
        },
      },
    ],
    server: {
      port: 5173,
    },
  };
});
