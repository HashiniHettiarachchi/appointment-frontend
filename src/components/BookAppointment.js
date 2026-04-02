import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { servicesAPI, appointmentsAPI, usersAPI } from '../services/api';
import './BookAppointment.css';

const API_BASE_URL = "https://appointment-backend-wpie.vercel.app/api";

// ─── Calendar Helpers ──────────────────────────────────────────────────────────
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${MONTH_NAMES[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

// ─── Mini Calendar Component ───────────────────────────────────────────────────
function MiniCalendar({ selectedDate, onDateSelect, holidays, loadingHolidays }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(
    selectedDate ? parseInt(selectedDate.split('-')[0]) : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selectedDate ? parseInt(selectedDate.split('-')[1]) - 1 : today.getMonth()
  );

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build grid cells (nulls = empty leading cells)
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="mini-calendar">
      {/* Month navigation */}
      <div className="cal-header">
        <button type="button" className="cal-nav" onClick={prevMonth}>‹</button>
        <span className="cal-month-title">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button type="button" className="cal-nav" onClick={nextMonth}>›</button>
      </div>

      {/* Loading indicator */}
      {loadingHolidays && (
        <div className="cal-loading">
          <span className="cal-spinner" />
          Loading Sri Lanka holidays...
        </div>
      )}

      {/* Day headers */}
      <div className="cal-grid">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="cal-day-header">{d}</div>
        ))}

        {/* Day cells */}
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="cal-cell empty" />;

          const dateStr = toDateStr(viewYear, viewMonth, day);
          const isPast     = dateStr < todayStr;
          const isToday    = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const holidayName = holidays[dateStr];
          const isHoliday  = Boolean(holidayName);

          let cls = 'cal-cell';
          if (isPast)     cls += ' past';
          else if (isHoliday) cls += ' blocked';
          if (isToday)    cls += ' today';
          if (isSelected) cls += ' selected';

          return (
            <div
              key={dateStr}
              className={cls}
              title={holidayName || ''}
              onClick={() => {
                if (!isPast && !isHoliday) onDateSelect(dateStr);
              }}
            >
              <span className="day-number">{day}</span>
              {isHoliday && !isPast && <span className="holiday-dot" />}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="cal-legend">
        <span className="legend-item">
          <span className="legend-dot blocked-dot" /> Poya / Public Holiday
        </span>
        <span className="legend-item">
          <span className="legend-dot today-dot" /> Today
        </span>
        <span className="legend-item">
          <span className="legend-dot selected-dot" /> Selected
        </span>
      </div>
    </div>
  );
}

// ─── Main BookAppointment Component ───────────────────────────────────────────
const BookAppointment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ── State ──
  const [services, setServices]           = useState([]);
  const [staff, setStaff]                 = useState([]);
  const [loadingStaff, setLoadingStaff]   = useState(true);
  const [showCalendar, setShowCalendar]   = useState(false);

  // Holidays fetched from backend /api/holidays
  const [holidays, setHolidays]               = useState({});
  const [loadingHolidays, setLoadingHolidays] = useState(true);
  const [holidayError, setHolidayError]       = useState('');

  const [formData, setFormData] = useState({
    service:         location.state?.service?._id || '',
    staff:           '',
    appointmentDate: '',
    startTime:       '09:00',
    endTime:         '10:00',
    notes:           '',
    paymentMethod:   'cash',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  // ── Fetch holidays from backend ──
  const fetchHolidays = useCallback(async () => {
    try {
      setLoadingHolidays(true);
      setHolidayError('');
      // const response = await fetch('/api/holidays');
      const response = await axios.get(`${API_BASE_URL}/holidays`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setHolidays(data);
    } catch (err) {
      console.error('Failed to fetch holidays:', err);
      setHolidayError('Could not load holiday data. Some dates may not be blocked.');
    } finally {
      setLoadingHolidays(false);
    }
  }, []);

  // ── On mount ──
  useEffect(() => {
    fetchServices();
    fetchStaff();
    fetchHolidays();
  }, [fetchHolidays]);

  // ── Auto-calculate end time based on service duration ──
  useEffect(() => {
    if (formData.service && formData.startTime) {
      const selectedService = services.find(s => s._id === formData.service);
      if (selectedService) {
        const [hours, minutes] = formData.startTime.split(':');
        const startMinutes = parseInt(hours) * 60 + parseInt(minutes);
        const endMinutes   = startMinutes + selectedService.duration;
        const endHours     = Math.floor(endMinutes / 60);
        const endMins      = endMinutes % 60;
        setFormData(prev => ({
          ...prev,
          endTime: `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`,
        }));
      }
    }
  }, [formData.service, formData.startTime, services]);

  // ── API calls ──
  const fetchServices = async () => {
    try {
      const response = await servicesAPI.getAll();
      setServices(response.data);
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await usersAPI.getStaff();
      setStaff(response.data);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      setError('Failed to load staff members. Please try again later.');
    } finally {
      setLoadingStaff(false);
    }
  };

  // ── Handlers ──
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleDateSelect = (dateStr) => {
    setFormData(prev => ({ ...prev, appointmentDate: dateStr }));
    setShowCalendar(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.service || !formData.staff || !formData.appointmentDate) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (formData.appointmentDate < today) {
      setError('Cannot book appointments in the past');
      setLoading(false);
      return;
    }

    // Block holidays even if UI is bypassed
    if (holidays[formData.appointmentDate]) {
      setError(`This date is a public holiday (${holidays[formData.appointmentDate]}) and cannot be booked.`);
      setLoading(false);
      return;
    }

    try {
      const selectedService = services.find(s => s._id === formData.service);
      const amount = selectedService?.price || 0;

      const appointmentData = {
        ...formData,
        amount,
        paymentMethod: formData.paymentMethod || 'cash',
      };

      const response = await appointmentsAPI.create(appointmentData);
      const appointmentId = response.data.appointment._id;

      if (formData.paymentMethod === 'online') {
        setSuccess('Redirecting to payment...');
        setTimeout(() => {
          navigate('/payment', {
            state: {
              appointmentId,
              amount,
              serviceName: selectedService.name,
            },
          });
        }, 1000);
      } else {
        setSuccess('Appointment booked successfully! Pay cash at the salon.');
        setTimeout(() => navigate('/appointments'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  // ── Time slots (9am to 6pm, every 30 mins) ──
  const timeSlots = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeSlots.push(
        `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      );
    }
  }

  const selectedHolidayName = formData.appointmentDate
    ? holidays[formData.appointmentDate]
    : null;

  // ── Render ──
  return (
    <div className="booking-container">
      <div className="booking-card">
        <h2 className="booking-title">📅 Book Your Appointment</h2>
        <p className="booking-subtitle">Fill in the details below to schedule your visit</p>

        {error         && <div className="error-message">{error}</div>}
        {success       && <div className="success-message">{success}</div>}
        {holidayError  && <div className="warning-message">⚠️ {holidayError}</div>}

        <form onSubmit={handleSubmit} className="booking-form">

          {/* ── Service ── */}
          <div className="form-group">
            <label htmlFor="service">Select Service *</label>
            <select
              id="service" name="service"
              value={formData.service} onChange={handleChange}
              required className="form-input"
            >
              <option value="">-- Choose a service --</option>
              {services.map(service => (
                <option key={service._id} value={service._id}>
                  {service.name} (Rs.{service.price} - {service.duration} mins)
                </option>
              ))}
            </select>
          </div>

          {/* ── Staff ── */}
          <div className="form-group">
            <label htmlFor="staff">Select Staff Member *</label>
            <select
              id="staff" name="staff"
              value={formData.staff} onChange={handleChange}
              required disabled={loadingStaff} className="form-input"
            >
              <option value="">
                {loadingStaff ? '-- Loading staff...' : '-- Choose a staff member --'}
              </option>
              {staff.length === 0 && !loadingStaff
                ? <option value="" disabled>No staff members available</option>
                : staff.map(member => (
                  <option key={member._id} value={member._id}>
                    {member.name}{member.specialization ? ` - ${member.specialization}` : ''}
                  </option>
                ))
              }
            </select>
            {staff.length === 0 && !loadingStaff && (
              <small className="form-help error">
                No staff members found. Please register users with "staff" role first.
              </small>
            )}
          </div>

          {/* ── Date picker with Sri Lanka Holiday Calendar ── */}
          <div className="form-group">
            <label>Appointment Date *</label>

            <div className="date-picker-wrapper">
              {/* Trigger button */}
              <button
                type="button"
                className={`date-trigger ${formData.appointmentDate ? 'has-date' : ''}`}
                onClick={() => setShowCalendar(prev => !prev)}
              >
                <span className="date-trigger-icon">📅</span>
                <span className="date-trigger-text">
                  {formData.appointmentDate
                    ? formatDisplayDate(formData.appointmentDate)
                    : 'Choose a date'}
                </span>
                <span className="date-trigger-arrow">{showCalendar ? '▲' : '▼'}</span>
              </button>

              {/* Calendar dropdown */}
              {showCalendar && (
                <div className="calendar-dropdown">
                  <MiniCalendar
                    selectedDate={formData.appointmentDate}
                    onDateSelect={handleDateSelect}
                    holidays={holidays}
                    loadingHolidays={loadingHolidays}
                  />
                  <div className="holiday-info-box">
                    <strong>🇱🇰 Sri Lanka Public Holidays</strong>
                    <p>Red dates are Poya days &amp; public holidays — unavailable for booking.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Show holiday name if selected date is a holiday */}
            {selectedHolidayName && (
              <small className="form-help error">
                ⚠️ {selectedHolidayName} — this date is unavailable for booking.
              </small>
            )}
          </div>

          {/* ── Time ── */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Start Time *</label>
              <select
                id="startTime" name="startTime"
                value={formData.startTime} onChange={handleChange}
                required className="form-input"
              >
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input
                type="time"
                id="endTime" name="endTime"
                value={formData.endTime}
                readOnly className="form-input"
              />
              <small className="form-help">Auto-calculated based on service duration</small>
            </div>
          </div>

          {/* ── Notes ── */}
          <div className="form-group">
            <label htmlFor="notes">Special Notes (Optional)</label>
            <textarea
              id="notes" name="notes"
              value={formData.notes} onChange={handleChange}
              rows="4"
              placeholder="Any special requests or notes for your appointment..."
              className="form-input"
            />
          </div>

          {/* ── Payment Method ── */}
          <div className="form-group payment-section">
            <label className="section-label">💳 Payment Method</label>
            <div className="payment-options">

              <div
                className={`payment-option ${formData.paymentMethod === 'cash' ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
              >
                <input
                  type="radio" name="paymentMethod" value="cash"
                  checked={formData.paymentMethod === 'cash'}
                  onChange={handleChange}
                />
                <div className="payment-content">
                  <span className="payment-icon">💵</span>
                  <div>
                    <strong>Pay with Cash</strong>
                    <p>Pay at the salon after your service</p>
                  </div>
                </div>
              </div>

              <div
                className={`payment-option ${formData.paymentMethod === 'online' ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, paymentMethod: 'online' })}
              >
                <input
                  type="radio" name="paymentMethod" value="online"
                  checked={formData.paymentMethod === 'online'}
                  onChange={handleChange}
                />
                <div className="payment-content">
                  <span className="payment-icon">💳</span>
                  <div>
                    <strong>Pay Online</strong>
                    <p>Secure payment with card</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── Actions ── */}
          <div className="form-actions">
            <button type="button" onClick={() => navigate(-1)} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default BookAppointment;
