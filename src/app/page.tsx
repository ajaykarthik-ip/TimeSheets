"use client";

import React, { useState, useEffect } from 'react';
import './page.css';

interface User {
  employee_id: string;
  employee_name: string;
  department: string;
  role: string;
}

interface Timesheet {
  id: number;
  project_name: string;
  activity_type: string;
  date: string;
  hours_worked: string;
}

interface Project {
  id: number;
  name: string;
}

type ViewMode = 'day' | 'week' | 'month';

const API_BASE = 'http://localhost:8000/api';

export default function SheetView() {
  const [user, setUser] = useState<User | null>(null);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [activities, setActivities] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentDate, viewMode]);

  const loadData = async () => {
    try {
      if (!user) {
        const userRes = await fetch(`${API_BASE}/timesheets/current-user/`, {
          credentials: 'include'
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        }

        const projectsRes = await fetch(`${API_BASE}/projects/active/`, {
          credentials: 'include'
        });
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(projectsData.projects || []);
        }
      }

      const { dateFrom, dateTo } = getDateRange();
      const timesheetRes = await fetch(`${API_BASE}/timesheets/my-timesheets/?date_from=${dateFrom}&date_to=${dateTo}`, {
        credentials: 'include'
      });
      if (timesheetRes.ok) {
        const timesheetData = await timesheetRes.json();
        setTimesheets(timesheetData.timesheets || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const date = new Date(currentDate);
    let dateFrom, dateTo;

    if (viewMode === 'day') {
      dateFrom = dateTo = date.toISOString().split('T')[0];
    } else if (viewMode === 'week') {
      const monday = new Date(date);
      monday.setDate(date.getDate() - date.getDay() + 1);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      dateFrom = monday.toISOString().split('T')[0];
      dateTo = sunday.toISOString().split('T')[0];
    } else {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      dateFrom = start.toISOString().split('T')[0];
      dateTo = end.toISOString().split('T')[0];
    }

    return { dateFrom, dateTo };
  };

  const getDatesInRange = () => {
    const { dateFrom, dateTo } = getDateRange();
    const dates = [];
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(new Date(date));
    }
    return dates;
  };

  const getTimesheetsByDate = () => {
    const timesheetMap: { [key: string]: Timesheet[] } = {};
    timesheets.forEach(ts => {
      if (!timesheetMap[ts.date]) {
        timesheetMap[ts.date] = [];
      }
      timesheetMap[ts.date].push(ts);
    });
    return timesheetMap;
  };

  const navigate = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const formatDateHeader = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else if (viewMode === 'week') {
      const { dateFrom, dateTo } = getDateRange();
      return `${new Date(dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
  };

  const loadActivities = async (projectId: number) => {
    try {
      const res = await fetch(`${API_BASE}/timesheets/project/${projectId}/activities/`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activity_types || []);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const createTimesheet = async (formData: FormData) => {
    if (!user) return;
    
    setCreating(true);
    try {
      const data = {
        employee_id: user.employee_id,
        project: parseInt(formData.get('project') as string),
        activity_type: formData.get('activity_type') as string,
        date: formData.get('date') as string,
        hours_worked: formData.get('hours_worked') as string,
        description: formData.get('description') as string || ''
      };

      const res = await fetch(`${API_BASE}/timesheets/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (res.ok) {
        setShowForm(false);
        loadData();
      } else {
        const error = await res.json();
        alert('Failed to create timesheet: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to create timesheet: ' + error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container">
        <h2>Please log in</h2>
        <button onClick={() => window.location.href = '/login'}>Login</button>
      </div>
    );
  }

  const isAdmin = user.role === 'admin' || user.role === 'manager';
  const dates = getDatesInRange();
  const timesheetsByDate = getTimesheetsByDate();

  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
        <h3>User Info</h3>
        <div className="user-info">
          <p><strong>Name:</strong> {user.employee_name}</p>
          <p><strong>ID:</strong> {user.employee_id}</p>
          <p><strong>Department:</strong> {user.department}</p>
          <p><strong>Role:</strong> {user.role}</p>
        </div>
        
        {isAdmin && (
          <button 
            className="admin-btn" 
            onClick={() => window.location.href = '/admin'}
          >
            Admin Panel
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="main">
        {/* Header Controls */}
        <div className="sheet-header">
          <div className="view-controls">
            <button 
              className={viewMode === 'day' ? 'active' : ''}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
            <button 
              className={viewMode === 'week' ? 'active' : ''}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button 
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
          </div>
          
          <div className="date-nav">
            <button onClick={() => navigate(-1)}>‹</button>
            <span className="date-display">{formatDateHeader()}</span>
            <button onClick={() => navigate(1)}>›</button>
          </div>

          <button className="add-btn" onClick={() => setShowForm(true)}>
            + Add
          </button>
        </div>

        {/* Sheet View */}
        <div className="sheet-container">
          {dates.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const dayTimesheets = timesheetsByDate[dateStr] || [];
            const totalHours = dayTimesheets.reduce((sum, ts) => sum + parseFloat(ts.hours_worked), 0);
            
            return (
              <div key={dateStr} className="date-column">
                <div className="date-header">
                  <div className="date-info">
                    <span className="day">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="date-num">{date.getDate()}</span>
                  </div>
                  {totalHours > 0 && (
                    <span className="total-hours">{totalHours}h</span>
                  )}
                </div>
                
                <div className="entries">
                  {dayTimesheets.map(timesheet => (
                    <div key={timesheet.id} className="entry">
                      <div className="project">{timesheet.project_name}</div>
                      <div className="activity">{timesheet.activity_type}</div>
                      <div className="hours">{timesheet.hours_worked}h</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="form-overlay">
            <form className="create-form" onSubmit={(e) => {
              e.preventDefault();
              createTimesheet(new FormData(e.currentTarget));
            }}>
              <h3>Create Timesheet</h3>
              
              <label>
                Project:
                <select name="project" required onChange={(e) => {
                  if (e.target.value) loadActivities(parseInt(e.target.value));
                }}>
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Activity:
                <select name="activity_type" required>
                  <option value="">Select Activity</option>
                  {activities.map(activity => (
                    <option key={activity} value={activity}>{activity}</option>
                  ))}
                </select>
              </label>

              <label>
                Date:
                <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} />
              </label>

              <label>
                Hours:
                <input type="number" name="hours_worked" step="0.25" min="0.25" max="24" required />
              </label>

              <label>
                Description (optional):
                <textarea name="description" rows={3}></textarea>
              </label>

              <div className="form-buttons">
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}