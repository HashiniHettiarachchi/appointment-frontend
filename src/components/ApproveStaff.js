import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./ApproveStaff.css";

const API_BASE_URL = "https://appointment-backend-wpie.vercel.app/api";

const ApproveStaff = () => {
  const [pendingStaff, setPendingStaff] = useState([]);
  const [approvedStaff, setApprovedStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedSpecializations, setSelectedSpecializations] = useState({});
  
  // Edit modal state
  const [editingStaff, setEditingStaff] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
  });

  const token = localStorage.getItem("token");

  const fetchPendingStaff = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/users/staff/pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingStaff(response.data);
    } catch (err) {
      console.error("Error fetching pending staff:", err);
      setError(
        "Failed to load pending staff. " +
          (err.response?.data?.message || err.message)
      );
    }
  }, [token]);

  const fetchApprovedStaff = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/users/staff`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApprovedStaff(response.data);
    } catch (err) {
      console.error("Error fetching approved staff:", err);
    }
  }, [token]);

  const fetchServices = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/services`);
      setServices(response.data);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingStaff();
    fetchApprovedStaff();
    fetchServices();
  }, [fetchPendingStaff, fetchApprovedStaff, fetchServices]);

  const handleSelectSpecialization = (staffId, specialization) => {
    setSelectedSpecializations({
      ...selectedSpecializations,
      [staffId]: specialization,
    });
  };

  const handleApprove = async (staffId, staffName) => {
    const specialization = selectedSpecializations[staffId];

    if (!specialization) {
      alert("Please select a service category first!");
      return;
    }

    try {
      await axios.put(
        `${API_BASE_URL}/users/staff/${staffId}/approve`,
        { specialization },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`✅ ${staffName} has been approved as ${specialization} staff!`);
      setTimeout(() => setSuccess(""), 3000);

      // Refresh both lists
      fetchPendingStaff();
      fetchApprovedStaff();

      // Clear the selection for this staff
      const newSelections = { ...selectedSpecializations };
      delete newSelections[staffId];
      setSelectedSpecializations(newSelections);
    } catch (err) {
      console.error("Error approving staff:", err);
      setError(
        "Failed to approve staff. " +
          (err.response?.data?.message || err.message)
      );
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleReject = async (staffId, staffName) => {
    if (!window.confirm(`Are you sure you want to reject ${staffName}?`)) {
      return;
    }

    try {
      await axios.put(
        `${API_BASE_URL}/users/staff/${staffId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`${staffName} has been rejected and removed`);
      setTimeout(() => setSuccess(""), 3000);

      fetchPendingStaff();
    } catch (err) {
      console.error("Error rejecting staff:", err);
      setError("Failed to reject staff");
      setTimeout(() => setError(""), 3000);
    }
  };

  // Open edit modal
  const handleEdit = (staff) => {
    setEditingStaff(staff);
    setEditForm({
      name: staff.name,
      email: staff.email,
      // phone: staff.phone || "",
      phone: staff.phone,
      specialization: staff.specialization || "",
    });
    setShowEditModal(true);
  };

  // Handle form input changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value,
    });
  };

  // Submit edit form
  const handleUpdateStaff = async (e) => {
    e.preventDefault();

    try {
      await axios.put(
        `${API_BASE_URL}/users/staff/${editingStaff._id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Staff member updated successfully!");
      setTimeout(() => setSuccess(""), 3000);

      setShowEditModal(false);
      setEditingStaff(null);
      fetchApprovedStaff();
    } catch (err) {
      console.error("Error updating staff:", err);
      setError(
        "Failed to update staff. " +
          (err.response?.data?.message || err.message)
      );
      setTimeout(() => setError(""), 3000);
    }
  };

  // Delete staff member
  const handleDelete = async (staffId, staffName) => {
    if (
      !window.confirm(
        `Delete ${staffName}?\n\nThis action cannot be undone. The staff member will be permanently removed from the database.`
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/users/staff/${staffId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(`${staffName} has been deleted successfully`);
      setTimeout(() => setSuccess(""), 3000);

      fetchApprovedStaff();
    } catch (err) {
      console.error("Error deleting staff:", err);
      setError(
        err.response?.data?.message || "Failed to delete staff member"
      );
      setTimeout(() => setError(""), 3000);
    }
  };

  if (loading) {
    return (
      <div className="approve-staff-container">
        <div className="loading">⏳ Loading staff members and services...</div>
      </div>
    );
  }

  return (
    <div className="approve-staff-container">
      <div className="page-header">
        <h1>👥 Staff Management</h1>
        <p>Review and approve new staff member registrations</p>
      </div>

      {error && (
        <div className="message error-message">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="message success-message">
          ✅ {success}
        </div>
      )}

      {/* PENDING STAFF SECTION */}
      <div className="section">
        <div className="section-header">
          <h2>⏳ Pending Approvals ({pendingStaff.length})</h2>
          <p>Staff members waiting for your approval</p>
        </div>

        {pendingStaff.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>No Pending Approvals</h3>
            <p>All staff registrations have been reviewed!</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Registered Date</th>
                  <th>Select Specialization</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingStaff.map((staff) => (
                  <tr key={staff._id}>
                    <td>
                      <div className="staff-name-cell">
                        <span className="new-badge">NEW</span>
                        <strong>{staff.name}</strong>
                      </div>
                    </td>
                    <td>{staff.email}</td>
                    <td>{staff.phone || "N/A"}</td>
                    <td>{new Date(staff.createdAt).toLocaleDateString()}</td>
                    <td>
                      <select
                        className="category-dropdown"
                        value={selectedSpecializations[staff._id] || ""}
                        onChange={(e) =>
                          handleSelectSpecialization(staff._id, e.target.value)
                        }
                      >
                        <option value="">-- Select Specialization --</option>
                        {services.map((service) => (
                          <option key={service._id} value={service.name}>
                            {service.name} ({service.category})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-approve"
                          onClick={() => handleApprove(staff._id, staff.name)}
                          disabled={!selectedSpecializations[staff._id]}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleReject(staff._id, staff.name)}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* APPROVED STAFF SECTION */}
      <div className="section">
        <div className="section-header">
          <h2>✅ Approved Staff ({approvedStaff.length})</h2>
          <p>Currently active staff members</p>
        </div>

        {approvedStaff.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No Approved Staff Yet</h3>
            <p>Approve pending staff to see them here</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Specialization</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedStaff.map((staff) => (
                  <tr key={staff._id}>
                    <td>
                      <strong>{staff.name}</strong>
                    </td>
                    <td>{staff.email}</td>
                    <td>{staff.phone || "N/A"}</td>
                    <td>
                      <span className="specialization-badge">
                        {staff.specialization || "Not Set"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(staff)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(staff._id, staff.name)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit Staff Member</h2>
              <button
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateStaff}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditFormChange}
                  // placeholder="0771234567"
                  required
                />
              </div>

              <div className="form-group">
                <label>Specialization *</label>
                <select
                  name="specialization"
                  value={editForm.specialization}
                  onChange={handleEditFormChange}
                  required
                  className="category-dropdown"
                >
                  <option value="">-- Select Specialization --</option>
                  {services.map((service) => (
                    <option key={service._id} value={service.name}>
                      {service.name} ({service.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  💾 Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveStaff;