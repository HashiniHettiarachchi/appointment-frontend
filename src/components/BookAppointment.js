import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { servicesAPI, appointmentsAPI, usersAPI } from '../services/api';
import './BookAppointment.css';

const BookAppointment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  const [formData, setFormData] = useState({
    service: location.state?.service?._id || '',
    staff: '',
    appointmentDate: '',
    startTime: '09:00',
    endTime: '10:00',
    notes: '',
    paymentMethod: 'cash', // Default to cash
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchServices();
    fetchStaff();
  }, []);

  useEffect(() => {
    // Auto-calculate end time based on service duration
    if (formData.service && formData.startTime) {
      const selectedService = services.find(s => s._id === formData.service);
      if (selectedService) {
        const [hours, minutes] = formData.startTime.split(':');
        const startMinutes = parseInt(hours) * 60 + parseInt(minutes);
        const endMinutes = startMinutes + selectedService.duration;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
        setFormData(prev => ({ ...prev, endTime }));
      }
    }
  }, [formData.service, formData.startTime, services]);

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

    try {
      // Get service price
      const selectedService = services.find(s => s._id === formData.service);
      const amount = selectedService?.price || 0;

      // Create appointment with payment method and amount
      const appointmentData = {
        ...formData,
        amount: amount,
        paymentMethod: formData.paymentMethod || 'cash'
      };

      const response = await appointmentsAPI.create(appointmentData);
      const appointmentId = response.data.appointment._id;

      // If online payment selected, redirect to payment page
      if (formData.paymentMethod === 'online') {
        setSuccess('Redirecting to payment...');
        setTimeout(() => {
          navigate('/payment', { 
            state: { 
              appointmentId: appointmentId,
              amount: amount,
              serviceName: selectedService.name
            } 
          });
        }, 1000);
      } else {
        // Cash payment - just show success
        setSuccess('Appointment booked successfully! Pay cash at the salon.');
        setTimeout(() => {
          navigate('/appointments');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      timeSlots.push(time);
    }
  }

  return (
    <div className="booking-container">
      <div className="booking-card">
        <h2 className="booking-title">📅 Book Your Appointment</h2>
        <p className="booking-subtitle">Fill in the details below to schedule your visit</p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-group">
            <label htmlFor="service">Select Service *</label>
            <select
              id="service"
              name="service"
              value={formData.service}
              onChange={handleChange}
              required
              className="form-input"
            >
              <option value="">-- Choose a service --</option>
              {services.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name} (Rs.{service.price} - {service.duration} mins)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="staff">Select Staff Member *</label>
            <select
              id="staff"
              name="staff"
              value={formData.staff}
              onChange={handleChange}
              required
              disabled={loadingStaff}
              className="form-input"
            >
              <option value="">
                {loadingStaff ? '-- Loading staff...' : '-- Choose a staff member --'}
              </option>
              {staff.length === 0 && !loadingStaff ? (
                <option value="" disabled>No staff members available</option>
              ) : (
                staff.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                    {member.specialization ? ` - ${member.specialization}` : ''}
                  </option>
                ))
              )}
            </select>
            {staff.length === 0 && !loadingStaff && (
              <small className="form-help error">
                No staff members found. Please register users with "staff" role first.
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="appointmentDate">Appointment Date *</label>
            <input
              type="date"
              id="appointmentDate"
              name="appointmentDate"
              value={formData.appointmentDate}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Start Time *</label>
              <select
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                className="form-input"
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                readOnly
                className="form-input"
              />
              <small className="form-help">Auto-calculated based on service duration</small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Special Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              placeholder="Any special requests or notes for your appointment..."
              className="form-input"
            />
          </div>

          {/* Payment Method Selection */}
          <div className="form-group payment-section">
            <label className="section-label">💳 Payment Method</label>
            <div className="payment-options">
              <div 
                className={`payment-option ${formData.paymentMethod === 'cash' ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
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
                  type="radio"
                  name="paymentMethod"
                  value="online"
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

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="cancel-button"
            >
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
