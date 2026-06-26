const { Router } = require('express');
const agentService = require('../services/agentService');
const auth         = require('../middleware/auth');
const validate     = require('../middleware/validate');

const router = Router();

// POST /api/content/generate
router.post('/generate', auth, validate(['brief']), async (req, res, next) => {
  try {
    const { type, brief, tone, platforms } = req.body;
    const result = await agentService.generateContent({ type, brief, tone, platforms });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
