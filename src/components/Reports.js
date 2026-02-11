import React, { useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Reports.css';

const Reports = () => {
  const [reportType, setReportType] = useState('weekly');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const generatePDF = (reportData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(102, 126, 234);
    doc.text('Salon Booking System', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(`${reportData.period} Report`, pageWidth / 2, 25, { align: 'center' });
    
    // Report Period
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const startDate = new Date(reportData.startDate).toLocaleDateString();
    const endDate = new Date(reportData.endDate).toLocaleDateString();
    doc.text(`Period: ${startDate} to ${endDate}`, pageWidth / 2, 32, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 37, { align: 'center' });
    
    let yPos = 45;

    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(102, 126, 234);
    doc.text('Summary', 14, yPos);
    yPos += 7;

    const summaryData = [
      ['Total Appointments', reportData.summary.totalAppointments],
      ['Completed', reportData.summary.completedAppointments],
      ['Cancelled', reportData.summary.cancelledAppointments],
      ['Total Revenue', `Rs.${reportData.summary.totalRevenue.toFixed(2)}`],
      ['Pending Payments', `Rs.${reportData.summary.pendingPayments.toFixed(2)}`],
      ['Cash Payments', reportData.summary.cashPayments],
      ['Online Payments', reportData.summary.onlinePayments]
    ];

    doc.autoTable({
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [102, 126, 234] },
      margin: { left: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Service Breakdown
    if (reportData.serviceBreakdown && Object.keys(reportData.serviceBreakdown).length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(102, 126, 234);
      doc.text('Service Breakdown', 14, yPos);
      yPos += 7;

      const serviceData = Object.entries(reportData.serviceBreakdown).map(([service, data]) => [
        service,
        data.count,
        `Rs.${data.revenue.toFixed(2)}`
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['Service', 'Bookings', 'Revenue']],
        body: serviceData,
        theme: 'striped',
        headStyles: { fillColor: [102, 126, 234] },
        margin: { left: 14 }
      });

      yPos = doc.lastAutoTable.finalY + 10;
    }

    // Staff Performance (if available)
    if (reportData.staffPerformance && Object.keys(reportData.staffPerformance).length > 0) {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(102, 126, 234);
      doc.text('Staff Performance', 14, yPos);
      yPos += 7;

      const staffData = Object.entries(reportData.staffPerformance).map(([staff, data]) => [
        staff,
        data.appointments,
        data.completed,
        `Rs.${data.revenue.toFixed(2)}`
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['Staff Member', 'Total', 'Completed', 'Revenue']],
        body: staffData,
        theme: 'striped',
        headStyles: { fillColor: [102, 126, 234] },
        margin: { left: 14 }
      });

      yPos = doc.lastAutoTable.finalY + 10;
    }

    // Appointments List
    if (reportData.appointments && reportData.appointments.length > 0) {
      // Add new page for appointments
      doc.addPage();
      yPos = 20;

      doc.setFontSize(14);
      doc.setTextColor(102, 126, 234);
      doc.text('Detailed Appointments', 14, yPos);
      yPos += 7;

      const appointmentData = reportData.appointments.map(apt => [
        new Date(apt.appointmentDate).toLocaleDateString(),
        apt.customer?.name || 'N/A',
        apt.service?.name || 'N/A',
        apt.staff?.name || 'N/A',
        apt.status,
        apt.paymentStatus,
        `Rs.${apt.amount || 0}`
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['Date', 'Customer', 'Service', 'Staff', 'Status', 'Payment', 'Amount']],
        body: appointmentData,
        theme: 'grid',
        headStyles: { fillColor: [102, 126, 234], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 }
        }
      });
    }

    // Footer on last page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    const filename = `salon-report-${reportData.period.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');

    try {
      let endpoint = '';
      
      if (reportType === 'weekly') {
        //endpoint = 'http://localhost:5000/api/reports/weekly';
        endpoint='https://appointment-backend-cune.vercel.app/api/reports/weekly';
      } else if (reportType === 'monthly') {
        //endpoint = 'http://localhost:5000/api/reports/monthly';
        endpoint='https://appointment-backend-cune.vercel.app/api/reports/weekly';
      } else if (reportType === 'custom') {
        if (!customStartDate || !customEndDate) {
          setError('Please select both start and end dates for custom report');
          setLoading(false);
          return;
        }
        //endpoint = `http://localhost:5000/api/reports/custom?startDate=${customStartDate}&endDate=${customEndDate}`;
        endpoint = `https://appointment-backend-cune.vercel.app/api/reports/custom?startDate=${customStartDate}&endDate=${customEndDate}`;
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      generatePDF(response.data);
      
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>📊 Reports & Analytics</h1>
        <p>Download comprehensive business reports</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="reports-card">
        <h2>Select Report Type</h2>
        
        <div className="report-options">
          <div 
            className={`report-option ${reportType === 'weekly' ? 'selected' : ''}`}
            onClick={() => setReportType('weekly')}
          >
            <input
              type="radio"
              name="reportType"
              value="weekly"
              checked={reportType === 'weekly'}
              onChange={() => setReportType('weekly')}
            />
            <div className="option-content">
              <span className="option-icon">📅</span>
              <div>
                <strong>Weekly Report</strong>
                <p>Last 7 days performance</p>
              </div>
            </div>
          </div>

          <div 
            className={`report-option ${reportType === 'monthly' ? 'selected' : ''}`}
            onClick={() => setReportType('monthly')}
          >
            <input
              type="radio"
              name="reportType"
              value="monthly"
              checked={reportType === 'monthly'}
              onChange={() => setReportType('monthly')}
            />
            <div className="option-content">
              <span className="option-icon">📆</span>
              <div>
                <strong>Monthly Report</strong>
                <p>Last 30 days performance</p>
              </div>
            </div>
          </div>

          <div 
            className={`report-option ${reportType === 'custom' ? 'selected' : ''}`}
            onClick={() => setReportType('custom')}
          >
            <input
              type="radio"
              name="reportType"
              value="custom"
              checked={reportType === 'custom'}
              onChange={() => setReportType('custom')}
            />
            <div className="option-content">
              <span className="option-icon">🗓️</span>
              <div>
                <strong>Custom Range</strong>
                <p>Select your own date range</p>
              </div>
            </div>
          </div>
        </div>

        {reportType === 'custom' && (
          <div className="custom-date-range">
            <div className="date-input-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="date-input-group">
              <label>End Date:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        )}

        <div className="report-features">
          <h3>Report Includes:</h3>
          <ul>
            <li>✅ Total appointments and revenue</li>
            <li>✅ Payment status breakdown</li>
            <li>✅ Service performance analysis</li>
            {reportType === 'monthly' && <li>✅ Staff performance metrics</li>}
            <li>✅ Detailed appointment list</li>
            <li>✅ Professional PDF format</li>
          </ul>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={loading}
          className="generate-button"
        >
          {loading ? '⏳ Generating...' : '📥 Download PDF Report'}
        </button>
      </div>

      <div className="report-info">
        <div className="info-card">
          <span className="info-icon">📄</span>
          <div>
            <strong>Professional Format</strong>
            <p>Well-organized PDF with tables and charts</p>
          </div>
        </div>
        <div className="info-card">
          <span className="info-icon">💼</span>
          <div>
            <strong>Business Insights</strong>
            <p>Revenue, bookings, and performance metrics</p>
          </div>
        </div>
        <div className="info-card">
          <span className="info-icon">📊</span>
          <div>
            <strong>Detailed Analytics</strong>
            <p>Service breakdown and staff performance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
