const { Router } = require('express');
const auth = require('../middleware/auth');
const prisma = require('../config/db');
const ApiError = require('../utils/apiError');

const router = Router();

// Middleware to ensure user is admin
function requireAdmin(req, res, next) {
  if (req.user?.email !== 'nishkal2005@gmail.com') {
    return next(ApiError.forbidden('Forbidden: Admin access required'));
  }
  next();
}

// GET /api/admin/stats — Retrieve overall platform metrics
router.get('/stats', auth, requireAdmin, async (req, res, next) => {
  try {
    const [businessesCount, leadsCount, campaignsCount, messagesCount] = await Promise.all([
      prisma.business.count(),
      prisma.lead.count(),
      prisma.campaign.count(),
      prisma.message.count(),
    ]);

    res.json({
      success: true,
      data: {
        businesses: businessesCount,
        leads: leadsCount,
        campaigns: campaignsCount,
        messages: messagesCount
      }
    });
  } catch (err) { next(err); }
});

// GET /api/admin/businesses — Retrieve all businesses on the platform
router.get('/businesses', auth, requireAdmin, async (req, res, next) => {
  try {
    const businesses = await prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            leads: true,
            campaigns: true,
            teamMembers: true,
            conversations: true
          }
        }
      }
    });

    const mapped = businesses.map(b => ({
      id: b.id,
      name: b.name,
      email: b.ownerEmail,
      plan: b.plan,
      waNumber: b.waNumber,
      createdAt: b.createdAt,
      stats: {
        leads: b._count.leads,
        campaigns: b._count.campaigns,
        teamMembers: b._count.teamMembers,
        conversations: b._count.conversations
      }
    }));

    res.json({ success: true, data: mapped });
  } catch (err) { next(err); }
});

// DELETE /api/admin/businesses/:id — Delete a business completely
router.delete('/businesses/:id', auth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const targetBiz = await prisma.business.findUnique({ where: { id } });
    if (!targetBiz) throw ApiError.notFound('Business not found');

    if (targetBiz.ownerEmail === 'nishkal2005@gmail.com') {
      throw ApiError.forbidden('Cannot delete the Admin business');
    }

    // Safe dependency wipeout for the business
    const leads = await prisma.lead.findMany({ where: { businessId: id }, select: { id: true } });
    const leadIds = leads.map(l => l.id);

    if (leadIds.length > 0) {
      await prisma.followUp.deleteMany({ where: { leadId: { in: leadIds } } });
      await prisma.message.deleteMany({ where: { conversation: { leadId: { in: leadIds } } } });
      await prisma.conversation.deleteMany({ where: { leadId: { in: leadIds } } });
      await prisma.lead.deleteMany({ where: { id: { in: leadIds } } });
    }

    await prisma.appointment.deleteMany({ where: { businessId: id } });
    await prisma.kbDocument.deleteMany({ where: { kb: { businessId: id } } });
    await prisma.knowledgeBase.deleteMany({ where: { businessId: id } });
    await prisma.campaignAnalytics.deleteMany({ where: { campaign: { businessId: id } } });
    await prisma.campaign.deleteMany({ where: { businessId: id } });
    await prisma.teamMember.deleteMany({ where: { businessId: id } });

    // Wipe Business
    await prisma.business.delete({ where: { id } });

    res.json({ success: true, message: 'Business successfully deleted' });
  } catch (err) { next(err); }
});

// PUT /api/admin/businesses/:id/plan — Update a business plan
router.put('/businesses/:id/plan', auth, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;

    if (!['starter', 'pro', 'enterprise'].includes(plan)) {
      throw ApiError.badRequest('Invalid plan type');
    }

    const updated = await prisma.business.update({
      where: { id },
      data: { plan },
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// POST /api/admin/businesses — Create a new business account
router.post('/businesses', auth, requireAdmin, async (req, res, next) => {
  try {
    const { name, email, password, plan } = req.body;

    if (!name || !email || !password) {
      throw ApiError.badRequest('Missing required fields (name, email, password)');
    }

    const existing = await prisma.business.findUnique({ where: { ownerEmail: email } });
    if (existing) throw ApiError.conflict('Email already registered');

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const business = await prisma.business.create({
      data: {
        name,
        ownerEmail: email,
        passwordHash,
        plan: plan || 'starter',
      },
    });

    res.status(201).json({ success: true, data: business });
  } catch (err) { next(err); }
});

module.exports = router;
