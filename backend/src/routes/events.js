const { Router } = require('express');
const sseService = require('../services/sseService');
const auth = require('../middleware/auth');

const router = Router();

// GET /api/events — SSE stream
router.get('/', auth, (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // nginx compatibility
  res.flushHeaders();

  // Send initial connected event
  res.write(`data: ${JSON.stringify({ type: 'connected', data: { businessId: req.user.businessId }, ts: Date.now() })}\n\n`);

  // Register client
  sseService.addClient(req.user.businessId, res);

  // Heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

module.exports = router;
