import React, { useState, useEffect } from 'react';
import { fetchExceptionReport } from '../api';

const Reports = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exportMessage, setExportMessage] = useState('');

  const loadReport = async (date) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchExceptionReport(date);
      setReportData(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired or invalid token. Please log in again.');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch report data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(selectedDate);
  }, [selectedDate]);

  const handleExportCSV = async () => {
    setExportMessage('');
    
    // Dynamically retrieve current token without expired static string fallback
    const token = localStorage.getItem('token');

    if (!token) {
      setExportMessage('Session expired or no token found. Please log in again.');
      return;
    }

    const url = `http://localhost:5000/api/v1/reports/export/csv?startDate=${selectedDate}&endDate=${selectedDate}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('Session expired or invalid token');
        }
        throw new Error(errData.error || 'Failed to export CSV');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `beerenberg_payroll_${selectedDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setExportMessage('CSV report exported successfully!');
    } catch (err) {
      setExportMessage(`Export error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      {/* High-visibility header */}
      <h2 style={{ color: '#111827', fontSize: '22px', fontWeight: 'bold', marginBottom: '20px' }}>
        Daily Exception & Compliance Dashboard
      </h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <div>
          <label style={{ fontWeight: 'bold', marginRight: '10px', color: '#374151' }}>
            Select Report Date: 
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '14px', borderRadius: '4px', border: '1px solid #d1d5db' }}
          />
        </div>

        <button
          onClick={handleExportCSV}
          style={{
            backgroundColor: '#15803d',
            color: '#ffffff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📥 Export Payroll CSV
        </button>
      </div>

      {exportMessage && (
        <p style={{ color: exportMessage.includes('successfully') ? '#15803d' : '#dc2626', fontWeight: 'bold' }}>
          {exportMessage}
        </p>
      )}

      {loading && <p style={{ color: '#4b5563' }}>Loading exception report...</p>}
      {error && <p style={{ color: '#dc2626', fontWeight: 'bold' }}>{error}</p>}

      {reportData && !loading && (
        <div>
          {/* Summary Metric Cards */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
            <div style={{ flex: 1, padding: '15px', background: '#f8f9fa', borderLeft: '5px solid #dc3545', borderRadius: '4px' }}>
              <h4 style={{ margin: 0, color: '#4b5563' }}>Missing Clock-Outs</h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#111827' }}>
                {reportData.summary?.totalMissingClockOuts ?? 0}
              </p>
            </div>

            <div style={{ flex: 1, padding: '15px', background: '#f8f9fa', borderLeft: '5px solid #ffc107', borderRadius: '4px' }}>
              <h4 style={{ margin: 0, color: '#4b5563' }}>Unrostered Clock-Ins</h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#111827' }}>
                {reportData.summary?.totalUnrosteredClockIns ?? 0}
              </p>
            </div>

            <div style={{ flex: 1, padding: '15px', background: '#f8f9fa', borderLeft: '5px solid #17a2b8', borderRadius: '4px' }}>
              <h4 style={{ margin: 0, color: '#4b5563' }}>Break Violations (5h+)</h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#111827' }}>
                {reportData.summary?.totalBreakViolations ?? 0}
              </p>
            </div>
          </div>

          {/* Itemized Exception Tables */}
          <h3 style={{ color: '#1f2937', marginBottom: '15px' }}>
            Detailed Exceptions ({reportData.summary?.totalExceptions ?? 0})
          </h3>
          {reportData.summary?.totalExceptions === 0 ? (
            <p style={{ color: '#16a34a', fontWeight: '500' }}>
              No exceptions recorded for {reportData.reportDate}.
            </p>
          ) : (
            <div>
              {/* Missing Clock-Outs */}
              {reportData.exceptions?.missingClockOuts?.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#374151' }}>Missing Clock-Outs</h4>
                  <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', borderColor: '#e5e7eb' }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6', color: '#1f2937' }}>
                        <th>Employee Code</th>
                        <th>Name</th>
                        <th>Clock In Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.exceptions.missingClockOuts.map((item, index) => (
                        <tr key={index} style={{ color: '#374151' }}>
                          <td>{item.employee_code}</td>
                          <td>{item.first_name} {item.last_name}</td>
                          <td>{new Date(item.clock_in_time).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Unrostered Clock-Ins */}
              {reportData.exceptions?.unrosteredClockIns?.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#374151' }}>Unrostered Clock-Ins</h4>
                  <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', borderColor: '#e5e7eb' }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6', color: '#1f2937' }}>
                        <th>Employee Code</th>
                        <th>Name</th>
                        <th>Clock In Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.exceptions.unrosteredClockIns.map((item, index) => (
                        <tr key={index} style={{ color: '#374151' }}>
                          <td>{item.employee_code}</td>
                          <td>{item.first_name} {item.last_name}</td>
                          <td>{new Date(item.clock_in_time).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Break Violations */}
              {reportData.exceptions?.breakViolations?.length > 0 && (
                <div>
                  <h4 style={{ color: '#374151' }}>Break Violations (Worked 5+ Hours Without Break)</h4>
                  <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', borderColor: '#e5e7eb' }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6', color: '#1f2937' }}>
                        <th>Employee Code</th>
                        <th>Name</th>
                        <th>Shift Start</th>
                        <th>Shift End</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.exceptions.breakViolations.map((item, index) => (
                        <tr key={index} style={{ color: '#374151' }}>
                          <td>{item.employee_code}</td>
                          <td>{item.first_name} {item.last_name}</td>
                          <td>{new Date(item.shift_start).toLocaleString()}</td>
                          <td>{item.shift_end ? new Date(item.shift_end).toLocaleString() : 'Active'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;