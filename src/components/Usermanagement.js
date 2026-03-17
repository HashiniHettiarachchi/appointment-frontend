import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Usermanagement.css';

const ROLES = ['customer', 'staff', 'admin'];

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'customer',
  specialization: '',
};

const ROLE_COLORS = {
  admin:   { bg: '#fce4ec', color: '#c62828' },
  staff:  { bg: '#e3f2fd', color: '#1565c0' },
  customer: { bg: '#f3e5f5', color: '#6a1b9a' },
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete
  const [deletingId, setDeletingId] = useState(null);

  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') navigate('/');
  }, [currentUser, navigate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data || []);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  // ── Modal ──
  const openAddModal = () => {
    setEditingUser(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      password: '',
      phone: u.phone || '',
      role: u.role || 'staff',
      specialization: u.specialization || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData(EMPTY_FORM);
    setFormError('');
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    if (!formData.name || !formData.email) {
      setFormError('Name and email are required');
      setFormLoading(false);
      return;
    }

    if (!editingUser && !formData.password) {
      setFormError('Password is required for new users');
      setFormLoading(false);
      return;
    }

    try {
      const payload = { ...formData };
      if (editingUser && !payload.password) delete payload.password;

      if (editingUser) {
        await usersAPI.update(editingUser._id, payload);
        showSuccess('✅ User updated successfully!');
      } else {
        await usersAPI.create(payload);
        showSuccess('✅ User created successfully!');
      }

      closeModal();
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (id) => {
    try {
      await usersAPI.delete(id);
      showSuccess('✅ User deleted successfully!');
      setDeletingId(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      setDeletingId(null);
    }
  };

  // ── Approve / Reject ──
  const handleApprove = async (id) => {
    try {
      await usersAPI.approve(id);
      showSuccess('✅ Staff member approved!');
      fetchUsers();
    } catch (err) {
      setError('Failed to approve staff');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject and remove this staff member?')) return;
    try {
      await usersAPI.reject(id);
      showSuccess('✅ Staff member rejected and removed');
      fetchUsers();
    } catch (err) {
      setError('Failed to reject staff');
    }
  };

  // ── Filter ──
  const filteredUsers = users.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRole && matchSearch;
  });

  const countByRole = (role) => users.filter(u => u.role === role).length;

  if (loading) return (
    <div className="um-container">
      <div className="um-loading">Loading users...</div>
    </div>
  );

  return (
    <div className="um-container">

      {/* Header */}
      <div className="um-header">
        <div>
          <h1>👥 User Management</h1>
          <p className="um-subtitle">{users.length} total users</p>
        </div>
        <button className="um-add-button" onClick={openAddModal}>
          + Add User
        </button>
      </div>

      {/* Alerts */}
      {error   && <div className="um-alert um-alert-error">{error}</div>}
      {success && <div className="um-alert um-alert-success">{success}</div>}

      {/* Role Filter Tabs */}
      <div className="um-filter-tabs">
        {['all', 'admin', 'staff', 'customer'].map(role => (
          <button
            key={role}
            className={`um-tab ${roleFilter === role ? 'active' : ''}`}
            onClick={() => setRoleFilter(role)}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
            <span className="um-tab-count">
              {role === 'all' ? users.length : countByRole(role)}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="um-search-wrapper">
        <input
          type="text"
          placeholder="🔍 Search by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="um-search"
        />
      </div>

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <div className="um-empty">
          <div className="um-empty-icon">👥</div>
          <h2>No users found</h2>
        </div>
      ) : (
        <div className="um-table-wrapper">
          <table className="um-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u._id}>

                  <td>
                    <div className="um-user-name">{u.name}</div>
                    {u.specialization && (
                      <div className="um-user-spec">📋 {u.specialization}</div>
                    )}
                  </td>

                  <td className="um-email">{u.email}</td>

                  <td>{u.phone || '—'}</td>

                  <td>
                    <span
                      className="um-role-badge"
                      style={{
                        background: ROLE_COLORS[u.role]?.bg,
                        color: ROLE_COLORS[u.role]?.color,
                      }}
                    >
                      {u.role.toUpperCase()}
                    </span>
                  </td>

                  <td>
                    {(u.role === 'staff') ? (
                      <span className={`um-approval ${u.isApproved ? 'approved' : 'pending'}`}>
                        {u.isApproved ? '✅ Approved' : '⏳ Pending'}
                      </span>
                    ) : (
                      <span className="um-approval approved">✅ Active</span>
                    )}
                  </td>

                  <td>
                    <div className="um-actions">

                      {/* Approve/Reject for pending staff */}
                      {(u.role === 'staff') && !u.isApproved && (
                        <>
                          <button
                            className="um-btn um-btn-approve"
                            onClick={() => handleApprove(u._id)}
                          >
                            ✅ Approve
                          </button>
                          <button
                            className="um-btn um-btn-reject"
                            onClick={() => handleReject(u._id)}
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}

                      <button
                        className="um-btn um-btn-edit"
                        onClick={() => openEditModal(u)}
                      >
                        ✏️ Edit
                      </button>

                      {/* Prevent deleting own account */}
                      {currentUser?._id !== u._id && (
                        deletingId === u._id ? (
                          <div className="um-confirm-delete">
                            <span>Sure?</span>
                            <button
                              className="um-btn um-btn-danger"
                              onClick={() => handleDelete(u._id)}
                            >
                              Yes
                            </button>
                            <button
                              className="um-btn um-btn-secondary"
                              onClick={() => setDeletingId(null)}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            className="um-btn um-btn-delete"
                            onClick={() => setDeletingId(u._id)}
                          >
                            🗑️ Delete
                          </button>
                        )
                      )}

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div className="um-modal-overlay" onClick={closeModal}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>

            <div className="um-modal-header">
              <h2>{editingUser ? '✏️ Edit User' : '➕ Add User'}</h2>
              <button className="um-modal-close" onClick={closeModal}>✕</button>
            </div>

            {formError && <div className="um-alert um-alert-error">{formError}</div>}

            <form onSubmit={handleSubmit} className="um-form">

              <div className="um-form-row">
                <div className="um-form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="um-input"
                    required
                  />
                </div>
                <div className="um-form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="07XXXXXXXX"
                    className="um-input"
                  />
                </div>
              </div>

              <div className="um-form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="user@example.com"
                  className="um-input"
                  required
                />
              </div>

              <div className="um-form-group">
                <label>{editingUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={editingUser ? 'Leave blank to keep current' : 'Min 6 characters'}
                  className="um-input"
                  required={!editingUser}
                />
              </div>

              <div className="um-form-row">
                <div className="um-form-group">
                  <label>Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="um-input"
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {(formData.role === 'staff') && (
                  <div className="um-form-group">
                    <label>Specialization</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="e.g. Cardiology"
                      className="um-input"
                    />
                  </div>
                )}
              </div>

              <div className="um-form-actions">
                <button
                  type="button"
                  className="um-btn um-btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="um-btn um-btn-primary"
                  disabled={formLoading}
                >
                  {formLoading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;