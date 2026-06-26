# Backend Development Prompt
**Service:** `/backend`  
**Stack:** Node.js + Express + Prisma ORM + PostgreSQL  
**Language:** JavaScript

> Always read `00_MASTER_PROMPT.md` first for full project context.

---

## Your Role

You are a senior backend engineer. You build clean, well-structured Node.js APIs with clear separation of concerns — routes handle HTTP, services handle business logic, Prisma handles data. You never put business logic in route handlers. You write defensive code with proper error handling.

---

## Folder Structure

```
/backend
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── config/
│   │   ├── db.js              Prisma client singleton
│   │   ├── cloudinary.js
│   │   └── twilio.js
│   ├── middleware/
│   │   ├── auth.js            JWT verify middleware
│   │   ├── errorHandler.js    Global error handler
│   │   ├── validate.js        Request body validation
│   │   └── rateLimiter.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── campaigns.js
│   │   ├── leads.js
│   │   ├── conversations.js
│   │   ├── kb.js
│   │   ├── analytics.js
│   │   ├── booking.js
│   │   └── events.js          SSE endpoint
│   ├── services/
│   │   ├── authService.js
│   │   ├── campaignService.js
│   │   ├── leadService.js
│   │   ├── conversationService.js
│   │   ├── agentService.js    Calls /ai-service via HTTP
│   │   ├── kbService.js
│   │   ├── twilioService.js
│   │   ├── schedulerService.js
│   │   ├── sseService.js      SSE connection manager
│   │   └── calendarService.js Google Calendar OAuth
│   ├── webhooks/
│   │   └── whatsapp.js        Twilio incoming webhook
│   ├── jobs/
│   │   └── followUpJob.js     node-cron follow-up scheduler
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── phoneValidator.js
│   │   ├── excelParser.js
│   │   └── apiError.js        Custom error class
│   └── app.js
├── server.js
├── .env
└── package.json
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Business {
  id              String       @id @default(uuid())
  name            String
  ownerEmail      String       @unique
  passwordHash    String
  waNumber        String?
  waBspKey        String?
  plan            String       @default("starter")
  createdAt       DateTime     @default(now())

  campaigns       Campaign[]
  leads           Lead[]
  knowledgeBases  KnowledgeBase[]
  teamMembers     TeamMember[]
  conversations   Conversation[]
}

model TeamMember {
  id          String   @id @default(uuid())
  businessId  String
  name        String
  email       String
  role        String   @default("sales_rep")
  notifyWa    String?
  business    Business @relation(fields: [businessId], references: [id])
}

model KnowledgeBase {
  id          String       @id @default(uuid())
  businessId  String
  name        String
  chromaColId String?      // ChromaDB collection ID
  createdAt   DateTime     @default(now())
  business    Business     @relation(fields: [businessId], references: [id])
  documents   KbDocument[]
  campaigns   Campaign[]
}

model KbDocument {
  id          String        @id @default(uuid())
  kbId        String
  fileName    String
  sourceType  String        // pdf | url | typed
  fileUrl     String?       // Cloudinary URL
  chunkCount  Int           @default(0)
  embeddedAt  DateTime?
  kb          KnowledgeBase @relation(fields: [kbId], references: [id])
}

model Campaign {
  id                 String    @id @default(uuid())
  businessId         String
  kbId               String?
  name               String
  status             String    @default("draft")
  agentTone          String    @default("friendly")
  openingTemplate    String?
  followupSchedule   Json      @default("{\"day1\":true,\"day3\":true,\"day7\":false}")
  sendWindowStart    String    @default("10:00")
  sendWindowEnd      String    @default("19:00")
  language           String    @default("en")
  createdAt          DateTime  @default(now())
  business           Business  @relation(fields: [businessId], references: [id])
  kb                 KnowledgeBase? @relation(fields: [kbId], references: [id])
  leads              Lead[]
  analytics          CampaignAnalytics[]
}

model Lead {
  id                  String         @id @default(uuid())
  campaignId          String
  businessId          String
  name                String
  phone               String
  email               String?
  customFields        Json           @default("{}")
  waActive            Boolean        @default(true)
  status              String         @default("pending")
  qualificationScore  Int            @default(0)
  intentSignals       String[]       @default([])
  assignedTo          String?
  createdAt           DateTime       @default(now())
  campaign            Campaign       @relation(fields: [campaignId], references: [id])
  business            Business       @relation(fields: [businessId], references: [id])
  conversation        Conversation?
  followUps           FollowUp[]
}

model Conversation {
  id                  String    @id @default(uuid())
  leadId              String    @unique
  businessId          String
  langraphThreadId    String    @unique  // = lead phone number
  stage               String    @default("opener")
  isHumanActive       Boolean   @default(false)
  humanTookOverAt     DateTime?
  lastMessageAt       DateTime  @default(now())
  lead                Lead      @relation(fields: [leadId], references: [id])
  business            Business  @relation(fields: [businessId], references: [id])
  messages            Message[]
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  role           String       // lead | agent | human
  content        String
  waMessageId    String?
  waStatus       String?      // sent | delivered | read
  timestamp      DateTime     @default(now())
  conversation   Conversation @relation(fields: [conversationId], references: [id])
}

model FollowUp {
  id          String   @id @default(uuid())
  leadId      String
  scheduledAt DateTime
  templateId  String?
  status      String   @default("pending")  // pending | sent | cancelled
  lead        Lead     @relation(fields: [leadId], references: [id])
}

model CampaignAnalytics {
  id               String   @id @default(uuid())
  campaignId       String
  date             DateTime @default(now())
  messagesSent     Int      @default(0)
  messagesDelivered Int     @default(0)
  messagesRead     Int      @default(0)
  repliesReceived  Int      @default(0)
  leadsQualified   Int      @default(0)
  leadsConverted   Int      @default(0)
  handoffsTriggered Int     @default(0)
  campaign         Campaign @relation(fields: [campaignId], references: [id])
}
```

---

## API Routes

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me

POST   /api/kb/create
POST   /api/kb/:id/upload          → multipart/form-data, calls ai-service /kb/embed
GET    /api/kb
GET    /api/kb/:id/documents
DELETE /api/kb/:id/document/:docId → calls ai-service /kb/delete-doc

POST   /api/campaigns
GET    /api/campaigns
GET    /api/campaigns/:id
PUT    /api/campaigns/:id
POST   /api/campaigns/:id/launch
POST   /api/campaigns/:id/pause
DELETE /api/campaigns/:id

POST   /api/leads/upload           → Excel file, parse, validate, insert
GET    /api/leads?campaignId=&status=&sort=&page=
GET    /api/leads/:id
PUT    /api/leads/:id/status

GET    /api/conversations
GET    /api/conversations/:id/messages
POST   /api/conversations/:id/takeover
POST   /api/conversations/:id/release
POST   /api/conversations/:id/human-message

GET    /api/analytics/overview
GET    /api/analytics/campaign/:id

GET    /api/booking/slots?date=
POST   /api/booking/book
GET    /api/booking/appointments

GET    /api/events                 → SSE stream

POST   /webhook/whatsapp/incoming  → Twilio fires this
POST   /webhook/whatsapp/status    → Delivery receipts
```

---

## Key Service Patterns

### Auth Service
```js
// JWT — access token 15min, refresh 7 days
const generateTokens = (userId, businessId) => ({
  accessToken: jwt.sign({ userId, businessId }, process.env.JWT_SECRET, { expiresIn: '15m' }),
  refreshToken: jwt.sign({ userId, businessId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' })
});
```

### Agent Service (calls AI service)
```js
// services/agentService.js
const callAgent = async ({ threadId, businessId, leadId, message, kbId, campaignConfig }) => {
  const res = await fetch(`${process.env.AI_SERVICE_URL}/agent/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ thread_id: threadId, business_id: businessId,
                           lead_id: leadId, message, kb_id: kbId,
                           campaign_config: campaignConfig })
  });
  if (!res.ok) throw new Error('AI service error');
  return res.json();
  // Returns: { reply, stage, qualification_score, needs_human, intent_signals }
};
```

### WhatsApp Webhook Handler
```js
// webhooks/whatsapp.js
router.post('/webhook/whatsapp/incoming', async (req, res) => {
  res.sendStatus(200); // Twilio needs immediate 200

  const { From, Body, MessageSid } = req.body;
  const phone = From.replace('whatsapp:', '');

  const lead = await prisma.lead.findFirst({ where: { phone } });
  if (!lead) return;

  // Cancel pending follow-ups — lead replied
  await prisma.followUp.updateMany({
    where: { leadId: lead.id, status: 'pending' },
    data: { status: 'cancelled' }
  });

  const conversation = await prisma.conversation.findUnique({ where: { leadId: lead.id } });

  // Save incoming message
  await prisma.message.create({
    data: { conversationId: conversation.id, role: 'lead', content: Body, waMessageId: MessageSid }
  });

  // Human active? Route to SSE, not agent
  if (conversation.isHumanActive) {
    sseService.push(lead.businessId, 'new_message', { leadId: lead.id, message: Body });
    return;
  }

  // Call AI agent
  const campaign = await prisma.campaign.findUnique({ where: { id: lead.campaignId }, include: { kb: true } });
  const result = await agentService.callAgent({
    threadId: phone, businessId: lead.businessId,
    leadId: lead.id, message: Body,
    kbId: campaign.kbId, campaignConfig: campaign
  });

  // Save agent reply
  await prisma.message.create({
    data: { conversationId: conversation.id, role: 'agent', content: result.reply }
  });

  // Update lead qualification
  await prisma.lead.update({
    where: { id: lead.id },
    data: { qualificationScore: result.qualification_score,
            status: result.stage, intentSignals: result.intent_signals }
  });

  // Send reply via Twilio
  await twilioService.sendMessage(phone, result.reply);

  // Notify via SSE
  sseService.push(lead.businessId, 'agent_replied', { leadId: lead.id, reply: result.reply });

  // Hot lead? Alert sales rep
  if (result.needs_human) {
    await prisma.conversation.update({ where: { id: conversation.id }, data: { stage: 'handoff' } });
    sseService.push(lead.businessId, 'hot_lead', { leadId: lead.id, score: result.qualification_score });
  }
});
```

### Excel Lead Upload
```js
// services/leadService.js
const uploadLeads = async (fileBuffer, mapping, campaignId, businessId) => {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const leads = rows.slice(1).map(row => ({
    name:    row[mapping.name],
    phone:   normalizePhone(row[mapping.phone]),   // → +91XXXXXXXXXX
    email:   mapping.email ? row[mapping.email] : null,
    customFields: mapping.custom.reduce((acc, { field, col }) => {
      acc[field] = row[col]; return acc;
    }, {}),
    campaignId, businessId,
    status: 'pending'
  })).filter(l => isValidIndianPhone(l.phone));

  // Deduplicate
  const existing = await prisma.lead.findMany({
    where: { businessId, phone: { in: leads.map(l => l.phone) } },
    select: { phone: true }
  });
  const existingPhones = new Set(existing.map(l => l.phone));
  const newLeads = leads.filter(l => !existingPhones.has(l.phone));

  await prisma.lead.createMany({ data: newLeads });

  return { total: leads.length, inserted: newLeads.length,
           duplicates: leads.length - newLeads.length,
           invalid: rows.slice(1).length - leads.length };
};
```

### SSE Service
```js
// services/sseService.js
const clients = new Map();

const addClient = (businessId, res) => clients.set(businessId, res);
const removeClient = (businessId) => clients.delete(businessId);
const push = (businessId, type, data) => {
  const client = clients.get(businessId);
  if (client) client.write(`data: ${JSON.stringify({ type, data, ts: Date.now() })}\n\n`);
};

module.exports = { addClient, removeClient, push };
```

### Follow-up Scheduler
```js
// jobs/followUpJob.js
const cron = require('node-cron');

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  const due = await prisma.followUp.findMany({
    where: { status: 'pending', scheduledAt: { lte: new Date() } },
    include: { lead: { include: { campaign: true } } }
  });

  for (const followUp of due) {
    await twilioService.sendTemplate(followUp.lead.phone, followUp.templateId);
    await prisma.followUp.update({ where: { id: followUp.id }, data: { status: 'sent' } });
  }
});
```

---

## Error Handling Pattern

```js
// utils/apiError.js
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ success: false, error: message });
};
```

---

## Libraries

```bash
npm i express prisma @prisma/client
npm i jsonwebtoken bcryptjs
npm i multer                  # file uploads
npm i xlsx                    # Excel parsing in backend
npm i twilio                  # WhatsApp via Twilio
npm i node-cron               # follow-up scheduler
npm i node-fetch               # call AI service
npm i cloudinary multer-storage-cloudinary
npm i googleapis              # Google Calendar
npm i cors helmet morgan dotenv
npm i express-rate-limit
```