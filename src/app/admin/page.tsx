"use client";

import { useState, useEffect } from 'react';

// Types
interface Project {
  id: number;
  name: string;
}

interface Employee {
  employee_id: string;
  full_name: string;
}

interface TimesheetData {
  employee_id: string;
  employee_name: string;
  activity_type: string;
  total_hours: number;
}

interface ProjectTimesheetSummary {
  employees: { [key: string]: string }; // employee_id -> employee_name
  activities: string[];
  data: { [employeeId: string]: { [activity: string]: number } };
  totals: {
    byEmployee: { [employeeId: string]: number };
    byActivity: { [activity: string]: number };
    grandTotal: number;
  };
}

export default function AdminTimesheets() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projectData, setProjectData] = useState<ProjectTimesheetSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // API Base URL
  const API_BASE = 'http://localhost:8000/api';

  // Set default date range (current month)
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setDateFrom(firstDay.toISOString().split('T')[0]);
    setDateTo(lastDay.toISOString().split('T')[0]);
  }, []);

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

  // Fetch projects for dropdown
  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE}/projects/active/`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError('Failed to load projects');
    }
  };

  // Fetch timesheet data for selected project
  const fetchProjectTimesheets = async () => {
    if (!selectedProject || !dateFrom || !dateTo) return;

    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        project_id: selectedProject,
        date_from: dateFrom,
        date_to: dateTo,
        page_size: '1000' // Get all entries for summary
      });

      const response = await fetch(`${API_BASE}/timesheets/admin/all/?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch timesheets');
      
      const data = await response.json();
      const timesheets = data.timesheets || [];

      // Process data into summary format
      const summary = processTimesheetData(timesheets);
      setProjectData(summary);

    } catch (err) {
      setError('Failed to load project timesheets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Process raw timesheet data into summary format
  const processTimesheetData = (timesheets: any[]): ProjectTimesheetSummary => {
    const employees: { [key: string]: string } = {};
    const activities: Set<string> = new Set();
    const data: { [employeeId: string]: { [activity: string]: number } } = {};

    // First pass: collect all employees and activities
    timesheets.forEach(ts => {
      employees[ts.employee_id] = ts.employee_name;
      activities.add(ts.activity_type);
      
      if (!data[ts.employee_id]) {
        data[ts.employee_id] = {};
      }
      if (!data[ts.employee_id][ts.activity_type]) {
        data[ts.employee_id][ts.activity_type] = 0;
      }
      data[ts.employee_id][ts.activity_type] += parseFloat(ts.hours_worked || '0');
    });

    // Calculate totals
    const totals = {
      byEmployee: {} as { [employeeId: string]: number },
      byActivity: {} as { [activity: string]: number },
      grandTotal: 0
    };

    // Calculate employee totals
    Object.keys(data).forEach(employeeId => {
      totals.byEmployee[employeeId] = Object.values(data[employeeId]).reduce((sum, hours) => sum + hours, 0);
    });

    // Calculate activity totals
    Array.from(activities).forEach(activity => {
      totals.byActivity[activity] = Object.keys(data).reduce((sum, employeeId) => {
        return sum + (data[employeeId][activity] || 0);
      }, 0);
    });

    // Calculate grand total
    totals.grandTotal = Object.values(totals.byEmployee).reduce((sum, total) => sum + total, 0);

    return {
      employees,
      activities: Array.from(activities).sort(),
      data,
      totals
    };
  };

  // Load projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch project data when project, date range changes
  useEffect(() => {
    if (selectedProject && dateFrom && dateTo) {
      fetchProjectTimesheets();
    } else {
      setProjectData(null);
    }
  }, [selectedProject, dateFrom, dateTo]);

  // Get selected project name
  const getSelectedProjectName = () => {
    const project = projects.find(p => p.id.toString() === selectedProject);
    return project ? project.name : '';
  };

  return (
    <div>
      <div className="admin-header">
        <h1>Summary</h1>
        <p>View timesheet data organized by project and activity</p>
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

      {/* Filters */}
      <div style={{ 
        background: '#f9f9f9', 
        padding: '20px', 
        borderRadius: '5px', 
        marginBottom: '20px' 
      }}>
        <h3 style={{ marginTop: 0 }}>Select Project and Date Range</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Project:</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{ fontSize: '16px', padding: '10px' }}
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date From:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Date To:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div style={{ 
          fontSize: '14px', 
          color: '#666', 
          marginTop: '10px',
          fontStyle: 'italic'
        }}>
          Date Range: {formatToBritishDate(dateFrom)} - {formatToBritishDate(dateTo)}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>Loading project timesheet data...</div>
        </div>
      )}

      {/* Project summary table */}
      {!loading && projectData && selectedProject && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ 
              color: '#333', 
              borderBottom: '2px solid #ddd', 
              paddingBottom: '10px',
              marginBottom: '20px'
            }}>
              {getSelectedProjectName()}
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ minWidth: '800px' }}>
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}>Employee Name</th>
                  {projectData.activities.map((activity) => (
                    <th key={activity} style={{ backgroundColor: '#f8f9fa' }}>{activity}</th>
                  ))}
                  <th style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(projectData.employees).map(([employeeId, employeeName]) => (
                  <tr key={employeeId}>
                    <td style={{ fontWeight: 'bold' }}>{employeeName}</td>
                    {projectData.activities.map((activity) => (
                      <td key={activity} style={{ textAlign: 'center' }}>
                        {projectData.data[employeeId]?.[activity] 
                          ? Math.round(projectData.data[employeeId][activity] * 100) / 100
                          : 0}
                      </td>
                    ))}
                    <td style={{ fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                      {Math.round(projectData.totals.byEmployee[employeeId] * 100) / 100}
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}>
                  <td style={{ fontWeight: 'bold' }}>Total</td>
                  {projectData.activities.map((activity) => (
                    <td key={activity} style={{ textAlign: 'center', fontWeight: 'bold' }}>
                      {Math.round(projectData.totals.byActivity[activity] * 100) / 100}
                    </td>
                  ))}
                  <td style={{ 
                    textAlign: 'center', 
                    fontWeight: 'bold', 
                    backgroundColor: '#dee2e6',
                    fontSize: '16px'
                  }}>
                    {Math.round(projectData.totals.grandTotal * 100) / 100}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary stats */}
          <div className="stats-grid" style={{ marginTop: '30px' }}>
            <div className="stat-card">
              <h3>Total Employees</h3>
              <div className="number">{Object.keys(projectData.employees).length}</div>
            </div>
            <div className="stat-card">
              <h3>Total Activities</h3>
              <div className="number">{projectData.activities.length}</div>
            </div>
            <div className="stat-card">
              <h3>Total Hours</h3>
              <div className="number">{Math.round(projectData.totals.grandTotal * 100) / 100}</div>
            </div>
            <div className="stat-card">
              <h3>Average Hours/Employee</h3>
              <div className="number">
                {Object.keys(projectData.employees).length > 0 
                  ? Math.round((projectData.totals.grandTotal / Object.keys(projectData.employees).length) * 100) / 100
                  : 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No project selected state */}
      {!selectedProject && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          color: '#999',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginBottom: '10px', color: '#666' }}>Select a Project</h3>
          <p>Choose a project from the dropdown above to view the timesheet summary.</p>
        </div>
      )}

      {/* No data state */}
      {!loading && selectedProject && projectData && Object.keys(projectData.employees).length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#999',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginBottom: '10px', color: '#666' }}>No Data Found</h3>
          <p>No timesheet entries found for the selected project and date range.</p>
          <p style={{ fontSize: '14px' }}>
            Try selecting a different date range or check if employees have logged time for this project.
          </p>
        </div>
      )}
    </div>
  );
}