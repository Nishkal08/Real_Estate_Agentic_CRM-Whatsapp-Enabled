import { useState, useEffect } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Clock,
  Bot, UserCheck, AlertCircle, CheckCircle2,
  Download, RefreshCw, Plus, X
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/analytics/StatCard';
import { formatTimeSlot, formatDate, formatRelativeTime, getInitials } from '@/utils/formatters';
import api from '@/services/api';
import { toast } from '@/stores/uiStore';
import { cn } from '@/utils/cn';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const APT_STATUS_STYLES = {
  confirmed: { bg: 'var(--success-bg)',  color: 'var(--success)',  label: 'Confirmed' },
  pending:   { bg: 'var(--warning-bg)',  color: 'var(--warning)',  label: 'Pending' },
  completed: { bg: 'var(--bg-surface)',  color: 'var(--text-muted)', label: 'Completed' },
  no_show:   { bg: 'var(--danger-bg)',   color: 'var(--danger)',   label: 'No-show' },
  cancelled: { bg: 'var(--danger-bg)',   color: 'var(--danger)',   label: 'Cancelled' },
};

const SLOT_STYLES = {
  open:    { bg: 'rgba(22,163,74,0.06)',  border: 'rgba(22,163,74,0.2)',  color: 'var(--success)' },
  booked:  { bg: 'rgba(94,106,210,0.08)', border: 'rgba(94,106,210,0.2)', color: 'var(--accent)' },
  blocked: { bg: 'var(--bg-surface)',     border: 'var(--border-subtle)',  color: 'var(--text-muted)' },
};

function AppointmentItem({ apt, isActive, onUpdateStatus }) {
  const status = APT_STATUS_STYLES[apt.status] || APT_STATUS_STYLES.pending;
  const showActions = apt.status === 'confirmed' || apt.status === 'pending';

  return (
    <div
      className={cn('flex items-start gap-3 p-3 rounded-xl transition-all', isActive && 'ring-1')}
      style={{
        background: isActive ? 'var(--accent-light)' : 'var(--bg-surface)',
        border: `1px solid ${isActive ? 'rgba(94,106,210,0.3)' : 'var(--border-subtle)'}`,
        ringColor: 'var(--accent)',
      }}
    >
      <div className="avatar flex-shrink-0">{getInitials(apt.leadName)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{apt.leadName}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{apt.phone || apt.type}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: status.bg, color: status.color }}
            >
              {status.label}
            </span>
            {apt.isAIBooked && (
              <span
                className="flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
              >
                <Bot size={8} /> AI booked
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1.5">
          <div className="flex items-center gap-2">
            <Clock size={10} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {formatTimeSlot(apt.time)} · {apt.duration}min
            </span>
          </div>

          {showActions && onUpdateStatus && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {apt.status === 'pending' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onUpdateStatus(apt.id, 'confirmed'); }}
                  title="Approve Appointment"
                  className="p-1 rounded hover:bg-[var(--success-bg)] transition-colors"
                  style={{ color: 'var(--success)' }}
                >
                  <UserCheck size={12} />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateStatus(apt.id, 'completed'); }}
                title="Mark Completed"
                className="p-1 rounded hover:bg-[var(--success-bg)] transition-colors"
                style={{ color: 'var(--success)' }}
              >
                <CheckCircle2 size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateStatus(apt.id, 'no_show'); }}
                title="Mark No-Show"
                className="p-1 rounded hover:bg-[var(--warning-bg)] transition-colors"
                style={{ color: 'var(--warning)' }}
              >
                <AlertCircle size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateStatus(apt.id, 'cancelled'); }}
                title="Cancel Appointment"
                className="p-1 rounded hover:bg-[var(--danger-bg)] transition-colors"
                style={{ color: 'var(--danger)' }}
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
        {apt.notes && (
          <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{apt.notes}</p>
        )}
      </div>
    </div>
  );
}

function CalendarGrid({ appointments, onSelectSlot }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

  // Get calendar days
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const hasDotForDay = (day) => {
    const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.some(a => a.date === dayStr);
  };

  const isToday = (day) =>
    day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  const [timeSlots, setTimeSlots] = useState([]);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await api.get(`/booking/slots?date=${dateStr}`);
        if (res.data.success) {
          // Backend returns { time, available }. We need { time, status: 'open'|'booked', appointment? }
          const mappedSlots = res.data.data.slots.map(s => {
            // Find if there's an appointment at this exact time
            const apt = appointments.find(a => a.date === dateStr && a.time === s.time);
            return {
              time: s.time,
              status: apt ? 'booked' : (s.available ? 'open' : 'blocked'),
              appointment: apt
            };
          });
          setTimeSlots(mappedSlots);
        }
      } catch (err) {
        console.error("Failed to fetch slots", err);
      }
    };
    fetchSlots();
  }, [dateStr, appointments]);

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button className="btn-icon" onClick={() => {
          if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
          else setCurrentMonth(m => m - 1);
        }}><ChevronLeft size={16} /></button>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {MONTHS[currentMonth]} {currentYear}
        </h3>
        <button className="btn-icon" onClick={() => {
          if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
          else setCurrentMonth(m => m + 1);
        }}><ChevronRight size={16} /></button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold py-1" style={{ color: 'var(--text-muted)' }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const hasDot = hasDotForDay(day);
          const todayMark = isToday(day);
          const selected = day === selectedDay;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className="relative flex flex-col items-center justify-center py-1.5 rounded-lg text-xs transition-all"
              style={{
                background: selected ? 'var(--accent)' : todayMark ? 'var(--accent-light)' : 'transparent',
                color: selected ? '#fff' : 'var(--text-primary)',
                fontWeight: todayMark || selected ? 600 : 400,
              }}
            >
              {day}
              {hasDot && (
                <span
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{ background: selected ? 'rgba(255,255,255,0.7)' : 'var(--accent)' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Time slots for selected day */}
      <div className="mt-5">
        <h4 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
          Time Slots — {selectedDay} {MONTHS[currentMonth]}
        </h4>
        <div className="grid grid-cols-2 gap-1.5">
          {timeSlots.map((slot) => {
            const s = SLOT_STYLES[slot.status] || SLOT_STYLES.open;
            const isClickable = slot.status === 'open';
            return (
              <button
                key={slot.time}
                disabled={!isClickable}
                onClick={() => isClickable && onSelectSlot && onSelectSlot(dateStr, slot.time)}
                className={cn(
                  "px-2 py-1.5 rounded-lg text-xs transition-all text-left w-full",
                  isClickable ? "hover:scale-[1.02] cursor-pointer" : "cursor-default"
                )}
                style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{formatTimeSlot(slot.time)}</span>
                  <span className="text-[9px] capitalize opacity-75">
                    {slot.status === 'blocked' ? slot.label || 'Blocked' : slot.status}
                  </span>
                </div>
                {slot.appointment && (
                  <p className="text-[10px] truncate mt-0.5" style={{ opacity: 0.8 }}>
                    {slot.appointment.leadName}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AvailabilitySettings({ availability, onChange }) {
  return (
    <div className="space-y-2">
      {DAYS.map((day, idx) => {
        const avail = availability[day];
        return (
          <div key={day} className="flex items-center gap-3">
            <div className="w-8 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {DAY_LABELS[idx]}
            </div>
            <button
              onClick={() => onChange(day, { ...avail, enabled: !avail.enabled })}
              className={cn(
                'w-8 h-4 rounded-full transition-all flex-shrink-0',
              )}
              style={{
                background: avail.enabled ? 'var(--accent)' : 'var(--border-strong)',
                position: 'relative',
              }}
              aria-label={`Toggle ${day}`}
            >
              <span
                className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform"
                style={{ transform: avail.enabled ? 'translateX(16px)' : 'translateX(0)' }}
              />
            </button>
            {avail.enabled ? (
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="time"
                  value={avail.start}
                  onChange={e => onChange(day, { ...avail, start: e.target.value })}
                  className="input py-1 text-xs"
                  style={{ width: 90 }}
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>–</span>
                <input
                  type="time"
                  value={avail.end}
                  onChange={e => onChange(day, { ...avail, end: e.target.value })}
                  className="input py-1 text-xs"
                  style={{ width: 90 }}
                />
              </div>
            ) : (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Unavailable</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BookAppointmentModal({ isOpen, onClose, date, time, onBooked }) {
  const [leads, setLeads] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState('custom');
  const [form, setForm] = useState({ name: '', phone: '', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get('/leads?limit=100').then(res => {
        if (res.data.success) {
          setLeads(res.data.data.leads || []);
        }
      }).catch(err => console.error("Failed to fetch leads for booking", err));
    }
  }, [isOpen]);

  const handleLeadChange = (e) => {
    const val = e.target.value;
    setSelectedLeadId(val);
    if (val === 'custom') {
      setForm(f => ({ ...f, name: '', phone: '' }));
    } else {
      const lead = leads.find(l => l.id === val);
      if (lead) {
        setForm(f => ({ ...f, name: lead.name, phone: lead.phone }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error("Please enter a name and phone number");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/booking/book', {
        date,
        time,
        name: form.name,
        phone: form.phone,
        notes: form.notes,
      });
      if (res.data.success) {
        toast.success(`Appointment booked for ${form.name}!`, { title: 'Site Visit Booked' });
        onBooked();
        onClose();
        setForm({ name: '', phone: '', notes: '' });
        setSelectedLeadId('custom');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Site Visit"
      description={`Schedule a visit for ${formatDate(date)} at ${formatTimeSlot(time)}`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Select label="Select Existing Lead (Optional)" value={selectedLeadId} onChange={handleLeadChange}>
          <option value="custom">-- Custom Lead / Type Manually --</option>
          {leads.map(l => (
            <option key={l.id} value={l.id}>{l.name} ({l.phone})</option>
          ))}
        </Select>
        
        <Input
          label="Lead Name"
          placeholder="e.g. Ramesh Kumar"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
          disabled={selectedLeadId !== 'custom'}
        />
        
        <Input
          label="Lead Phone"
          placeholder="e.g. +919988776655"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          required
          disabled={selectedLeadId !== 'custom'}
        />
        
        <Textarea
          label="Notes / Comments"
          placeholder="e.g. Interested in 3 BHK flat on higher floors"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={3}
        />
        
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit" loading={loading}>Confirm Booking</Button>
        </div>
      </form>
    </Modal>
  );
}

const APT_TABS = ['Today', 'Upcoming', 'Past', 'Cancelled'];

export default function BookingAgent() {
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [agentEnabled, setAgentEnabled] = useState(true);
  const defaultAvailability = DAYS.reduce((acc, day) => {
    acc[day] = { enabled: !['saturday', 'sunday'].includes(day), start: '09:00', end: '17:00' };
    return acc;
  }, {});
  const [availability, setAvailability] = useState(defaultAvailability);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSlotTime, setSelectedSlotTime] = useState('');
  const [selectedSlotDate, setSelectedSlotDate] = useState('');

  const handleSelectSlot = (date, time) => {
    setSelectedSlotDate(date);
    setSelectedSlotTime(time);
    setBookingModalOpen(true);
  };

  const fetchApts = async () => {
    try {
      setLoading(true);
      const [aptsRes, availRes] = await Promise.all([
        api.get('/booking/appointments'),
        api.get('/booking/availability'),
      ]);

      if (aptsRes.data.success) {
        const mapped = (aptsRes.data.data || []).map(a => {
          const startDate = new Date(a.start);
          return {
            id:          a.id,
            leadName:    a.summary?.replace('Appointment: ', '') || 'Unknown',
            type:        'Site Visit',
            status:      a.status || 'confirmed',
            date:        a.start.split('T')[0] || startDate.toISOString().split('T')[0],
            time:        `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`,
            duration:    30,
            notes:       a.description || '',
            phone:       a.phone || '',
            isAIBooked:  a.isAIBooked ?? true,
          };
        });
        setAppointments(mapped);
      }

      if (availRes.data.success && availRes.data.data) {
        setAvailability(availRes.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch booking data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApts();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const filteredApts = appointments.filter(a => {
    if (activeTab === 'Today') return a.date === today;
    if (activeTab === 'Upcoming') return a.date >= today && a.status !== 'cancelled';
    if (activeTab === 'Past') return a.date < today || a.status === 'completed';
    if (activeTab === 'Cancelled') return a.status === 'cancelled' || a.status === 'no_show';
    return true;
  });

  const handleAvailChange = (day, val) => {
    setAvailability(prev => ({ ...prev, [day]: val }));
  };

  const handleSaveAvailability = async () => {
    try {
      const res = await api.put('/booking/availability', { availability });
      if (res.data.success) {
        toast.success('Weekly availability saved successfully!', { title: 'Settings Saved' });
        fetchApts();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save availability settings');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await api.put(`/booking/appointments/${id}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Appointment status updated to ${newStatus}`);
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update appointment status');
    }
  };

  const bookingStats = {
    todayTotal: appointments.filter(a => a.date === today).length,
    weekTotal: appointments.length,
    aiBooked: appointments.filter(a => a.isAIBooked).length,
    noShows: appointments.filter(a => a.status === 'no_show').length
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            AI-powered appointment booking via WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" icon={<RefreshCw size={14} />}>
            Sync Google Cal
          </Button>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: agentEnabled ? 'var(--success-bg)' : 'var(--bg-surface)', border: `1px solid ${agentEnabled ? 'rgba(22,163,74,0.2)' : 'var(--border-subtle)'}` }}
          >
            <button
              onClick={() => setAgentEnabled(e => { toast.success(e ? 'Booking agent paused' : 'Booking agent activated!'); return !e; })}
              className="w-8 h-4 rounded-full transition-all relative flex-shrink-0"
              style={{ background: agentEnabled ? 'var(--success)' : 'var(--border-strong)' }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform"
                style={{ transform: agentEnabled ? 'translateX(16px)' : 'translateX(0)' }}
              />
            </button>
            <span className="text-xs font-medium" style={{ color: agentEnabled ? 'var(--success)' : 'var(--text-muted)' }}>
              {agentEnabled ? 'Agent Active' : 'Agent Paused'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Today's Appointments" value={bookingStats.todayTotal} icon={<Calendar size={15} />} color="accent" />
        <StatCard title="This Week" value={bookingStats.weekTotal} icon={<Calendar size={15} />} color="success" />
        <StatCard title="AI Booked" value={bookingStats.aiBooked} icon={<Bot size={15} />} color="accent" trend={25} trendLabel="vs manual" />
        <StatCard title="No-Shows" value={bookingStats.noShows} icon={<AlertCircle size={15} />} color="danger" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Calendar */}
        <div className="space-y-4">
          <div className="card-no-hover">
            <h3 className="text-md mb-4" style={{ color: 'var(--text-primary)' }}>Calendar</h3>
            <CalendarGrid appointments={appointments} onSelectSlot={handleSelectSlot} />
          </div>

          {/* Weekly availability */}
          <div className="card-no-hover">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Weekly Availability</h3>
              <button
                className="text-xs font-medium"
                style={{ color: 'var(--accent)' }}
                onClick={handleSaveAvailability}
              >
                Save
              </button>
            </div>
            <AvailabilitySettings availability={availability} onChange={handleAvailChange} />
          </div>
        </div>

        {/* Appointments list */}
        <div className="lg:col-span-2">
          <div className="card-no-hover !p-0 overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                {APT_TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: activeTab === tab ? 'var(--accent)' : 'transparent',
                      color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <Button variant="secondary" size="sm" icon={<Download size={13} />}>Export</Button>
            </div>

            {/* List */}
            <div className="p-4 space-y-3">
              {filteredApts.length === 0 ? (
                <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
                  <Calendar size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No appointments {activeTab.toLowerCase()}</p>
                </div>
              ) : (
                filteredApts.map(apt => (
                  <AppointmentItem key={apt.id} apt={apt} isActive={apt.isActive} onUpdateStatus={handleUpdateStatus} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <BookAppointmentModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        date={selectedSlotDate}
        time={selectedSlotTime}
        onBooked={fetchApts}
      />
    </PageWrapper>
  );
}
