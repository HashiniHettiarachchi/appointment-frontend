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

  // ✅ Wrap fetch functions in useCallback
  const fetchPendingStaff = useCallback(async () => {
    try {
      const response = await axios.get(
        //"http://localhost:5000/api/users/staff/pending",
        "https://appointment-backend-cune.vercel.app/api/users/staff/pending",
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
        //"http://localhost:5000/api/users/staff",
        "https://appointment-backend-cune.vercel.app/api/users/staff",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApprovedStaff(response.data);
    } catch (err) {
      console.error("Error fetching approved staff:", err);
    }
  }, [token]);

  const fetchServices = useCallback(async () => {
    try {
      //const response = await axios.get("http://localhost:5000/api/services");
      const response = await axios.get("https://appointment-backend-cune.vercel.app/api/users/staff");
      setServices(response.data);
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ useEffect with proper dependencies
  useEffect(() => {
    fetchPendingStaff();
    fetchApprovedStaff();
    fetchServices();
  }, [fetchPendingStaff, fetchApprovedStaff, fetchServices]);

  // Handle dropdown selection
  const handleSelectSpecialization = (staffId, specialization) => {
    setSelectedSpecializations({
      ...selectedSpecializations,
      [staffId]: specialization,
    });
  };

  // Handle approve button click
  const handleApprove = async (staffId, staffName) => {
    const specialization = selectedSpecializations[staffId];

    if (!specialization) {
      alert("Please select a service category first!");
      return;
    }

    try {
      await axios.put(
        //`http://localhost:5000/api/users/staff/${staffId}/approve`,
        `https://appointment-backend-cune.vercel.app/api/users/staff/${staffId}/approve`,
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

  // Handle reject button click
  const handleReject = async (staffId, staffName) => {
    if (!window.confirm(`Are you sure you want to reject ${staffName}?`)) {
      return;
    }

    try {
      await axios.put(
      //`http://localhost:5000/api/users/staff/${staffId}/reject`,
      `https://appointment-backend-cune.vercel.app/api/users/staff/${staffId}/reject`,
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
      {/* Your JSX for pending and approved staff */}
      {/* ... rest of your original JSX */}
    </div>
  );
};

export default ApproveStaff;
