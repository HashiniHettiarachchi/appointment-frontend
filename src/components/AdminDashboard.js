import React, { useState, useEffect } from 'react';
import { servicesAPI, appointmentsAPI } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration: '',
    price: '',
    category: 'haircut',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, appointmentsRes] = await Promise.all([
        servicesAPI.getAll(),
        appointmentsAPI.getAll(),
      ]);
      setServices(servicesRes.data);
      setAppointments(appointmentsRes.data);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      await servicesAPI.create(newService);
      setShowAddService(false);
      setNewService({ name: '', description: '', duration: '', price: '', category: 'haircut' });
      fetchData();
    } catch (err) {
      alert('Failed to add service');
      console.error(err);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      await servicesAPI.delete(id);
      fetchData();
    } catch (err) {
      alert('Failed to delete service');
      console.error(err);
    }
  };

  const handleUpdateAppointmentStatus = async (id, status) => {
    try {
      await appointmentsAPI.update(id, { status });
      fetchData();
    } catch (err) {
      alert('Failed to update appointment');
      console.error(err);
    }
  };

  const getStats = () => {
    return {
      totalAppointments: appointments.length,
      pendingAppointments: appointments.filter(a => a.status === 'pending').length,
      confirmedAppointments: appointments.filter(a => a.status === 'confirmed').length,
      totalServices: services.length,
      totalRevenue: appointments
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (a.service?.price || 0), 0),
    };
  };

  const stats = getStats();

  if (loading) {
    return <div className="admin-loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-container">
      <h1 className="admin-title">Admin Dashboard</h1>

      {error && <div className="error-message">{error}</div>}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>{stats.totalAppointments}</h3>
            <p>Total Appointments</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{stats.pendingAppointments}</h3>
            <p>Pending</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.confirmedAppointments}</h3>
            <p>Confirmed</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✂️</div>
          <div className="stat-info">
            <h3>{stats.totalServices}</h3>
            <p>Services</p>
          </div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Rs.{stats.totalRevenue}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
      </div>

      {/* Services Management */}
      <div className="admin-section">
        <div className="section-header">
          <h2>Manage Services</h2>
          <button
            onClick={() => setShowAddService(!showAddService)}
            className="add-button"
          >
            {showAddService ? '✕ Cancel' : '+ Add Service'}
          </button>
        </div>

        {showAddService && (
          <form onSubmit={handleAddService} className="add-service-form">
            <input
              type="text"
              placeholder="Service Name"
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              required
              className="form-input"
            />
            <textarea
              placeholder="Description"
              value={newService.description}
              onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              required
              className="form-input"
            />
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={newService.duration}
              onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
              required
              className="form-input"
            />
            <input
              type="number"
              placeholder="Price ($)"
              value={newService.price}
              onChange={(e) => setNewService({ ...newService, price: e.target.value })}
              required
              className="form-input"
            />
            <select
              value={newService.category}
              onChange={(e) => setNewService({ ...newService, category: e.target.value })}
              className="form-input"
            >
              <option value="haircut">Haircut</option>
              <option value="coloring">Coloring</option>
              <option value="styling">Styling</option>
              <option value="facial">Facial</option>
              <option value="manicure">Manicure</option>
              <option value="pedicure">Pedicure</option>
              <option value="massage">Massage</option>
              <option value="other">Other</option>
            </select>
            <button type="submit" className="submit-button">Add Service</button>
          </form>
        )}

        <div className="services-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service._id}>
                  <td>{service.name}</td>
                  <td>{service.category}</td>
                  <td>{service.duration} mins</td>
                  <td>Rs.{service.price}</td>
                  <td>
                    <button
                      onClick={() => handleDeleteService(service._id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Appointments Management */}
      <div className="admin-section">
        <h2>All Appointments</h2>
        <div className="appointments-table">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>Staff</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt._id}>
                  <td>{apt.customer?.name}</td>
                  <td>{apt.service?.name}</td>
                  <td>{apt.staff?.name}</td>
                  <td>{new Date(apt.appointmentDate).toLocaleDateString()}</td>
                  <td>{apt.startTime}</td>
                  <td>
                    <span className={`status-badge ${apt.status}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td>
                    {apt.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateAppointmentStatus(apt._id, 'confirmed')}
                        className="confirm-button-small"
                      >
                        Confirm
                      </button>
                    )}
                    {apt.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateAppointmentStatus(apt._id, 'completed')}
                        className="complete-button-small"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
