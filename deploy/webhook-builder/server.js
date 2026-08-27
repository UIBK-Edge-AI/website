/**
 * Directus Webhook Build Listener
 * Listens for Directus item publish events, validates secret token,
 * debounces rebuild requests, and deploys new static files to Nginx.
 */

const express = require('express');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = process.env.WEBHOOK_PORT || 9000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'super_secret_build_trigger_token_2026';
const DEBOUNCE_MS = 5000; // Wait 5s to batch multiple rapid edits

let buildTimer = null;
let isBuilding = false;

function triggerBuild() {
  if (isBuilding) {
    console.log('[*] Build already in progress. Queueing follow-up build...');
    clearTimeout(buildTimer);
    buildTimer = setTimeout(triggerBuild, DEBOUNCE_MS);
    return;
  }

  isBuilding = true;
  console.log('[*] [BUILD START] Triggering Astro site rebuild...');

  const scriptPath = path.join(__dirname, 'build-and-deploy.sh');
  exec(`bash "${scriptPath}"`, (error, stdout, stderr) => {
    isBuilding = false;
    if (error) {
      console.error(`[-] [BUILD ERROR]: ${error.message}`);
      console.error(stderr);
      return;
    }
    console.log('[+] [BUILD SUCCESS] Astro site successfully rebuilt and deployed to Nginx!');
    console.log(stdout);
  });
}

// Webhook endpoint
app.post('/webhook/directus', (req, res) => {
  const secretHeader = req.headers['x-webhook-secret'] || req.query.secret;

  if (secretHeader !== WEBHOOK_SECRET) {
    console.warn('[-] Unauthorized webhook attempt detected.');
    return res.status(401).json({ error: 'Unauthorized: Invalid webhook secret token' });
  }

  const { event, collection } = req.body;
  console.log(`[+] Webhook received: Event="${event}", Collection="${collection}"`);

  // Debounce rapid edits (e.g. creating item then adding images)
  clearTimeout(buildTimer);
  buildTimer = setTimeout(triggerBuild, DEBOUNCE_MS);

  res.status(202).json({
    status: 'queued',
    message: 'Rebuild triggered successfully. Deployment queued.',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    isBuilding,
    uptime: process.uptime()
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[+] Webhook listener running on http://127.0.0.1:${PORT}`);
  console.log(`[+] Webhook URL: http://127.0.0.1:${PORT}/webhook/directus`);
});
