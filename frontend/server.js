import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import babel from '@babel/core';
import http from 'http';
import https from 'https';
import os from 'os';
import selfsigned from 'selfsigned';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;
const HTTPS_PORT = process.env.HTTPS_PORT || 5174;
const HOST = process.env.HOST || '0.0.0.0';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

// Helper to retrieve LAN IPv4 addresses
function getNetworkIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({ name, address: iface.address });
      }
    }
  }
  return ips;
}

// Generate or load development SSL certificate for HTTPS
async function getOrCreateDevCert(lanIps) {
  const certDir = path.join(__dirname, '.cert');
  const certPath = path.join(certDir, 'dev-cert.pem');
  const keyPath = path.join(certDir, 'dev-key.pem');

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    try {
      const cert = fs.readFileSync(certPath, 'utf8');
      const key = fs.readFileSync(keyPath, 'utf8');
      return { cert, key };
    } catch (e) {}
  }

  const attrs = [{ name: 'commonName', value: 'BUS-LINK Dev Server' }];
  const altNames = [
    { type: 2, value: 'localhost' },
    { type: 7, ip: '127.0.0.1' }
  ];
  lanIps.forEach(ip => {
    altNames.push({ type: 7, ip: ip.address });
  });

  const pems = await selfsigned.generate(attrs, {
    days: 365,
    algorithm: 'sha256',
    extensions: [{ name: 'subjectAltName', altNames }]
  });

  try {
    if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true });
    fs.writeFileSync(certPath, pems.cert, 'utf8');
    fs.writeFileSync(keyPath, pems.private, 'utf8');
  } catch (e) {}

  return { cert: pems.cert, key: pems.private };
}

// API Proxy to Spring Boot Backend
// Forwards same-origin /api requests directly to Spring Boot on localhost:8080
app.use('/api', (req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: 8080,
    path: '/api' + req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: 'localhost:8080',
      'x-forwarded-for': req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      'x-forwarded-proto': req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http')
    }
  };

  const proxy = http.request(options, (backendRes) => {
    res.writeHead(backendRes.statusCode, backendRes.headers);
    backendRes.pipe(res, { end: true });
  });

  proxy.on('error', (err) => {
    res.status(502).json({ 
      success: false, 
      message: 'Backend connection error (Spring Boot not reachable on localhost:8080): ' + err.message 
    });
  });

  req.pipe(proxy, { end: true });
});

// Transpile JSX/JS files on the fly using Babel (Zero native C++ binary dependencies)
app.use((req, res, next) => {
  if (!req.path.includes('/dist/') && (req.path.endsWith('.jsx') || req.path.endsWith('.js'))) {
    const filePath = path.join(__dirname, req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      try {
        const code = fs.readFileSync(filePath, 'utf8');
        const result = babel.transformSync(code, {
          filename: filePath,
          presets: ['@babel/preset-react', ['@babel/preset-env', { modules: false }]],
          sourceMaps: 'inline'
        });
        res.type('application/javascript');
        return res.send(result.code);
      } catch (err) {
        console.error('Babel transform error for:', filePath, err);
        return res.status(500).send(`/* Babel Error: ${err.message} */`);
      }
    }
  }
  next();
});

// Prevent browser and proxy caching of application scripts, API responses, and index.html
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Serve public static files with explicit no-cache headers
app.use(express.static(__dirname, {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// HTML SPA Fallback for React Router
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found');
  }
});

// Start Servers (Both HTTP on 5173 and HTTPS on 5174 for mobile GPS testing)
async function startServers() {
  const netIps = getNetworkIps();

  // 1. HTTP Server
  const httpServer = http.createServer(app);
  httpServer.listen(PORT, HOST, () => {
    console.log(`=======================================================`);
    console.log(`🚀 BUS-LINK Frontend Dev Server (HTTP)`);
    console.log(`➜ Local:   http://localhost:${PORT}`);
    if (netIps.length > 0) {
      netIps.forEach(ip => {
        console.log(`➜ Network: http://${ip.address}:${PORT} (${ip.name})`);
      });
    }
    console.log(`🔗 Proxied /api -> ${BACKEND_URL}`);
  });

  // 2. HTTPS Server (Enables Secure Context on Mobile Devices for Real GPS)
  try {
    const { cert, key } = await getOrCreateDevCert(netIps);
    const httpsServer = https.createServer({ cert, key }, app);
    httpsServer.listen(HTTPS_PORT, HOST, () => {
      console.log(`-------------------------------------------------------`);
      console.log(`🔒 BUS-LINK Secure Context HTTPS Server (Mobile GPS Ready)`);
      console.log(`➜ Local HTTPS:   https://localhost:${HTTPS_PORT}`);
      if (netIps.length > 0) {
        netIps.forEach(ip => {
          console.log(`➜ Network HTTPS: https://${ip.address}:${HTTPS_PORT} (${ip.name})`);
        });
      }
      console.log(`📱 Connect your Android/iPhone to the Network HTTPS URL to use Real GPS.`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.warn(`[HTTPS Warning] Could not start HTTPS dev server:`, err.message);
  }
}

startServers();
