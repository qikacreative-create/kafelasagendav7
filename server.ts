import express from 'express';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  const port = 3000;

  // 1. Proxy endpoint untuk mengambil gambar tanpa masalah CORS
  app.get('/api/proxy-image', async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send('Missing url parameter');
    }

    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      const base64 = buffer.toString('base64');
      const contentType = response.headers['content-type'];
      res.send(`data:${contentType};base64,${base64}`);
    } catch (error) {
      console.error('Proxy image error:', error);
      res.status(500).send('Failed to proxy image');
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(process.cwd(), 'dist');

  if (isProduction && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // 2. Setup Vite (untuk frontend development)
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();

