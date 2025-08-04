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
        <div className="stat-card">
          <h3>Activities</h3>
          <div className="number">{stats.totalActivities}</div>
        </div>
        <div className="stat-card">
          <h3>Pending Timesheets</h3>
          <div className="number">{stats.pendingTimesheets}</div>
        </div>
      </div>

      <div className="admin-section">
        <h2>Recent Timesheet Submissions</h2>
        {recentTimesheets.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Week Ending</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {recentTimesheets.map((timesheet) => (
                <tr key={timesheet.id}>
                  <td>{timesheet.employeeName}</td>
                  <td>{timesheet.weekEnding}</td>
                  <td>{timesheet.hours}</td>
                  <td>
                    <span className={`status-badge status-${timesheet.status}`}>
                      {timesheet.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{timesheet.submittedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No pending timesheets.</p>
        )}
      </div>

      <div className="admin-section">
        <h2>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href="/admin/employees" className="btn btn-primary">Add Employee</a>
          <a href="/admin/projects" className="btn btn-primary">Add Project</a>
          <a href="/admin/activities" className="btn btn-primary">Add Activity</a>
          <a href="/admin/timesheets" className="btn btn-warning">Review Timesheets</a>
        </div>
      </div>
    </div>
  );
}