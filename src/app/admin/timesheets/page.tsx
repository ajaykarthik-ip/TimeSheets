"use client";

import { useState } from 'react';
import { timesheets, updateTimesheetStatus } from '../../data/hardcodedData';

export default function AdminTimesheets() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredTimesheets = timesheets.filter(timesheet => {
    const matchesSearch = timesheet.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || timesheet.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (id: number) => {
    if (confirm('Are you sure you want to approve this timesheet?')) {
      updateTimesheetStatus(id, 'approved');
    }
  };

  const handleReject = (id: number) => {
    if (confirm('Are you sure you want to reject this timesheet?')) {
      updateTimesheetStatus(id, 'rejected');
    }
  };

  const getStatusCounts = () => {
    return {
      pending: timesheets.filter(t => t.status === 'pending').length,
      approved: timesheets.filter(t => t.status === 'approved').length,
      rejected: timesheets.filter(t => t.status === 'rejected').length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div>
      <div className="admin-header">
        <h1>Timesheet Management</h1>
        <p>Review and approve employee timesheets</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <h3>Pending</h3>
          <div className="number">{statusCounts.pending}</div>
        </div>
        <div className="stat-card">
          <h3>Approved</h3>
          <div className="number">{statusCounts.approved}</div>
        </div>
        <div className="stat-card">
          <h3>Rejected</h3>
          <div className="number">{statusCounts.rejected}</div>
        </div>
      </div>

      <div className="actions">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by employee name..."
            className="search-box"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '3px' }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Week Ending</th>
            <th>Total Hours</th>
            <th>Status</th>
            <th>Submitted Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTimesheets.map((timesheet) => (
            <tr key={timesheet.id}>
              <td>{timesheet.employeeName}</td>
              <td>{timesheet.weekEnding}</td>
              <td>{timesheet.hours} hrs</td>
              <td>
                <span className={`status-badge status-${timesheet.status}`}>
                  {timesheet.status.toUpperCase()}
                </span>
              </td>
              <td>{timesheet.submittedDate}</td>
              <td>
                {timesheet.status === 'pending' && (
                  <>
                    <button 
                      className="btn btn-success"
                      onClick={() => handleApprove(timesheet.id)}
                    >
                      Approve
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleReject(timesheet.id)}
                    >
                      Reject
                    </button>
                  </>
                )}
                {timesheet.status !== 'pending' && (
                  <span style={{ color: '#999', fontSize: '12px' }}>
                    {timesheet.status === 'approved' ? 'Already Approved' : 'Already Rejected'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredTimesheets.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          No timesheets found matching your search criteria.
        </div>
      )}
    </div>
  );
}