const prisma = require('../config/db');

function getStartDateForRange(range) {
  if (!range || range === 'All time') return null;
  const days = range === 'Last 7 days' ? 7 : range === 'Last 14 days' ? 14 : range === 'Last 30 days' ? 30 : null;
  if (!days) return null;
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Dashboard overview stats
 */
async function getOverview(businessId, range = 'Last 14 days') {
  const startDate = getStartDateForRange(range);
  
  const leadWhere = { businessId };
  const messageWhere = { conversation: { businessId } };
  
  if (startDate) {
    leadWhere.createdAt = { gte: startDate };
    messageWhere.timestamp = { gte: startDate };
  }

  const [
    totalLeads,
    activeCampaigns,
    totalMessages,
    repliedLeads,
    qualifiedLeads,
    hotLeads,
    convertedLeads,
  ] = await Promise.all([
    prisma.lead.count({ where: leadWhere }),
    prisma.campaign.count({ where: { businessId, status: 'active' } }),
    prisma.message.count({ where: messageWhere }),
    prisma.lead.count({
      where: {
        ...leadWhere,
        conversation: {
          messages: {
            some: { role: 'lead' }
          }
        }
      }
    }),
    prisma.lead.count({ where: { ...leadWhere, qualificationScore: { gte: 3 } } }),
    prisma.lead.count({ where: { ...leadWhere, status: 'hot' } }),
    prisma.lead.count({ where: { ...leadWhere, status: 'converted' } }),
  ]);

  // Today's message count
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMessages = await prisma.message.count({
    where: {
      conversation: { businessId },
      timestamp: { gte: todayStart },
    },
  });

  // Calculate dailyStats for message volume chart
  const messages = await prisma.message.findMany({
    where: messageWhere,
    select: { role: true, timestamp: true },
    orderBy: { timestamp: 'asc' }
  });

  const daysCount = range === 'Last 7 days' ? 7 : range === 'Last 14 days' ? 14 : range === 'Last 30 days' ? 30 : 30; // default 30 days
  const dailyStats = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const startOfDay = new Date(d);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);
    
    const dayMessages = messages.filter(m => {
      const ts = new Date(m.timestamp);
      return ts >= startOfDay && ts <= endOfDay;
    });
    
    const sent = dayMessages.filter(m => m.role === 'agent' || m.role === 'human').length;
    const received = dayMessages.filter(m => m.role === 'lead').length;
    
    dailyStats.push({
      date: dateStr,
      sent,
      received
    });
  }

  return {
    totalLeads,
    activeCampaigns,
    messagesSent:   totalMessages,
    qualifiedLeads,
    hotLeads,
    convertedLeads,
    todayMessages,
    avgReplyRate:    totalLeads > 0 ? Math.round((repliedLeads / totalLeads) * 100) : 0,
    avgQualRate:     totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0,
    activeLeads:     hotLeads,
    dailyStats
  };
}

/**
 * Per-campaign analytics
 */
async function getCampaignAnalytics(campaignId, businessId) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, businessId },
    include: { _count: { select: { leads: true } } },
  });
  if (!campaign) return null;

  const statusCounts = await prisma.lead.groupBy({
    by: ['status'],
    where: { campaignId },
    _count: true,
  });

  const messageCount = await prisma.message.count({
    where: { conversation: { lead: { campaignId } } },
  });

  const analytics = await prisma.campaignAnalytics.findMany({
    where: { campaignId },
    orderBy: { date: 'desc' },
    take: 30,
  });

  return {
    campaignId,
    campaignName:    campaign.name,
    totalLeads:      campaign._count.leads,
    statusBreakdown: statusCounts.reduce((acc, s) => {
      acc[s.status] = s._count;
      return acc;
    }, {}),
    totalMessages:   messageCount,
    dailyAnalytics:  analytics,
  };
}

async function getActivities(businessId) {
  const [messages, appointments, hotLeads] = await Promise.all([
    prisma.message.findMany({
      where: { conversation: { businessId } },
      orderBy: { timestamp: 'desc' },
      take: 15,
      include: { conversation: { include: { lead: true } } }
    }),
    prisma.appointment.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 15
    }),
    prisma.lead.findMany({
      where: { businessId, status: 'hot' },
      orderBy: { createdAt: 'desc' },
      take: 15
    })
  ]);

  const activities = [];

  // Map messages to activities
  for (const msg of messages) {
    const leadName = msg.conversation?.lead?.name || 'Customer';
    const leadId = msg.conversation?.lead?.id || null;
    if (msg.role === 'lead') {
      activities.push({
        id: `msg_rec_${msg.id}`,
        type: 'message_received',
        title: `New message from ${leadName}`,
        description: msg.content,
        timestamp: msg.timestamp.toISOString ? msg.timestamp.toISOString() : msg.timestamp,
        read: true,
        leadId
      });
    } else if (msg.role === 'agent') {
      activities.push({
        id: `msg_sent_${msg.id}`,
        type: 'message_sent',
        title: `Agent replied to ${leadName}`,
        description: msg.content,
        timestamp: msg.timestamp.toISOString ? msg.timestamp.toISOString() : msg.timestamp,
        read: true,
        leadId
      });
    } else if (msg.role === 'human') {
      activities.push({
        id: `msg_hum_${msg.id}`,
        type: 'message_sent',
        title: `You replied to ${leadName}`,
        description: msg.content,
        timestamp: msg.timestamp.toISOString ? msg.timestamp.toISOString() : msg.timestamp,
        read: true,
        leadId
      });
    }
  }

  // Map appointments to activities
  for (const app of appointments) {
    const lead = await prisma.lead.findFirst({
      where: { phone: app.phone, businessId }
    });
    activities.push({
      id: `app_${app.id}`,
      type: 'appointment_booked',
      title: app.isAIBooked ? 'AI booked appointment' : 'Rep booked appointment',
      description: `${app.leadName} — Site Survey on ${app.date} at ${app.time}`,
      timestamp: app.createdAt.toISOString ? app.createdAt.toISOString() : app.createdAt,
      read: true,
      leadId: lead ? lead.id : null
    });
  }

  // Map hot leads to activities
  for (const lead of hotLeads) {
    activities.push({
      id: `lead_hot_${lead.id}`,
      type: 'hot_lead',
      title: 'Hot Lead Detected',
      description: `${lead.name} scored ${lead.qualificationScore}/4`,
      timestamp: lead.createdAt.toISOString ? lead.createdAt.toISOString() : lead.createdAt,
      read: true,
      leadId: lead.id
    });
  }

  // Sort unified activities by timestamp descending
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Return the top 20 latest activities
  return activities.slice(0, 20);
}

module.exports = { getOverview, getCampaignAnalytics, getActivities };
