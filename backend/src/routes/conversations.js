const { Router } = require('express');
const conversationService = require('../services/conversationService');
const auth     = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = Router();

// GET /api/conversations
router.get('/', auth, async (req, res, next) => {
  try {
    const result = await conversationService.listConversations(req.user.businessId, {
      page:  parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /api/conversations/:id/messages
router.get('/:id/messages', auth, async (req, res, next) => {
  try {
    const data = await conversationService.getMessages(req.params.id, req.user.businessId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// POST /api/conversations/:id/takeover
router.post('/:id/takeover', auth, async (req, res, next) => {
  try {
    const result = await conversationService.takeoverConversation(req.params.id, req.user.businessId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// POST /api/conversations/:id/release
router.post('/:id/release', auth, async (req, res, next) => {
  try {
    const result = await conversationService.releaseConversation(req.params.id, req.user.businessId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// POST /api/conversations/:id/human-message
router.post('/:id/human-message', auth, validate(['content']), async (req, res, next) => {
  try {
    const message = await conversationService.sendHumanMessage(
      req.params.id, req.user.businessId, req.body.content
    );
    res.json({ success: true, data: message });
  } catch (err) { next(err); }
});

module.exports = router;
