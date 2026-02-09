import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AppointmentList.css';

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentsAPI.getAll();
      setAppointments(response.data);
    } catch (err) {
      setError('Failed to load appointments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await appointmentsAPI.cancel(id);
      fetchAppointments(); // Refresh list
    } catch (err) {
      alert('Failed to cancel appointment');
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await appointmentsAPI.update(id, { status: newStatus });
      fetchAppointments(); // Refresh list
    } catch (err) {
      alert('Failed to update appointment status');
      console.error(err);
    }
  };

  const handleMarkAsPaid = async (id) => {
    if (!window.confirm('Mark this cash payment as received?')) {
      return;
    }

    try {
      await appointmentsAPI.update(id, { 
        paymentStatus: 'paid',
        paidAt: new Date().toISOString()
      });
      fetchAppointments(); // Refresh list
    } catch (err) {
      alert('Failed to update payment status');
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffa500',
      confirmed: '#4caf50',
      cancelled: '#f44336',
      completed: '#2196f3',
    };
    return colors[status] || '#999';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      confirmed: '✅',
      cancelled: '❌',
      completed: '🎉',
    };
    return icons[status] || '📅';
  };

  const getPaymentStatusColor = (paymentStatus) => {
    const colors = {
      pending: '#ffa500',
      paid: '#4caf50',
      failed: '#f44336',
      refunded: '#2196f3',
    };
    return colors[paymentStatus] || '#999';
  };

  const getPaymentStatusIcon = (paymentStatus) => {
    const icons = {
      pending: '⏳',
      paid: '✅',
      failed: '❌',
      refunded: '💰',
    };
    return icons[paymentStatus] || '💳';
  };

  const getPaymentMethodIcon = (paymentMethod) => {
    const icons = {
      cash: '💵',
      online: '💳',
    };
    return icons[paymentMethod] || '💰';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="appointments-container">
        <div className="loading-spinner">Loading appointments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="appointments-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h1>My Appointments</h1>
        <Link to="/book-appointment" className="book-new-button">
          + Book New Appointment
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div className="no-appointments">
          <div className="no-appointments-icon">📅</div>
          <h2>No appointments yet</h2>
          <p>Book your first appointment to get started!</p>
          <Link to="/services" className="browse-services-button">
            Browse Services
          </Link>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map((appointment) => (
            <div key={appointment._id} className="appointment-card">
              <div className="appointment-header">
                <div className="appointment-status" style={{ backgroundColor: getStatusColor(appointment.status) }}>
                  {getStatusIcon(appointment.status)} {appointment.status.toUpperCase()}
                </div>
                <div className="appointment-date">
                  {formatDate(appointment.appointmentDate)}
                </div>
              </div>

              <div className="appointment-body">
                <div className="appointment-detail">
                  <span className="detail-label">Service:</span>
                  <span className="detail-value">{appointment.service?.name}</span>
                </div>

                <div className="appointment-detail">
                  <span className="detail-label">Staff:</span>
                  <span className="detail-value">{appointment.staff?.name}</span>
                </div>

                <div className="appointment-detail">
                  <span className="detail-label">Time:</span>
                  <span className="detail-value">
                    {appointment.startTime} - {appointment.endTime}
                  </span>
                </div>

                <div className="appointment-detail">
                  <span className="detail-label">Duration:</span>
                  <span className="detail-value">{appointment.service?.duration} minutes</span>
                </div>

                <div className="appointment-detail">
                  <span className="detail-label">Price:</span>
                  <span className="detail-value price">Rs.{appointment.amount || appointment.service?.price}</span>
                </div>

                {/* Payment Information */}
                <div className="payment-info-section">
                  <div className="appointment-detail">
                    <span className="detail-label">Payment Method:</span>
                    <span className="payment-method-badge">
                      {getPaymentMethodIcon(appointment.paymentMethod)} {appointment.paymentMethod === 'cash' ? 'Cash' : 'Online'}
                    </span>
                  </div>

                  <div className="appointment-detail">
                    <span className="detail-label">Payment Status:</span>
                    <span 
                      className="payment-status-badge" 
                      style={{ backgroundColor: getPaymentStatusColor(appointment.paymentStatus) }}
                    >
                      {getPaymentStatusIcon(appointment.paymentStatus)} {appointment.paymentStatus?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>

                  {appointment.paymentStatus === 'paid' && appointment.paidAt && (
                    <div className="appointment-detail">
                      <span className="detail-label">Paid At:</span>
                      <span className="detail-value">{new Date(appointment.paidAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {appointment.notes && (
                  <div className="appointment-notes">
                    <span className="detail-label">Notes:</span>
                    <p>{appointment.notes}</p>
                  </div>
                )}

                {user?.role === 'customer' && (
                  <div className="appointment-customer-info">
                    <span className="detail-label">Customer:</span>
                    <span className="detail-value">{appointment.customer?.name}</span>
                  </div>
                )}
              </div>

              <div className="appointment-actions">
                {appointment.status === 'pending' && (
                  <>
                    {user?.role === 'staff' || user?.role === 'admin' ? (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(appointment._id, 'confirmed')}
                          className="action-button confirm-button"
                        >
                          ✅ Confirm
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(appointment._id)}
                          className="action-button cancel-button"
                        >
                          ❌ Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleCancelAppointment(appointment._id)}
                        className="action-button cancel-button"
                      >
                        Cancel Appointment
                      </button>
                    )}
                  </>
                )}

                {appointment.status === 'confirmed' && (user?.role === 'staff' || user?.role === 'admin') && (
                  <button
                    onClick={() => handleUpdateStatus(appointment._id, 'completed')}
                    className="action-button complete-button"
                  >
                    ✓ Mark as Completed
                  </button>
                )}

                {/* Mark Cash Payment as Paid Button */}
                {(user?.role === 'staff' || user?.role === 'admin') && 
                 appointment.paymentMethod === 'cash' && 
                 appointment.paymentStatus === 'pending' && (
                  <button
                    onClick={() => handleMarkAsPaid(appointment._id)}
                    className="action-button paid-button"
                  >
                    💵 Mark Cash as Paid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
