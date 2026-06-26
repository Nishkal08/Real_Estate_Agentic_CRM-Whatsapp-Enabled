const { Router } = require('express');
const campaignService = require('../services/campaignService');
const auth     = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = Router();

// POST /api/campaigns
router.post('/', auth, validate(['name']), async (req, res, next) => {
  try {
    const campaign = await campaignService.createCampaign(req.user.businessId, req.body);
    res.status(201).json({ success: true, data: campaign });
  } catch (err) { next(err); }
});

// GET /api/campaigns
router.get('/', auth, async (req, res, next) => {
  try {
    const campaigns = await campaignService.listCampaigns(req.user.businessId);
    res.json({ success: true, data: campaigns });
  } catch (err) { next(err); }
});

// GET /api/campaigns/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const campaign = await campaignService.getCampaignById(req.params.id, req.user.businessId);
    res.json({ success: true, data: campaign });
  } catch (err) { next(err); }
});

// PUT /api/campaigns/:id
router.put('/:id', auth, async (req, res, next) => {
  try {
    const campaign = await campaignService.updateCampaign(req.params.id, req.user.businessId, req.body);
    res.json({ success: true, data: campaign });
  } catch (err) { next(err); }
});

// POST /api/campaigns/:id/launch
router.post('/:id/launch', auth, async (req, res, next) => {
  try {
    const result = await campaignService.launchCampaign(req.params.id, req.user.businessId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// POST /api/campaigns/:id/pause
router.post('/:id/pause', auth, async (req, res, next) => {
  try {
    const result = await campaignService.pauseCampaign(req.params.id, req.user.businessId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// DELETE /api/campaigns/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const result = await campaignService.deleteCampaign(req.params.id, req.user.businessId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

module.exports = router;
