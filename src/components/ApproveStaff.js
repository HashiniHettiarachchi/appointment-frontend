import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./ApproveStaff.css";

const ApproveStaff = () => {
  const [pendingStaff, setPendingStaff] = useState([]);
  const [approvedStaff, setApprovedStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedSpecializations, setSelectedSpecializations] = useState({});

  const token = localStorage.getItem("token");

  const fetchPendingStaff = useCallback(async () => {
    try {
      const response = await axios.get(
        "https://appointment-backend-wpie.vercel.app/api/users/staff/pending",
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
        "https://appointment-backend-wpie.vercel.app/api/users/staff",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApprovedStaff(response.data);
    } catch (err) {
      console.error("Error fetching approved staff:", err);
    }
  }, [token]);

  const fetchServices = useCallback(async () => {
    try {
      const response = await axios.get(
        "https://appointment-backend-wpie.vercel.app/api/services"
      );
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
        `https://appointment-backend-wpie.vercel.app/api/users/staff/${staffId}/approve`,
        { specialization },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`✅ ${staffName} has been approved as ${specialization} staff!`);
      setTimeout(() => setSuccess(""), 3000);

      fetchPendingStaff();
      fetchApprovedStaff();

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
        `https://appointment-backend-wpie.vercel.app/api/users/staff/${staffId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`${staffName} has been rejected`);
      setTimeout(() => setSuccess(""), 3000);

      fetchPendingStaff();
    } catch (err) {
      console.error("Error rejecting staff:", err);
      setError("Failed to reject staff");
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
        <h1>👥 Staff Approval Management</h1>
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
                  <th>Specialization</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {approvedStaff.map((staff) => (
                  <tr key={staff._id}>
                    <td>
                      <strong>{staff.name}</strong>
                    </td>
                    <td>{staff.email}</td>
                    <td>
                      <span className="specialization-badge">
                        {staff.specialization || "Not Set"}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge status-active">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApproveStaff;