const { Router } = require('express');
const calendarService = require('../services/calendarService');
const auth     = require('../middleware/auth');
const validate = require('../middleware/validate');
const prisma   = require('../config/db');
const ApiError = require('../utils/apiError');

const router = Router();

// GET /api/booking/slots?date=2026-06-23
router.get('/slots', auth, async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const businessId = req.user?.businessId || 'default';
    const slots = await calendarService.getSlots(date, businessId);
    res.json({ success: true, data: { date, slots } });
  } catch (err) { next(err); }
});

// POST /api/booking/book
router.post('/book', auth, validate(['date', 'time', 'name', 'phone']), async (req, res, next) => {
  try {
    const businessId = req.user?.businessId || 'default';
    const appointment = await calendarService.bookAppointment({
      ...req.body,
      businessId,
    });
    res.status(201).json({ success: true, data: appointment });
  } catch (err) { next(err); }
});

// GET /api/booking/appointments
router.get('/appointments', auth, async (req, res, next) => {
  try {
    const businessId = req.user?.businessId || 'default';
    const appointments = await calendarService.listAppointments(businessId);
    res.json({ success: true, data: appointments });
  } catch (err) { next(err); }
});

// GET /api/booking/availability
router.get('/availability', auth, async (req, res, next) => {
  try {
    const businessId = req.user?.businessId || 'default';
    const resolvedBizId = await calendarService.getBusinessId(businessId);
    const business = await prisma.business.findUnique({
      where: { id: resolvedBizId },
      select: { availability: true },
    });

    let availability = null;
    if (business && business.availability) {
      try {
        availability = JSON.parse(business.availability);
      } catch (e) {
        console.error('[BookingRoute] Failed to parse availability JSON:', e.message);
      }
    }

    res.json({ success: true, data: availability });
  } catch (err) { next(err); }
});

// PUT /api/booking/availability
router.put('/availability', auth, validate(['availability']), async (req, res, next) => {
  try {
    const businessId = req.user?.businessId || 'default';
    const resolvedBizId = await calendarService.getBusinessId(businessId);
    const { availability } = req.body;

    await prisma.business.update({
      where: { id: resolvedBizId },
      data: { availability: JSON.stringify(availability) },
    });

    res.json({ success: true, message: 'Availability updated successfully' });
  } catch (err) { next(err); }
});

// PUT /api/booking/appointments/:id/status
router.put('/appointments/:id/status', auth, validate(['status']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const businessId = req.user?.businessId || 'default';
    const resolvedBizId = await calendarService.getBusinessId(businessId);

    const appointment = await prisma.appointment.findFirst({
      where: { id, businessId: resolvedBizId }
    });

    if (!appointment) {
      throw new ApiError(404, 'Appointment not found');
    }

    const updateResult = await prisma.appointment.updateMany({
      where: { id, businessId: resolvedBizId },
      data: { status },
    });

    if (updateResult.count === 0) {
      throw new ApiError(404, 'Appointment not found');
    }

    // Trigger actions when transitioning from pending
    if (appointment.status === 'pending') {
      if (status === 'confirmed') {
        // Send WhatsApp confirmation
        try {
          const twilioService = require('../services/twilioService');
          const msg = `Hi ${appointment.leadName}! Your site visit has been confirmed for ${appointment.date} at ${appointment.time}. We look forward to seeing you! 🙏`;
          await twilioService.sendMessage(appointment.phone, msg);
        } catch (twilioErr) {
          console.error('[BookingRoute] Failed to send Twilio confirmation:', twilioErr.message);
        }

        // Sync to Google Calendar
        try {
          await calendarService.syncToGoogleCalendar({
            ...appointment,
            status: 'confirmed'
          });
        } catch (calErr) {
          console.error('[BookingRoute] Google Calendar sync failed:', calErr.message);
        }
      } else if (status === 'cancelled') {
        // Send WhatsApp cancellation
        try {
          const twilioService = require('../services/twilioService');
          const msg = `Hi ${appointment.leadName}, we're sorry but we had to cancel the requested site visit for ${appointment.date} at ${appointment.time}. Let us know if you'd like to reschedule!`;
          await twilioService.sendMessage(appointment.phone, msg);
        } catch (twilioErr) {
          console.error('[BookingRoute] Failed to send Twilio cancellation:', twilioErr.message);
        }
      }
    }

    res.json({ success: true, message: `Appointment status updated to ${status}` });
  } catch (err) { next(err); }
});

// DELETE /api/booking/appointments/:id
router.delete('/appointments/:id', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const businessId = req.user?.businessId || 'default';
    const resolvedBizId = await calendarService.getBusinessId(businessId);

    const deleteResult = await prisma.appointment.deleteMany({
      where: { id, businessId: resolvedBizId },
    });

    if (deleteResult.count === 0) {
      throw new ApiError(404, 'Appointment not found');
    }

    res.json({ success: true, message: 'Appointment deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;
