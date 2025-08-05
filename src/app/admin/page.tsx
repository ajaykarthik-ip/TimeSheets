"use client";

import { useState, useEffect } from 'react';

// Types
interface DashboardStats {
  totalEmployees: number;
  totalProjects: number;
  pendingTimesheets: number;
  totalHoursThisWeek: number;
}

interface RecentTimesheet {
  id: number;
  employee_name: string;
  project_name: string;
  date: string;
  hours_worked: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalProjects: 0,
    pendingTimesheets: 0,
    totalHoursThisWeek: 0
  });
  const [recentTimesheets, setRecentTimesheets] = useState<RecentTimesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // API Base URL
  const API_BASE = 'http://localhost:8000/api';

  // Function to format date to British format (dd/mm/yyyy)
  const formatToBritishDate = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch employees count
      const employeesResponse = await fetch(`${API_BASE}/employees/`, {
        credentials: 'include'
      });
      const employeesData = await employeesResponse.json();
      const activeEmployees = employeesData.employees?.filter((emp: any) => emp.is_active) || [];

      // Fetch projects count
      const projectsResponse = await fetch(`${API_BASE}/projects/active/`, {
        credentials: 'include'
      });
      const projectsData = await projectsResponse.json();

      // Fetch recent timesheets (current week)
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      
      const timesheetsResponse = await fetch(
        `${API_BASE}/timesheets/?date_from=${startOfWeek.toISOString().split('T')[0]}&date_to=${endOfWeek.toISOString().split('T')[0]}&page_size=10`,
        {
          credentials: 'include'
        }
      );
      const timesheetsData = await timesheetsResponse.json();

      // Calculate total hours for the week
      const totalHours = timesheetsData.timesheets?.reduce((sum: number, ts: any) => {
        return sum + parseFloat(ts.hours_worked || 0);
      }, 0) || 0;

      // Set stats
      setStats({
        totalEmployees: activeEmployees.length,
        totalProjects: projectsData.projects?.length || 0,
        pendingTimesheets: timesheetsData.count || 0,
        totalHoursThisWeek: Math.round(totalHours * 100) / 100
      });

      // Set recent timesheets (limit to 5 most recent)
      setRecentTimesheets(timesheetsData.timesheets?.slice(0, 5) || []);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome to the admin panel. Manage employees, projects, and timesheets.</p>
      </div>

      {error && (
        <div style={{ 
          background: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '5px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Active Employees</h3>
          <div className="number">{stats.totalEmployees}</div>
        </div>
        <div className="stat-card">
          <h3>Active Projects</h3>
          <div className="number">{stats.totalProjects}</div>
        </div>
        <div className="stat-card">
          <h3>Timesheet Entries This Week</h3>
          <div className="number">{stats.pendingTimesheets}</div>
        </div>
        <div className="stat-card">
          <h3>Total Hours This Week</h3>
          <div className="number">{stats.totalHoursThisWeek}</div>
        </div>
      </div>

      <div className="admin-section">
        <h2>Recent Timesheet Entries</h2>
        {recentTimesheets.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Project</th>
                <th>Date</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {recentTimesheets.map((timesheet) => (
                <tr key={timesheet.id}>
                  <td>{timesheet.employee_name}</td>
                  <td>{timesheet.project_name}</td>
                  <td>{formatToBritishDate(timesheet.date)}</td>
                  <td>{timesheet.hours_worked} hrs</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No recent timesheet entries.</p>
        )}
      </div>

    </div>
  );
}