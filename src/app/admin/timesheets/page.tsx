"use client";

import { useState } from 'react';
import { timesheets, updateTimesheetStatus } from '../../data/hardcodedData';

export default function AdminTimesheets() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Function to format date to British format (dd/mm/yyyy)
  const formatToBritishDate = (dateString: string | number | Date): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return String(dateString); // Return original as string if parsing fails
    }
  };

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

      <div className="actions">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by employee name..."
            className="search-box"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Week Starting</th>
            <th>Total Hours</th>
            <th>Submitted Date</th>
          </tr>
        </thead>
        <tbody>
          {filteredTimesheets.map((timesheet) => (
            <tr key={timesheet.id}>
              <td>{timesheet.employeeName}</td>
              <td>{formatToBritishDate(timesheet.weekEnding)}</td>
              <td>{timesheet.hours} hrs</td>

              <td>{formatToBritishDate(timesheet.submittedDate)}</td>
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