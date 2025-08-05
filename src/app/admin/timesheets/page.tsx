"use client";

import { useState, useEffect } from 'react';

// Types
interface Timesheet {
  id: number;
  employee_id: string;
  employee_name: string;
  project_name: string;
  activity_type: string;
  date: string;
  hours_worked: string;
  description?: string;
}

interface TimesheetSummary {
  total_hours: number;
  total_entries: number;
  date_range: string;
}

export default function AdminTimesheets() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [summary, setSummary] = useState<TimesheetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

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

  // Set default date range (current month)
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setDateFrom(firstDay.toISOString().split('T')[0]);
    setDateTo(lastDay.toISOString().split('T')[0]);
  }, []);

  // Fetch employees for filter dropdown
  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE}/employees/`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    }
  };

  // Fetch projects for filter dropdown
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
    }
  };

  // Fetch timesheets
  const fetchTimesheets = async (page = 1) => {
    if (!dateFrom) return; // Wait for default dates to be set

    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20'
      });

      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (selectedEmployee) params.append('employee_id', selectedEmployee);
      if (selectedProject) params.append('project_id', selectedProject);

      const response = await fetch(`${API_BASE}/timesheets/?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch timesheets');
      
      const data = await response.json();
      setTimesheets(data.timesheets || []);
      setCurrentPage(data.current_page || 1);
      setTotalPages(data.total_pages || 1);
      
      // Create summary from the filters_applied data
      if (data.filters_applied) {
        setSummary({
          total_hours: data.timesheets?.reduce((sum: number, ts: any) => sum + parseFloat(ts.hours_worked || 0), 0) || 0,
          total_entries: data.count || 0,
          date_range: `${data.filters_applied.date_from} to ${data.filters_applied.date_to}`
        });
      }

    } catch (err) {
      setError('Failed to load timesheets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchEmployees();
    fetchProjects();
  }, []);

  // Fetch timesheets when filters change
  useEffect(() => {
    if (dateFrom) {
      fetchTimesheets(1);
      setCurrentPage(1);
    }
  }, [dateFrom, dateTo, selectedEmployee, selectedProject]);

  // Filter timesheets by search term (client-side filtering)
  const filteredTimesheets = timesheets.filter(timesheet => 
    timesheet.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    timesheet.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    timesheet.activity_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchTimesheets(newPage);
      setCurrentPage(newPage);
    }
  };

  // Reset filters
  const resetFilters = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setDateFrom(firstDay.toISOString().split('T')[0]);
    setDateTo(lastDay.toISOString().split('T')[0]);
    setSelectedEmployee('');
    setSelectedProject('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div>
      <div className="admin-header">
        <h1>Timesheet Management</h1>
        <p>Review and manage employee timesheets</p>
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

      {/* Summary Cards */}
      {summary && (
        <div className="stats-grid" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <h3>Total Entries</h3>
            <div className="number">{summary.total_entries}</div>
          </div>
          <div className="stat-card">
            <h3>Total Hours</h3>
            <div className="number">{Math.round(summary.total_hours * 100) / 100}</div>
          </div>
          <div className="stat-card">
            <h3>Date Range</h3>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
              {formatToBritishDate(dateFrom)} - {formatToBritishDate(dateTo)}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ 
        background: '#f9f9f9', 
        padding: '20px', 
        borderRadius: '5px', 
        marginBottom: '20px' 
      }}>
        <h3 style={{ marginTop: 0 }}>Filters</h3>
        
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

        <div className="form-row">
          <div className="form-group">
            <label>Employee:</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.full_name} ({emp.employee_id})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Project:</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: '15px' }}>
          <button className="btn btn-primary" onClick={() => fetchTimesheets(1)}>
            Apply Filters
          </button>
          <button className="btn" onClick={resetFilters} style={{ marginLeft: '10px' }}>
            Reset Filters
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="actions">
        <input
          type="text"
          placeholder="Search by employee, project, or activity..."
          className="search-box"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Loading timesheets...
        </div>
      )}

      {/* Timesheets table */}
      {!loading && (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Project</th>
                <th>Activity</th>
                <th>Date</th>
                <th>Hours</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredTimesheets.map((timesheet) => (
                <tr key={timesheet.id}>
                  <td>{timesheet.employee_id}</td>
                  <td>{timesheet.employee_name}</td>
                  <td>{timesheet.project_name}</td>
                  <td>{timesheet.activity_type}</td>
                  <td>{formatToBritishDate(timesheet.date)}</td>
                  <td>{timesheet.hours_worked} hrs</td>
                  <td>
                    {timesheet.description ? (
                      timesheet.description.length > 50 ? 
                        timesheet.description.substring(0, 50) + '...' : 
                        timesheet.description
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '10px', 
              marginTop: '20px' 
            }}>
              <button 
                className="btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              <span>
                Page {currentPage} of {totalPages}
              </span>
              
              <button 
                className="btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {filteredTimesheets.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          No timesheets found matching your search criteria.
        </div>
      )}
    </div>
  );
}