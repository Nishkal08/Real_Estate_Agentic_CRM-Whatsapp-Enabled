/**
 * Centralized mock data for the AI Operations Platform
 * SolarBright — demo company based in Ahmedabad
 */

// =============================================
// COMPANY / BUSINESS PROFILE
// =============================================
export const mockBusiness = {
  id: 'biz_solarbright_001',
  name: 'SolarBright Solutions',
  shortName: 'SolarBright',
  email: 'contact@solarbright.in',
  phone: '+919876543200',
  city: 'Ahmedabad',
  state: 'Gujarat',
  whatsappConnected: true,
  whatsappNumber: '+14155238886',
  calendarConnected: true,
  kbConnected: true,
  plan: 'demo',
  createdAt: '2024-01-15T09:00:00Z',
};

// =============================================
// LEADS
// =============================================
export const mockLeads = [
  {
    id: 'lead_001',
    name: 'Ramesh Patel',
    phone: '+919876543211',
    email: 'ramesh.patel@gmail.com',
    company: 'Patel Textiles',
    city: 'Surat',
    source: 'Website',
    status: 'hot',
    qualificationScore: 4,
    campaignId: 'camp_001',
    campaignName: 'Summer Solar Push',
    lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastMessage: 'Please send me the installation cost for 5kW system. When can we schedule a site visit?',
    totalMessages: 8,
    createdAt: '2024-06-10T10:30:00Z',
    intentSignals: ['asked_price', 'mentioned_timeline', 'requested_callback'],
    isHuman: false,
  },
  {
    id: 'lead_002',
    name: 'Priya Sharma',
    phone: '+919876543212',
    email: 'priya.sharma@outlook.com',
    company: null,
    city: 'Ahmedabad',
    source: 'Facebook Ad',
    status: 'qualified',
    qualificationScore: 3,
    campaignId: 'camp_001',
    campaignName: 'Summer Solar Push',
    lastMessageAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    lastMessage: 'Yes, I am interested in the residential solar plan. My monthly bill is around ₹4,500.',
    totalMessages: 5,
    createdAt: '2024-06-11T14:20:00Z',
    intentSignals: ['shared_bill_amount', 'confirmed_interest'],
    isHuman: false,
  },
  {
    id: 'lead_003',
    name: 'Arjun Mehta',
    phone: '+919876543213',
    email: null,
    company: 'Mehta Industries',
    city: 'Vadodara',
    source: 'Excel Import',
    status: 'nurturing',
    qualificationScore: 2,
    campaignId: 'camp_001',
    campaignName: 'Summer Solar Push',
    lastMessageAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    lastMessage: 'What is the government subsidy available for commercial installations?',
    totalMessages: 3,
    createdAt: '2024-06-12T09:00:00Z',
    intentSignals: ['asked_subsidy'],
    isHuman: false,
  },
  {
    id: 'lead_004',
    name: 'Kavita Desai',
    phone: '+919876543214',
    email: 'kavita.d@gmail.com',
    company: null,
    city: 'Rajkot',
    source: 'Referral',
    status: 'converted',
    qualificationScore: 4,
    campaignId: 'camp_002',
    campaignName: 'Industrial Solar Q1',
    lastMessageAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastMessage: 'Great! Looking forward to the installation on 25th June.',
    totalMessages: 12,
    createdAt: '2024-05-20T11:00:00Z',
    intentSignals: ['confirmed_appointment', 'deal_closed'],
    isHuman: true,
  },
  {
    id: 'lead_005',
    name: 'Suresh Kumar',
    phone: '+919876543215',
    email: 'suresh.k@yahoo.com',
    company: null,
    city: 'Anand',
    source: 'Excel Import',
    status: 'cold',
    qualificationScore: 0,
    campaignId: 'camp_001',
    campaignName: 'Summer Solar Push',
    lastMessageAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastMessage: 'Not interested right now.',
    totalMessages: 2,
    createdAt: '2024-06-08T16:00:00Z',
    intentSignals: [],
    isHuman: false,
  },
];

// =============================================
// CONVERSATIONS
// =============================================
export const mockConversations = {
  lead_001: [
    {
      id: 'msg_001_1',
      role: 'agent',
      content: 'Hello Ramesh! 👋 I\'m the AI assistant from SolarBright Solutions. We noticed you visited our website and might be interested in switching to solar energy. Can I tell you a bit about our residential and commercial packages?',
      timestamp: '2024-06-15T10:00:00Z',
    },
    {
      id: 'msg_001_2',
      role: 'lead',
      content: 'Yes, I am interested. What are the options for a small factory?',
      timestamp: '2024-06-15T10:15:00Z',
    },
    {
      id: 'msg_001_3',
      role: 'agent',
      content: 'Great question! For commercial setups like factories, we typically recommend our Industrial Solar Package:\n\n- 5kW to 50kW capacity range\n- ROI within 3 to 4 years\n- Up to 40% government subsidy available\n- Net metering — sell excess power back to the grid\n\nCould you tell me your approximate monthly electricity bill? That helps us calculate the exact system size.',

      timestamp: '2024-06-15T10:16:00Z',
    },
    {
      id: 'msg_001_4',
      role: 'lead',
      content: 'Our monthly bill is around ₹25,000 to ₹30,000.',
      timestamp: '2024-06-15T11:30:00Z',
    },
    {
      id: 'msg_001_5',
      role: 'agent',
      content: 'Perfect! With a ₹25,000–30,000 monthly bill, you\'d be looking at a **10–15 kW system**. Here\'s a quick estimate:\n\n• System cost: ₹6–8 lakhs\n• After 40% subsidy: ~₹3.6–4.8 lakhs\n• Monthly savings: ₹18,000–22,000\n• Break-even: ~22 months\n\nWould you like to schedule a free site survey? Our engineer can give you an exact quote.',
      timestamp: '2024-06-15T11:17:00Z',
    },
    {
      id: 'msg_001_6',
      role: 'lead',
      content: 'Yes! How much will the 5kW system cost? And can we do site visit next week?',
      timestamp: '2024-06-15T12:00:00Z',
    },
    {
      id: 'msg_001_7',
      role: 'agent',
      content: 'Absolutely! A 5kW system would cost approximately ₹2.8–3.2 lakhs before subsidy, or ₹1.7–2 lakhs after the 40% PM KUSUM subsidy.\n\nI\'ve flagged your interest for a site visit — our team will call you to confirm a slot for next week! 📅\n\nIs morning (9 AM – 1 PM) or afternoon (2 PM – 6 PM) better for you?',
      timestamp: '2024-06-15T12:01:00Z',
    },
    {
      id: 'msg_001_8',
      role: 'lead',
      content: 'Please send me the installation cost for 5kW system. When can we schedule a site visit?',
      timestamp: '2024-06-15T14:00:00Z',
    },
  ],
  lead_002: [
    {
      id: 'msg_002_1',
      role: 'agent',
      content: 'Hello Priya! This is SolarBright AI Assistant. You recently showed interest in our residential solar plans — would you like to explore options for your home?',
      timestamp: '2024-06-16T09:00:00Z',
    },
    {
      id: 'msg_002_2',
      role: 'lead',
      content: 'Yes, what plans do you have for residential?',
      timestamp: '2024-06-16T09:30:00Z',
    },
    {
      id: 'msg_002_3',
      role: 'agent',
      content: 'We have three residential packages:\n\n- Starter (2kW) — For bills up to Rs. 2,000/month\n- Standard (3–5kW) — For bills Rs. 2,000–6,000/month\n- Premium (5–10kW) — For bills above Rs. 6,000/month\n\nWhat is your approximate monthly electricity bill?',
      timestamp: '2024-06-16T09:31:00Z',
    },
    {
      id: 'msg_002_4',
      role: 'lead',
      content: 'Around ₹4,500 per month.',
      timestamp: '2024-06-16T10:00:00Z',
    },
    {
      id: 'msg_002_5',
      role: 'lead',
      content: 'Yes, I am interested in the residential solar plan. My monthly bill is around ₹4,500.',
      timestamp: '2024-06-16T10:05:00Z',
    },
  ],
  lead_003: [
    {
      id: 'msg_003_1',
      role: 'agent',
      content: 'Hello Arjun! I\'m reaching out from SolarBright Solutions. Are you looking for industrial solar solutions for Mehta Industries?',
      timestamp: '2024-06-17T11:00:00Z',
    },
    {
      id: 'msg_003_2',
      role: 'lead',
      content: 'What is the government subsidy available for commercial installations?',
      timestamp: '2024-06-17T15:00:00Z',
    },
    {
      id: 'msg_003_3',
      role: 'agent',
      content: 'Great question! For commercial and industrial solar in Gujarat:\n\n- PM KUSUM Scheme — 40% subsidy for systems up to 10kW\n- Gujarat Solar Policy — Additional state subsidy of 10–15%\n- Accelerated Depreciation — 40% depreciation in first year\n\nFor Mehta Industries specifically, your total effective cost could be 35–50% lower than MRP. Would you like a detailed breakdown for your factory consumption?',
      timestamp: '2024-06-17T15:02:00Z',
    },
  ],
};

// =============================================
// CAMPAIGNS
// =============================================
export const mockCampaigns = [
  {
    id: 'camp_001',
    name: 'Summer Solar Push',
    status: 'active',
    tone: 'friendly',
    totalLeads: 4,
    messagesent: 18,
    replied: 12,
    qualified: 2,
    converted: 0,
    replyRate: 66.7,
    qualRate: 16.7,
    kbId: 'kb_001',
    kbName: 'SolarBright Product KB',
    sendWindowStart: '09:00',
    sendWindowEnd: '18:00',
    followupDays: [1, 3, 7],
    launchedAt: '2024-06-10T09:00:00Z',
    description: 'Outbound campaign targeting residential and small commercial prospects in Gujarat.',
  },
  {
    id: 'camp_002',
    name: 'Industrial Solar Q1',
    status: 'completed',
    tone: 'professional',
    totalLeads: 15,
    messagesent: 52,
    replied: 38,
    qualified: 9,
    converted: 3,
    replyRate: 73.1,
    qualRate: 60.0,
    kbId: 'kb_001',
    kbName: 'SolarBright Product KB',
    sendWindowStart: '10:00',
    sendWindowEnd: '17:00',
    followupDays: [2, 5],
    launchedAt: '2024-03-01T09:00:00Z',
    completedAt: '2024-04-15T18:00:00Z',
    description: 'Q1 push targeting industrial clients in Vadodara and Surat districts.',
  },
  {
    id: 'camp_003',
    name: 'Monsoon Maintenance Drive',
    status: 'scheduled',
    tone: 'caring',
    totalLeads: 0,
    messagesent: 0,
    replied: 0,
    qualified: 0,
    converted: 0,
    replyRate: 0,
    qualRate: 0,
    kbId: 'kb_001',
    kbName: 'SolarBright Product KB',
    sendWindowStart: '10:00',
    sendWindowEnd: '16:00',
    followupDays: [3, 7],
    scheduledFor: '2024-07-01T09:00:00Z',
    launchedAt: null,
    description: 'Pre-monsoon maintenance reminders for existing customers.',
  },
];

// =============================================
// KNOWLEDGE BASE
// =============================================
export const mockKBDocuments = [
  {
    id: 'doc_001',
    name: 'SolarBright Product Catalog 2024.pdf',
    type: 'pdf',
    size: 2457600, // 2.4 MB
    chunks: 48,
    status: 'ready',
    uploadedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'doc_002',
    name: 'Installation & Warranty Guide.pdf',
    type: 'pdf',
    size: 1024000, // 1 MB
    chunks: 22,
    status: 'ready',
    uploadedAt: '2024-02-05T14:30:00Z',
  },
  {
    id: 'doc_003',
    name: 'Government Subsidy Schemes 2024.docx',
    type: 'docx',
    size: 358400, // 350 KB
    chunks: 15,
    status: 'ready',
    uploadedAt: '2024-03-10T09:15:00Z',
  },
  {
    id: 'doc_004',
    name: 'FAQ — Customer Common Questions',
    type: 'url',
    size: 0,
    chunks: 8,
    status: 'ready',
    uploadedAt: '2024-04-01T16:00:00Z',
    url: 'https://solarbright.in/faq',
  },
];

// =============================================
// APPOINTMENTS (BOOKING AGENT)
// =============================================
const today = new Date();
const todayStr = today.toISOString().split('T')[0];

export const mockAppointments = [
  {
    id: 'apt_001',
    leadName: 'Ramesh Patel',
    leadPhone: '+919876543211',
    type: 'Site Survey',
    date: todayStr,
    time: '10:00',
    duration: 60,
    status: 'confirmed',
    isAIBooked: true,
    notes: 'Factory in GIDC Surat, 10kW system evaluation',
    isActive: true,
  },
  {
    id: 'apt_002',
    leadName: 'Priya Sharma',
    leadPhone: '+919876543212',
    type: 'Consultation Call',
    date: todayStr,
    time: '14:30',
    duration: 30,
    status: 'pending',
    isAIBooked: true,
    notes: 'Residential 3kW system inquiry',
    isActive: false,
  },
  {
    id: 'apt_003',
    leadName: 'Vijay Nair',
    leadPhone: '+919876543220',
    type: 'Installation Walkthrough',
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '11:00',
    duration: 90,
    status: 'confirmed',
    isAIBooked: false,
    notes: 'Residential installation in Bopal, Ahmedabad',
    isActive: false,
  },
  {
    id: 'apt_004',
    leadName: 'Arjun Mehta',
    leadPhone: '+919876543213',
    type: 'Site Survey',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '15:00',
    duration: 60,
    status: 'pending',
    isAIBooked: true,
    notes: 'Industrial unit in Vadodara — 20kW estimate requested',
    isActive: false,
  },
  {
    id: 'apt_005',
    leadName: 'Kavita Desai',
    leadPhone: '+919876543214',
    type: 'Follow-up Call',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '16:00',
    duration: 30,
    status: 'completed',
    isAIBooked: false,
    notes: 'Post-installation satisfaction check',
    isActive: false,
  },
  {
    id: 'apt_006',
    leadName: 'Kiran Joshi',
    leadPhone: '+919876543225',
    type: 'Consultation Call',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '11:30',
    duration: 30,
    status: 'no_show',
    isAIBooked: true,
    notes: 'Did not pick up. Need re-scheduling.',
    isActive: false,
  },
];

// Booking stats
export const mockBookingStats = {
  todayTotal: 2,
  weekTotal: 8,
  aiBooked: 5,
  manualBooked: 3,
  noShows: 1,
  confirmed: 6,
  pending: 1,
};

// Weekly availability settings
export const mockAvailability = {
  monday:    { enabled: true,  start: '09:00', end: '18:00' },
  tuesday:   { enabled: true,  start: '09:00', end: '18:00' },
  wednesday: { enabled: true,  start: '09:00', end: '18:00' },
  thursday:  { enabled: true,  start: '09:00', end: '18:00' },
  friday:    { enabled: true,  start: '09:00', end: '17:00' },
  saturday:  { enabled: true,  start: '10:00', end: '14:00' },
  sunday:    { enabled: false, start: '09:00', end: '18:00' },
};

// Time slots for selected day
export const mockTimeSlots = [
  { time: '09:00', status: 'booked',    appointment: mockAppointments[0] },
  { time: '09:30', status: 'open' },
  { time: '10:00', status: 'open' },
  { time: '10:30', status: 'open' },
  { time: '11:00', status: 'open' },
  { time: '11:30', status: 'open' },
  { time: '12:00', status: 'blocked',   label: 'Lunch Break' },
  { time: '12:30', status: 'blocked',   label: 'Lunch Break' },
  { time: '13:00', status: 'open' },
  { time: '13:30', status: 'open' },
  { time: '14:00', status: 'open' },
  { time: '14:30', status: 'booked',    appointment: mockAppointments[1] },
  { time: '15:00', status: 'open' },
  { time: '15:30', status: 'open' },
  { time: '16:00', status: 'open' },
  { time: '16:30', status: 'open' },
  { time: '17:00', status: 'open' },
  { time: '17:30', status: 'open' },
];

// =============================================
// DASHBOARD STATS
// =============================================
export const mockDashboardStats = {
  totalLeads: 5,
  activeLeads: 3,
  activeCampaigns: 1,
  messagesSent: 70,
  messagesThisWeek: 18,
  qualifiedLeads: 2,
  hotLeads: 1,
  convertedLeads: 1,
  avgReplyRate: 66.7,
  avgQualRate: 38.5,
  todayMessages: 6,
  revenueGenerated: 0, // demo mode
};

// =============================================
// ACTIVITY FEED (Live SSE simulation)
// =============================================
export const mockActivityFeed = [
  {
    id: 'act_001',
    type: 'hot_lead',
    title: 'Hot Lead Detected',
    description: 'Ramesh Patel scored 4/4 — requested site visit',
    leadId: 'lead_001',
    leadName: 'Ramesh Patel',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'act_002',
    type: 'message_sent',
    title: 'Agent replied to Priya Sharma',
    description: 'Shared residential package details and pricing',
    leadId: 'lead_002',
    leadName: 'Priya Sharma',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'act_003',
    type: 'qualified',
    title: 'Lead Qualified',
    description: 'Priya Sharma reached qualification score 3',
    leadId: 'lead_002',
    leadName: 'Priya Sharma',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'act_004',
    type: 'message_received',
    title: 'New message from Arjun Mehta',
    description: 'Asked about government subsidy for commercial',
    leadId: 'lead_003',
    leadName: 'Arjun Mehta',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'act_005',
    type: 'campaign_launched',
    title: 'Campaign launched',
    description: 'Summer Solar Push — targeting 4 leads',
    campaignId: 'camp_001',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'act_006',
    type: 'appointment_booked',
    title: 'AI booked appointment',
    description: 'Ramesh Patel — Site Survey at 10:00 AM today',
    leadId: 'lead_001',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];

// =============================================
// ANALYTICS
// =============================================
export const mockAnalytics = {
  // Daily message volume (last 14 days)
  dailyMessages: [
    { date: '2024-06-08', sent: 12, received: 7 },
    { date: '2024-06-09', sent: 8,  received: 5 },
    { date: '2024-06-10', sent: 18, received: 12 },
    { date: '2024-06-11', sent: 6,  received: 3 },
    { date: '2024-06-12', sent: 4,  received: 2 },
    { date: '2024-06-13', sent: 0,  received: 0 },
    { date: '2024-06-14', sent: 0,  received: 0 },
    { date: '2024-06-15', sent: 14, received: 9 },
    { date: '2024-06-16', sent: 10, received: 7 },
    { date: '2024-06-17', sent: 8,  received: 5 },
    { date: '2024-06-18', sent: 5,  received: 4 },
    { date: '2024-06-19', sent: 3,  received: 2 },
    { date: '2024-06-20', sent: 7,  received: 5 },
    { date: '2024-06-21', sent: 6,  received: 4 },
  ],
  // Lead funnel
  funnel: [
    { stage: 'Contacted', count: 5,  fill: '#5E6AD2' },
    { stage: 'Engaged',   count: 4,  fill: '#7B86E8' },
    { stage: 'Interested', count: 3, fill: '#9EA8F0' },
    { stage: 'Qualified', count: 2,  fill: '#BCC3F5' },
    { stage: 'Converted', count: 1,  fill: '#D5D9FA' },
  ],
  // Response time buckets
  responseTime: [
    { bucket: '< 1 min',  count: 8  },
    { bucket: '1–5 min',  count: 3  },
    { bucket: '5–30 min', count: 2  },
    { bucket: '> 30 min', count: 1  },
  ],
  summaryStats: {
    totalMessagesSent: 70,
    totalReplies: 42,
    overallReplyRate: 60.0,
    qualifiedLeads: 2,
    qualRate: 40.0,
    avgResponseTime: '38s',
    campaignsRun: 2,
    aiHandoffRate: 15.0,
  },
};

// =============================================
// CONTENT STUDIO — SAMPLE OUTPUTS
// =============================================
export const mockContentOutputs = {
  whatsapp: `Beat the summer heat — and your electricity bills!\n\nSolarBright is offering FREE site surveys this month. Find out exactly how much you can save with rooftop solar.\n\n- Govt. subsidy up to 40%\n- ROI in under 3 years\n- 25-year performance warranty\n\nReply SOLAR to get your free quote today!`,
  instagram: `Your roof is your power plant.\n\nThis summer, SolarBright helped 50+ Ahmedabad families slash their electricity bills by 80%. The sun doesn't send a bill.\n\nDM us for a FREE quote!\n\n#SolarEnergy #GoGreen #SolarBright #Ahmedabad #CleanEnergy #RooftopSolar #SustainableLiving #MakeInIndia`,
  linkedin: `Exciting news for Gujarat's industrial sector.\n\nSolarBright Solutions has helped 3 manufacturing units in Vadodara achieve energy independence this quarter — reducing operational costs by Rs. 18L+ annually.\n\nWith PM KUSUM subsidies and accelerated depreciation benefits, the financial case for industrial solar has never been stronger.\n\nInterested in a ROI analysis for your facility? Drop a comment or DM us.\n\n#RenewableEnergy #GujaratBusiness #IndustrialSolar #Sustainability`,
  sms: `SolarBright: Beat summer bills! Free rooftop solar survey this month. Up to 40% govt. subsidy available. Reply SOLAR to 9876543200 for your free quote. Opt-out: STOP`,
  email: `<strong>Subject: Cut Your Electricity Bill by 70% This Summer</strong>\n\nDear [Name],\n\nWith summer energy bills soaring, there's never been a better time to go solar.\n\nSolarBright Solutions is offering FREE site surveys for homes and businesses in Ahmedabad, Surat, and Vadodara this month.\n\nWhat you get:\n• Custom solar system design for your property\n• Accurate savings projection\n• Subsidy and financing options explained\n\nSchedule your free survey today →`,
};
