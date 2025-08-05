"use client";

import React, { useState, useEffect } from 'react';
import './page.css'; 
import LogoutButton from './components/LogoutButton';

// Types
interface Project {
  id: number;
  name: string;
  billable: boolean;
}

interface CurrentUser {
  employee_id: string;
  employee_name: string;
  department: string;
  role: string;
  is_active: boolean;
}

interface Timesheet {
  id: number;
  project: number;
  project_name: string;
  activity_type: string;
  date: string;
  hours_worked: string;
  description?: string;
}

type TimesheetRow = {
  id: string;
  projectId: number;
  projectName: string;
  activity: string;
  billable: boolean;
  hours: number[];
  total: number;
  timesheetIds: (number | null)[]; // Track individual timesheet entry IDs for each day
}

// API service functions
const api = {
  async getCurrentUser() {
    const response = await fetch('http://localhost:8000/api/timesheets/current-user/', {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Not authenticated');
    return response.json();
  },

  async getProjects() {
    const response = await fetch('http://localhost:8000/api/projects/active/', {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  },

  async getProjectActivities(projectId: number) {
    const response = await fetch(`http://localhost:8000/api/timesheets/project/${projectId}/activities/`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch activities');
    return response.json();
  },

  async getMyTimesheets(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`http://localhost:8000/api/timesheets/my-timesheets/?${queryString}`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch timesheets');
    return response.json();
  },

  async createTimesheet(data: any) {
    const response = await fetch('http://localhost:8000/api/timesheets/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to create timesheet');
    return result;
  },

  async updateTimesheet(id: number, data: any) {
    const response = await fetch(`http://localhost:8000/api/timesheets/${id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to update timesheet');
    return result;
  },

  async deleteTimesheet(id: number) {
    const response = await fetch(`http://localhost:8000/api/timesheets/${id}/`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || 'Failed to delete timesheet');
    }
    return { message: 'Deleted successfully' };
  }
};

export default function SimplifiedTimesheet() {
  // State for API data
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<{ [projectId: number]: string[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Original timesheet state
  const [rows, setRows] = useState<TimesheetRow[]>([
    {
      id: 'new-1',
      projectId: 0,
      projectName: '',
      activity: '',
      billable: true,
      hours: Array(7).fill(0),
      total: 0,
      timesheetIds: Array(7).fill(null),
    },
  ]);

  const [weekStartDate, setWeekStartDate] = useState<Date>(new Date());
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Calculate totals
  const [regularHours, setRegularHours] = useState<number>(0);
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [billableHours, setBillableHours] = useState<number>(0);
  const [nonBillableHours, setNonBillableHours] = useState<number>(0);
  const [totalHours, setTotalHours] = useState<number>(0);

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // Get current week dates
  const getCurrentWeekDates = () => {
    const currentDay = weekStartDate.getDay();
    const monday = new Date(weekStartDate);
    monday.setDate(weekStartDate.getDate() - currentDay + 1);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getCurrentWeekDates();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const userData = await api.getCurrentUser();
        setCurrentUser(userData);
        
        // Get projects
        const projectsResult = await api.getProjects();
        setProjects(projectsResult.projects || []);
        
        // Load activities for all projects
        const activitiesMap: { [projectId: number]: string[] } = {};
        for (const project of projectsResult.projects || []) {
          try {
            const activityResult = await api.getProjectActivities(project.id);
            activitiesMap[project.id] = activityResult.activity_types || [];
          } catch (err) {
            console.warn(`Failed to load activities for project ${project.id}`);
            activitiesMap[project.id] = [];
          }
        }
        setActivities(activitiesMap);
        
        // Load timesheet data for current week
        await loadTimesheetData();
        
      } catch (error: any) {
        setError('Failed to load data. Please make sure you are logged in.');
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load timesheet data when week changes
  useEffect(() => {
    if (currentUser && projects.length > 0) {
      loadTimesheetData();
    }
  }, [weekStartDate, currentUser, projects]);

  const loadTimesheetData = async () => {
    if (!currentUser) return;

    try {
      const weekStart = weekDates[0].toISOString().split('T')[0];
      const weekEnd = weekDates[6].toISOString().split('T')[0];
      
      const result = await api.getMyTimesheets({
        date_from: weekStart,
        date_to: weekEnd
      });
      
      const timesheets = result.timesheets || [];
      
      // Group timesheets by project and activity
      const groupedData: { [key: string]: { 
        project: Project, 
        activity: string, 
        entries: { [date: string]: Timesheet } 
      } } = {};

      timesheets.forEach((timesheet: Timesheet) => {
        const key = `${timesheet.project}-${timesheet.activity_type}`;
        if (!groupedData[key]) {
          const project = projects.find(p => p.id === timesheet.project);
          groupedData[key] = {
            project: project!,
            activity: timesheet.activity_type,
            entries: {}
          };
        }
        groupedData[key].entries[timesheet.date] = timesheet;
      });

      // Convert to TimesheetRow format
      const newRows: TimesheetRow[] = Object.entries(groupedData).map(([key, data]) => {
        const hours = Array(7).fill(0);
        const timesheetIds = Array(7).fill(null);
        
        weekDates.forEach((date, index) => {
          const dateStr = date.toISOString().split('T')[0];
          const entry = data.entries[dateStr];
          if (entry) {
            hours[index] = parseFloat(entry.hours_worked);
            timesheetIds[index] = entry.id;
          }
        });

        return {
          id: key,
          projectId: data.project?.id || 0,
          projectName: data.project?.name || '',
          activity: data.activity,
          billable: data.project?.billable || false,
          hours,
          total: hours.reduce((sum, h) => sum + h, 0),
          timesheetIds
        };
      });

      // Add empty row if no data
      if (newRows.length === 0) {
        newRows.push({
          id: 'new-1',
          projectId: 0,
          projectName: '',
          activity: '',
          billable: true,
          hours: Array(7).fill(0),
          total: 0,
          timesheetIds: Array(7).fill(null),
        });
      }

      setRows(newRows);
    } catch (error) {
      console.error('Error loading timesheet data:', error);
    }
  };

  const calculateTotals = () => {
    let total = 0;
    let billable = 0;
    let nonBillable = 0;

    rows.forEach(row => {
      const rowTotal = row.hours.reduce((sum, h) => sum + h, 0);
      total += rowTotal;
      
      if (row.billable) {
        billable += rowTotal;
      } else {
        nonBillable += rowTotal;
      }
    });

    setTotalHours(total);
    setBillableHours(billable);
    setNonBillableHours(nonBillable);
    setRegularHours(Math.min(total, 40));
    setOvertimeHours(Math.max(total - 40, 0));
  };

  const updateRow = async (id: string, field: keyof TimesheetRow, value: any) => {
    const updated = rows.map((row) => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        
        // Auto-update project info when project changes
        if (field === 'projectName') {
          const project = projects.find(p => p.name === value);
          if (project) {
            updatedRow.projectId = project.id;
            updatedRow.billable = project.billable;
            // Reset activity when project changes
            updatedRow.activity = '';
          } else {
            updatedRow.projectId = 0;
            updatedRow.billable = true;
            updatedRow.activity = '';
          }
        }
        
        updatedRow.total = updatedRow.hours.reduce((sum, h) => sum + h, 0);
        return updatedRow;
      }
      return row;
    });
    setRows(updated);

    // Save project/activity selection to database if we have existing timesheet entries
    const row = updated.find(r => r.id === id);
    if (row && currentUser && (field === 'projectName' || field === 'activity')) {
      // Update all existing timesheet entries for this row with new project/activity
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const timesheetId = row.timesheetIds[dayIndex];
        if (timesheetId && row.projectId && row.activity) {
          try {
            const date = weekDates[dayIndex].toISOString().split('T')[0];
            const timesheetData = {
              employee_id: currentUser.employee_id,
              project: row.projectId,
              activity_type: row.activity,
              date: date,
              hours_worked: row.hours[dayIndex].toString(),
              description: ''
            };
            await api.updateTimesheet(timesheetId, timesheetData);
          } catch (error) {
            console.error(`Failed to update timesheet ${timesheetId}:`, error);
          }
        }
      }
    }
  };

  // Check if a date is in the future (after today)
  const isDateEditable = (date: Date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today
    return date <= today; // Can edit today and past dates, not future
  };

  const updateHour = async (id: string, dayIndex: number, value: number) => {
    // Check if date is editable (not future)
    const selectedDate = weekDates[dayIndex];
    if (!isDateEditable(selectedDate)) {
      setError('Cannot edit timesheets for future dates.');
      return;
    }

    // Validate input
    if (value < 0) value = 0;
    if (value > 24) value = 24;
    
    // Round to nearest 0.25
    value = Math.round(value * 4) / 4;

    const rowIndex = rows.findIndex(row => row.id === id);
    if (rowIndex === -1) return;

    const row = rows[rowIndex];
    const oldValue = row.hours[dayIndex];
    const timesheetId = row.timesheetIds[dayIndex];
    const date = weekDates[dayIndex].toISOString().split('T')[0];

    // Skip API call if project/activity not selected
    if (!row.projectId || !row.activity || !currentUser) {
      // Just update local state for display purposes
      const updated = rows.map((r) => {
        if (r.id === id) {
          const newHours = [...r.hours];
          newHours[dayIndex] = value;
          const updatedRow = { ...r, hours: newHours };
          updatedRow.total = newHours.reduce((sum, h) => sum + h, 0);
          return updatedRow;
        }
        return r;
      });
      setRows(updated);
      return;
    }

    // Clear any existing errors
    setError('');

    // Update local state first for immediate feedback
    const updated = rows.map((r) => {
      if (r.id === id) {
        const newHours = [...r.hours];
        newHours[dayIndex] = value;
        const updatedRow = { ...r, hours: newHours };
        updatedRow.total = newHours.reduce((sum, h) => sum + h, 0);
        return updatedRow;
      }
      return r;
    });
    setRows(updated);

    try {
      if (value === 0) {
        // Delete timesheet entry if exists
        if (timesheetId) {
          await api.deleteTimesheet(timesheetId);
          // Update timesheetIds
          const newRow = updated.find(r => r.id === id);
          if (newRow) {
            newRow.timesheetIds[dayIndex] = null;
          }
        }
      } else {
        const timesheetData = {
          employee_id: currentUser.employee_id,
          project: row.projectId,
          activity_type: row.activity,
          date: date,
          hours_worked: value.toString(),
          description: ''
        };

        if (timesheetId) {
          // Update existing entry
          const result = await api.updateTimesheet(timesheetId, timesheetData);
          console.log('Updated timesheet:', result);
        } else {
          // Create new entry
          const result = await api.createTimesheet(timesheetData);
          console.log('Created timesheet:', result);
          // Update timesheetIds
          const newRow = updated.find(r => r.id === id);
          if (newRow && result.timesheet) {
            newRow.timesheetIds[dayIndex] = result.timesheet.id;
          }
        }
      }
    } catch (error: any) {
      console.error('Error updating timesheet:', error);
      
      // Revert local state on error
      const revertedRows = rows.map((r) => {
        if (r.id === id) {
          const newHours = [...r.hours];
          newHours[dayIndex] = oldValue;
          const updatedRow = { ...r, hours: newHours };
          updatedRow.total = newHours.reduce((sum, h) => sum + h, 0);
          return updatedRow;
        }
        return r;
      });
      setRows(revertedRows);
      
      // Show detailed error message
      let errorMessage = 'Failed to update timesheet.';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Common error messages
      if (errorMessage.includes('date')) {
        errorMessage = 'Invalid date. Please check the selected date and try again.';
      } else if (errorMessage.includes('project')) {
        errorMessage = 'Invalid project selection. Please select a valid project.';
      } else if (errorMessage.includes('activity')) {
        errorMessage = 'Invalid activity type. Please select a valid activity.';
      } else if (errorMessage.includes('hours')) {
        errorMessage = 'Invalid hours value. Please enter a valid number between 0 and 24.';
      }
      
      setError(errorMessage);
      
      // Clear error after 5 seconds
      setTimeout(() => setError(''), 5000);
    }
  };

  const addRow = () => {
    const newRow: TimesheetRow = {
      id: `new-${Date.now()}`,
      projectId: 0,
      projectName: '',
      activity: '',
      billable: true,
      hours: Array(7).fill(0),
      total: 0,
      timesheetIds: Array(7).fill(null),
    };
    setRows([...rows, newRow]);
  };

  const removeRow = async (id: string) => {
    if (rows.length <= 1) return;

    const row = rows.find(r => r.id === id);
    if (!row) return;

    // Delete all existing timesheet entries for this row
    try {
      for (const timesheetId of row.timesheetIds) {
        if (timesheetId) {
          await api.deleteTimesheet(timesheetId);
        }
      }
    } catch (error) {
      console.error('Error deleting timesheet entries:', error);
    }

    setRows(rows.filter(row => row.id !== id));
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(weekStartDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setWeekStartDate(newDate);
  };

  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.toLocaleDateString('en-GB')} - ${end.toLocaleDateString('en-GB')}`;
  };

  // Calculate totals whenever rows change
  useEffect(() => {
    calculateTotals();
  }, [rows]);

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
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <LogoutButton />



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
      <div style={{
        width: '250px',
        background: '#f0f0f0',
        padding: '20px',
        borderRight: '1px solid #ddd'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Employee Info</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ 
              display: 'block',
              fontWeight: 'bold', 
              color: '#555', 
              fontSize: '12px',
              marginBottom: '5px',
              textTransform: 'uppercase'
            }}>Name</label>
            <span style={{ color: '#333', fontSize: '14px' }}>
              {currentUser.employee_name}
            </span>
          </div>
          
          <div>
            <label style={{ 
              display: 'block',
              fontWeight: 'bold', 
              color: '#555', 
              fontSize: '12px',
              marginBottom: '5px',
              textTransform: 'uppercase'
            }}>Employee ID</label>
            <span style={{ color: '#333', fontSize: '14px' }}>
              {currentUser.employee_id}
            </span>
          </div>
          
          <div>
            <label style={{ 
              display: 'block',
              fontWeight: 'bold', 
              color: '#555', 
              fontSize: '12px',
              marginBottom: '5px',
              textTransform: 'uppercase'
            }}>Buisness Unit</label>
            <span style={{ color: '#333', fontSize: '14px' }}>
              {currentUser.department}
            </span>
          </div>
          
          <div>
            <label style={{ 
              display: 'block',
              fontWeight: 'bold', 
              color: '#555', 
              fontSize: '12px',
              marginBottom: '5px',
              textTransform: 'uppercase'
            }}>Role</label>
            <span style={{ color: '#333', fontSize: '14px' }}>
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
            <label style={{ 
              display: 'block',
              fontWeight: 'bold', 
              color: '#555', 
              fontSize: '12px',
              marginBottom: '5px',
              textTransform: 'uppercase'
            }}>Week</label>
            <span style={{ color: '#333', fontSize: '14px' }}>
              {formatWeekRange()}
            </span>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                <span>Overtime:</span>
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
                  
                  return (
                    <th key={index} className={`day-header ${isFutureDate ? 'future-date-header' : ''}`}>
                      {dayNames[index]}<br/>
                      <span className="date">
                        {date.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                        {isFutureDate && <span style={{ fontSize: '10px', display: 'block', color: '#999' }}>Future</span>}
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
                <tr key={row.id}>
                  <td className="project-name">
                    <select
                      value={row.projectName}
                      onChange={(e) => updateRow(row.id, 'projectName', e.target.value)}
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
                      disabled={!row.projectId}
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
                    const dateForThisColumn = weekDates[index];
                    const isEditable = isDateEditable(dateForThisColumn);
                    const isFutureDate = !isEditable;
                    
                    return (
                      <td key={index} className={isFutureDate ? 'future-date-cell' : ''}>
                        <input
                          type="number"
                          min="0"
                          max="24"
                          step="0.25"
                          value={hour || ''}
                          onChange={(e) => updateHour(row.id, index, parseFloat(e.target.value) || 0)}
                          className="hour-input"
                          disabled={!row.projectId || !row.activity || isFutureDate}
                          style={{
                            backgroundColor: isFutureDate ? '#f5f5f5' : 'white',
                            color: isFutureDate ? '#999' : '#333',
                            cursor: isFutureDate ? 'not-allowed' : 'text'
                          }}
                          title={isFutureDate ? 'Cannot edit future dates' : ''}
                        />
                      </td>
                    );
                  })}
                  <td className="total-cell">{row.total.toFixed(1)}</td>
                  <td>
                    <button 
                      onClick={() => removeRow(row.id)}
                      className="remove-btn"
                      disabled={rows.length <= 1}
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
          <button onClick={addRow} className="add-btn">
            + Add Row
          </button>
        </div>

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

        {totalHours > 40 && (
          <div className="warning">
            ⚠️ Warning: Total hours exceed 40. Overtime hours: {overtimeHours.toFixed(1)}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .future-date-header {
          background-color: #f0f0f0 !important;
          color: #666 !important;
        }
        
        .future-date-cell {
          background-color: #fafafa;
        }
        
        .future-date-cell input {
          background-color: #f5f5f5 !important;
          color: #999 !important;
          cursor: not-allowed !important;
        }
      `}</style>
    </div>
  );
}