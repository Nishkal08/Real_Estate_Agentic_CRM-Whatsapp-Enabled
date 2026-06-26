const prisma = require('../config/db');
const ApiError = require('../utils/apiError');

/**
 * Google Calendar service — stubbed until OAuth credentials are provided
 * When GOOGLE_CLIENT_ID is set, uses googleapis to read/write calendar events
 */

let calendarApi = null;

function initCalendar() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/booking/callback'
    );
    calendarApi = google.calendar({ version: 'v3', auth: oauth2Client });
    console.log('[Calendar] Google Calendar API initialized');
    return oauth2Client;
  }
  console.warn('[Calendar] Google credentials not set — booking will use stubbed data');
  return null;
}

const oauth2Client = initCalendar();

/**
 * Helper to resolve the business ID to a valid record
 */
async function getBusinessId(businessId) {
  if (!businessId) {
    const firstBiz = await prisma.business.findFirst();
    return firstBiz ? firstBiz.id : 'default';
  }
  const biz = await prisma.business.findUnique({ where: { id: businessId } });
  if (biz) return businessId;
  
  const firstBiz = await prisma.business.findFirst();
  return firstBiz ? firstBiz.id : businessId;
}

/**
 * Get available slots for a date
 */
async function getSlots(date, businessId = 'default') {
  const resolvedBizId = await getBusinessId(businessId);

  // Fetch business availability settings
  const business = await prisma.business.findUnique({
    where: { id: resolvedBizId },
    select: { availability: true }
  });

  let availability = null;
  if (business && business.availability) {
    try {
      availability = JSON.parse(business.availability);
    } catch (e) {
      console.error('[CalendarService] Failed to parse availability settings:', e.message);
    }
  }

  // 1. Fetch busy slots from local SQLite database first
  const localApts = await prisma.appointment.findMany({
    where: {
      businessId: resolvedBizId,
      date,
      status: { not: 'cancelled' }
    }
  });

  const busySlots = localApts.map(a => {
    const startTime = new Date(`${a.date}T${a.time}:00`);
    const endTime = new Date(startTime.getTime() + a.duration * 60 * 1000);
    return { start: startTime, end: endTime };
  });

  // 2. If Google Calendar is configured, also query Google Calendar and merge busy slots
  if (calendarApi) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const res = await calendarApi.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const googleBusy = (res.data.items || []).map(e => ({
        start: new Date(e.start.dateTime || e.start.date),
        end:   new Date(e.end.dateTime   || e.end.date),
      }));
      busySlots.push(...googleBusy);
    } catch (err) {
      console.warn('[Calendar] Google API failed to fetch busy slots:', err.message);
    }
  }

  // 3. Generate available slots by checking busy intervals
  return generateAvailableSlots(date, busySlots, availability);
}

/**
 * Book an appointment
 */
async function bookAppointment({ date, time, name, phone, notes, businessId = 'default', status = 'confirmed', isAIBooked = true }) {
  const resolvedBizId = await getBusinessId(businessId);

  // Create local appointment in database
  const apt = await prisma.appointment.create({
    data: {
      businessId: resolvedBizId,
      leadName: name,
      phone,
      date,
      time,
      notes: notes || '',
      isAIBooked,
      status,
    }
  });

  const startTime = new Date(`${date}T${time}:00`);
  const endTime   = new Date(startTime.getTime() + 30 * 60 * 1000); // 30min slot

  // If Google Calendar is connected, also insert event (only for confirmed bookings)
  if (calendarApi && status === 'confirmed') {
    try {
      await calendarApi.events.insert({
        calendarId: 'primary',
        resource: {
          summary:     `Appointment: ${name}`,
          description: `Phone: ${phone}\nNotes: ${notes || 'N/A'}\nLocal ID: ${apt.id}`,
          start:       { dateTime: startTime.toISOString() },
          end:         { dateTime: endTime.toISOString() },
        },
      });
    } catch (err) {
      console.warn('[Calendar] Google API failed to book event, synced locally only:', err.message);
    }
  }

  // Map to frontend expectation
  return {
    id:        apt.id,
    summary:   `Appointment: ${apt.leadName}`,
    start:     startTime.toISOString(),
    end:       endTime.toISOString(),
    status:    apt.status,
  };
}

/**
 * List upcoming appointments
 */
async function listAppointments(businessId = 'default') {
  const resolvedBizId = await getBusinessId(businessId);

  // Always query local DB for persistent appointments list
  const localApts = await prisma.appointment.findMany({
    where: { businessId: resolvedBizId },
    orderBy: [
      { date: 'asc' },
      { time: 'asc' }
    ]
  });

  return localApts.map(a => {
    const startTime = new Date(`${a.date}T${a.time}:00`);
    const endTime = new Date(startTime.getTime() + a.duration * 60 * 1000);
    return {
      id:          a.id,
      summary:     `Appointment: ${a.leadName}`,
      description: a.notes || '',
      start:       startTime.toISOString(),
      end:         endTime.toISOString(),
      status:      a.status,
      phone:       a.phone,
      isAIBooked:  a.isAIBooked,
    };
  });
}

// ── Helpers ─────────────────────────────────────────────

function generateStubSlots(date) {
  const slots = [];
  for (let hour = 10; hour < 18; hour++) {
    for (const min of ['00', '30']) {
      slots.push({
        time:      `${String(hour).padStart(2, '0')}:${min}`,
        available: Math.random() > 0.3,
      });
    }
  }
  return slots;
}

function generateAvailableSlots(date, busySlots, availability) {
  const [year, month, day] = date.split('-').map(Number);
  const dayIndex = new Date(year, month - 1, day).getDay();
  const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = DAYS_OF_WEEK[dayIndex];

  const dayConfig = availability ? availability[dayName] : null;

  // Defaults if no custom configuration exists
  let startHour = 10;
  let startMin = 0;
  let endHour = 18;
  let endMin = 0;
  let enabled = true;

  // Saturdays and Sundays disabled by default
  if (dayName === 'saturday' || dayName === 'sunday') {
    enabled = false;
  }

  if (dayConfig) {
    enabled = dayConfig.enabled;
    if (dayConfig.start && dayConfig.end) {
      const [sH, sM] = dayConfig.start.split(':').map(Number);
      const [eH, eM] = dayConfig.end.split(':').map(Number);
      startHour = sH;
      startMin = sM;
      endHour = eH;
      endMin = eM;
    }
  }

  const slots = [];
  
  // Timezone-safe date creation in local time
  let current = new Date(year, month - 1, day, startHour, startMin, 0);
  const end = new Date(year, month - 1, day, endHour, endMin, 0);

  while (current < end) {
    const slotStart = new Date(current);
    const slotEnd   = new Date(current.getTime() + 30 * 60 * 1000);
    const isBusy    = busySlots.some(b => slotStart < b.end && slotEnd > b.start);
    
    const timeStr = `${String(slotStart.getHours()).padStart(2, '0')}:${String(slotStart.getMinutes()).padStart(2, '0')}`;
    slots.push({
      time:      timeStr,
      available: enabled && !isBusy,
    });

    current = slotEnd;
  }
  return slots;
}

async function syncToGoogleCalendar(apt) {
  if (calendarApi) {
    const startTime = new Date(`${apt.date}T${apt.time}:00`);
    const endTime   = new Date(startTime.getTime() + 30 * 60 * 1000);
    try {
      await calendarApi.events.insert({
        calendarId: 'primary',
        resource: {
          summary:     `Appointment: ${apt.leadName}`,
          description: `Phone: ${apt.phone}\nNotes: ${apt.notes || 'N/A'}\nLocal ID: ${apt.id}`,
          start:       { dateTime: startTime.toISOString() },
          end:         { dateTime: endTime.toISOString() },
        },
      });
    } catch (err) {
      console.warn('[Calendar] Google API failed to book event, synced locally only:', err.message);
    }
  }
}

module.exports = { getSlots, bookAppointment, listAppointments, oauth2Client, getBusinessId, syncToGoogleCalendar };
