"use client";

import React from 'react';
import { useTimesheetLogic } from './useTimesheetLogic';
import './page.css';

export default function SimplifiedTimesheet() {
  const {
    // State
    currentUser,
    projects,
    activities,
    loading,
    error,
    rows,
    isSubmitting,
    billableHours,
    nonBillableHours,
    totalHours,
    overtimeHours,
    isAdmin,
    hasUnsavedChanges,
    weekDates,
    dayNames,
    
    // Functions
    setError,
    updateRow,
    isDateEditable,
    canEditHours,
    updateHour,
    addRow,
    removeRow,
    submitTimesheet,
    navigateWeek,
    formatWeekRange
  } = useTimesheetLogic();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Loading timesheet data...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Please log in to access your timesheet</h2>
        <button 
          className="add-btn" 
          onClick={() => window.location.href = '/login'}
          style={{ marginTop: '20px' }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="timesheet-container" style={{ display: 'flex', minHeight: '100vh' }}>
      {error && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          background: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '5px',
          maxWidth: '300px',
          zIndex: 1000
        }}>
          {error}
        </div>
      )}

      {/* Left Sidebar - Employee Info */}
      <div className="employee-info" style={{
        width: '250px',
        borderRight: '1px solid #ddd'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Employee Info</h2>
        
        <div className="info-grid">
          <div>
            <label>Name</label>
            <span>{currentUser.employee_name}</span>
          </div>
          
          <div>
            <label>Employee ID</label>
            <span>{currentUser.employee_id}</span>
          </div>
          
          <div>
            <label>Business Unit</label>
            <span>{currentUser.department}</span>
          </div>
          
          <div>
            <label>Role</label>
            <span>
              {currentUser.role}
              {isAdmin && (
                <span style={{ 
                  marginLeft: '8px',
                  background: '#667eea',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  ADMIN
                </span>
              )}
            </span>
          </div>
          
          <div>
            <label>Week</label>
            <span>{formatWeekRange()}</span>
          </div>
        </div>

        {/* Admin Panel Button - Only show for admin users */}
        {isAdmin && (
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => window.location.href = '/admin'}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 15px',
                borderRadius: '5px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              🔧 Admin Panel
            </button>
          </div>
        )}

        {/* Week Navigation */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => navigateWeek(-1)} 
            className="add-btn"
            style={{ 
              fontSize: '12px', 
              padding: '8px 12px',
              background: '#999'
            }}
          >
            ← Prev
          </button>
          <button 
            onClick={() => navigateWeek(1)} 
            className="add-btn"
            style={{ 
              fontSize: '12px', 
              padding: '8px 12px',
              background: '#999'
            }}
          >
            Next →
          </button>
        </div>

        {/* Quick Summary in Sidebar */}
        <div style={{ marginTop: '30px', padding: '15px', background: 'white', borderRadius: '5px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '14px' }}>Week Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Hours:</span>
              <strong>{totalHours.toFixed(1)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Billable:</span>
              <span>{billableHours.toFixed(1)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Non-Billable:</span>
              <span>{nonBillableHours.toFixed(1)}</span>
            </div>
            {overtimeHours > 0 && (
              <div className="summary-item overtime">
                <label>Overtime:</label>
                <span>{overtimeHours.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '20px', background: 'white' }}>
        <div className="timesheet-header">
          <h1>Weekly Timesheet</h1>
        </div>

        <div className="table-container">
          <table className="timesheet-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Activity Type</th>
                <th>Billable</th>
                {weekDates.map((date, index) => {
                  const isEditable = isDateEditable(date);
                  const isFutureDate = !isEditable;
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6; // Sunday = 0, Saturday = 6
                  
                  return (
                    <th key={index} className={`day-header ${isWeekend ? 'weekend' : ''}`}>
                      {dayNames[index]}<br/>
                      <span className="date">
                        {date.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                        {isFutureDate && <span className="holiday-label"></span>}
                      </span>
                    </th>
                  );
                })}
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} style={{ 
                  backgroundColor: row.hasUnsavedChanges ? '#fff3cd' : 'transparent' 
                }}>
                  <td className="project-name">
                    <select
                      value={row.projectName}
                      onChange={(e) => updateRow(row.id, 'projectName', e.target.value)}
                      disabled={row.isExistingTimesheet} // Only disable for existing timesheets
                    >
                      <option value="">Select Project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.name}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={row.activity}
                      onChange={(e) => updateRow(row.id, 'activity', e.target.value)}
                      disabled={row.isExistingTimesheet} // Only disable for existing timesheets
                    >
                      <option value="">Select Activity</option>
                      {row.projectId && activities[row.projectId] ? 
                        activities[row.projectId].map((activity) => (
                          <option key={activity} value={activity}>
                            {activity}
                          </option>
                        )) : null
                      }
                    </select>
                  </td>
                  <td>
                    <span className={`billable-status ${row.billable ? 'billable' : 'non-billable'}`}>
                      {row.billable ? 'Yes' : 'No'}
                    </span>
                  </td>
                  {row.hours.map((hour, index) => {
                    const canEdit = canEditHours(row, index);
                    const isWeekend = weekDates[index].getDay() === 0 || weekDates[index].getDay() === 6;
                    
                    return (
                      <td key={index} className={isWeekend ? 'weekend-cell' : ''}>
                        <input
                          type="number"
                          min="0"
                          max="24"
                          step="0.25"
                          value={hour || ''}
                          onChange={(e) => updateHour(row.id, index, parseFloat(e.target.value) || 0)}
                          className="hour-input"
                          disabled={!canEdit}
                          title={
                            !canEdit ? 
                              (row.timesheetIds[index] !== null ? 'Cannot edit existing timesheet entries' : 'Cannot edit future dates') 
                              : ''
                          }
                        />
                      </td>
                    );
                  })}
                  <td className="total-cell">{row.total.toFixed(1)}</td>
                  <td>
                    <button 
                      onClick={() => removeRow(row.id)}
                      className="remove-btn"
                      disabled={rows.length <= 1} // Only disable if it's the last row
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="action-buttons">
          <button 
            onClick={addRow} 
            className="add-btn" 
            // No restrictions on adding rows
          >
            + 
          </button>
          
          {/* Submit Button */}
          <button 
            onClick={submitTimesheet} 
            className="add-btn"
            disabled={!hasUnsavedChanges || isSubmitting}
            style={{ 
              marginLeft: '10px',
              background: hasUnsavedChanges ? '#28a745' : '#6c757d',
              opacity: hasUnsavedChanges && !isSubmitting ? 1 : 0.6,
              cursor: hasUnsavedChanges && !isSubmitting ? 'pointer' : 'not-allowed'
            }}
          >
            {isSubmitting ? 'Saving...' : hasUnsavedChanges ? 'Submit Timesheet' : 'No Changes'}
          </button>
        </div>

        {hasUnsavedChanges && (
          <div style={{
            background: '#fff3cd',
            color: '#856404',
            padding: '10px',
            borderRadius: '3px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            ⚠️ You have unsaved changes. Click "Submit Timesheet" to save your work.
          </div>
        )}

        <div className="summary-section">
          <div className="summary-grid">
            <div className="summary-item">
              <label>Billable Hours:</label>
              <span>{billableHours.toFixed(1)}</span>
            </div>
            <div className="summary-item">
              <label>Non-Billable Hours:</label>
              <span>{nonBillableHours.toFixed(1)}</span>
            </div>
            <div className="summary-item total">
              <label>Total Hours:</label>
              <span>{totalHours.toFixed(1)} / 40</span>
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}