"use client";

import { useState, useEffect, useCallback } from 'react';

// Types
interface Project {
  id: number;
  name: string;
}

interface TimesheetEntry {
  employee_id: string;
  employee_name: string;
  activity_type: string;
  hours_worked: string;
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

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setDateFrom(firstDay.toISOString().split('T')[0]);
    setDateTo(lastDay.toISOString().split('T')[0]);
  }, []);

  const formatToBritishDate = (dateString: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (err) {
      console.error('Date formatting error:', err);
      return dateString;
    }
  };

  const fetchProjects = useCallback(async () => {
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
  }, [API_BASE]);

  const fetchProjectTimesheets = useCallback(async () => {
    if (!selectedProject || !dateFrom || !dateTo) return;

    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        project_id: selectedProject,
        date_from: dateFrom,
        date_to: dateTo,
        page_size: '1000'
      });

      const response = await fetch(`${API_BASE}/timesheets/admin/all/?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch timesheets');
      
      const data = await response.json();
      const timesheets = data.timesheets || [];

      const summary = processTimesheetData(timesheets);
      setProjectData(summary);

    } catch (err) {
      setError('Failed to load project timesheets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedProject, dateFrom, dateTo, API_BASE]);

  const processTimesheetData = (timesheets: TimesheetEntry[]): ProjectTimesheetSummary => {
    const employees: { [key: string]: string } = {};
    const activities: Set<string> = new Set();
    const data: { [employeeId: string]: { [activity: string]: number } } = {};

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

    const totals = {
      byEmployee: {} as { [employeeId: string]: number },
      byActivity: {} as { [activity: string]: number },
      grandTotal: 0
    };

    Object.keys(data).forEach(employeeId => {
      totals.byEmployee[employeeId] = Object.values(data[employeeId]).reduce((sum, hours) => sum + hours, 0);
    });

    Array.from(activities).forEach(activity => {
      totals.byActivity[activity] = Object.keys(data).reduce((sum, employeeId) => {
        return sum + (data[employeeId][activity] || 0);
      }, 0);
    });

    totals.grandTotal = Object.values(totals.byEmployee).reduce((sum, total) => sum + total, 0);

    return {
      employees,
      activities: Array.from(activities).sort(),
      data,
      totals
    };
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (selectedProject && dateFrom && dateTo) {
      fetchProjectTimesheets();
    } else {
      setProjectData(null);
    }
  }, [selectedProject, dateFrom, dateTo, fetchProjectTimesheets]);

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
        <div className="error-box">
          {error}
        </div>
      )}

      <div>
        <h3>Select Project and Date Range</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Project:</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
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

        <div>
          Date Range: {formatToBritishDate(dateFrom)} - {formatToBritishDate(dateTo)}
        </div>
      </div>

      {loading && (
        <div className="loading-box">
          <div>Loading project timesheet data...</div>
        </div>
      )}

      {!loading && projectData && selectedProject && (
        <div>
          <div>
            <h2>
              {getSelectedProjectName()}
            </h2>
          </div>

          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  {projectData.activities.map((activity) => (
                    <th key={activity}>{activity}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(projectData.employees).map(([employeeId, employeeName]) => (
                  <tr key={employeeId}>
                    <td>{employeeName}</td>
                    {projectData.activities.map((activity) => (
                      <td key={activity}>
                        {projectData.data[employeeId]?.[activity] 
                          ? Math.round(projectData.data[employeeId][activity] * 100) / 100
                          : 0}
                      </td>
                    ))}
                    <td>
                      {Math.round(projectData.totals.byEmployee[employeeId] * 100) / 100}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>Total</td>
                  {projectData.activities.map((activity) => (
                    <td key={activity}>
                      {Math.round(projectData.totals.byActivity[activity] * 100) / 100}
                    </td>
                  ))}
                  <td>
                    {Math.round(projectData.totals.grandTotal * 100) / 100}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="stats-grid">
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

      {!selectedProject && !loading && (
        <div className="no-project-box">
          <h3>Select a Project</h3>
          <p>Choose a project from the dropdown above to view the timesheet summary.</p>
        </div>
      )}

      {!loading && selectedProject && projectData && Object.keys(projectData.employees).length === 0 && (
        <div className="no-data-box">
          <h3>No Data Found</h3>
          <p>No timesheet entries found for the selected project and date range.</p>
          <p>
            Try selecting a different date range or check if employees have logged time for this project.
          </p>
        </div>
      )}
    </div>
  );
}
