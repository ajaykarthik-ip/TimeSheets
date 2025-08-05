"use client";

import { employees, projects, activities, timesheets } from '../data/hardcodedData';

export default function AdminDashboard() {
  const stats = {
    totalEmployees: employees.filter(e => e.status === 'active').length,
    totalProjects: projects.filter(p => p.status === 'active').length,
    totalActivities: activities.filter(a => a.status === 'active').length,
    pendingTimesheets: timesheets.filter(t => t.status === 'pending').length,
  };

  const recentTimesheets = timesheets
    .filter(t => t.status === 'pending')
    .slice(0, 5);

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

  return (
    <div>
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome to the admin panel. Manage employees, projects, and timesheets.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Employees</h3>
          <div className="number">{stats.totalEmployees}</div>
        </div>
        <div className="stat-card">
          <h3>Active Projects</h3>
          <div className="number">{stats.totalProjects}</div>
        </div>

      </div>

      <div className="admin-section">
        <h2>Recent Timesheet Submissions</h2>
        {recentTimesheets.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Week Starting</th>
                <th>Hours</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {recentTimesheets.map((timesheet) => (
                <tr key={timesheet.id}>
                  <td>{timesheet.employeeName}</td>
                  <td>{formatToBritishDate(timesheet.weekEnding)}</td>
                  <td>{timesheet.hours}</td>

                  <td>{formatToBritishDate(timesheet.submittedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No pending timesheets.</p>
        )}
      </div>

    </div>
  );
}