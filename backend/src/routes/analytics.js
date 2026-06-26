const { Router } = require('express');
const analyticsService = require('../services/analyticsService');
const auth = require('../middleware/auth');

const router = Router();

// GET /api/analytics/overview
router.get('/overview', auth, async (req, res, next) => {
  try {
    const stats = await analyticsService.getOverview(req.user.businessId, req.query.range);
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

// GET /api/analytics/campaign/:id
router.get('/campaign/:id', auth, async (req, res, next) => {
  try {
    const data = await analyticsService.getCampaignAnalytics(req.params.id, req.user.businessId);
    if (!data) return res.status(404).json({ success: false, error: 'Campaign not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET /api/analytics/activity
router.get('/activity', auth, async (req, res, next) => {
  try {
    const activities = await analyticsService.getActivities(req.user.businessId);
    res.json({ success: true, data: activities });
  } catch (err) { next(err); }
});

module.exports = router;
