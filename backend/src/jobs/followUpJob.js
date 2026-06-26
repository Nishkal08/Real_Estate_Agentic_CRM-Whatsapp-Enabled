const cron           = require('node-cron');
const prisma         = require('../config/db');
const twilioService  = require('../services/twilioService');

/**
 * Follow-up scheduler — runs every 5 minutes
 * Finds due follow-ups and sends them via WhatsApp
 */
cron.schedule('*/5 * * * *', async () => {
  try {
    const due = await prisma.followUp.findMany({
      where: {
        status:      'pending',
        scheduledAt: { lte: new Date() },
      },
      include: {
        lead: {
          include: { campaign: true },
        },
      },
    });

    if (due.length === 0) return;

    console.log(`[Scheduler] Processing ${due.length} due follow-ups`);

    for (const followUp of due) {
      try {
        await twilioService.sendTemplate(followUp.lead.phone, followUp.templateId);

        await prisma.followUp.update({
          where: { id: followUp.id },
          data:  { status: 'sent' },
        });

        console.log(`[Scheduler] Sent follow-up to ${followUp.lead.phone}`);
      } catch (err) {
        console.error(`[Scheduler] Failed to send follow-up ${followUp.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error in follow-up job:', err);
  }
});

console.log('[Scheduler] Follow-up job registered (every 5 minutes)');
