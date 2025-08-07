"use client";

import React, { useState, useEffect } from 'react';
import './page.css';
import UserSidebar from './components/UserSidebar';
import ViewControls from './components/ViewControls';
import TimesheetForm from './components/TimesheetForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faFloppyDisk, faTrash } from '@fortawesome/free-solid-svg-icons';

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
  status?: 'draft' | 'submitted';
  can_edit?: boolean;
  description?: string;
}

interface Project {
  id: number;
  name: string;
}

type ViewMode = 'day' | 'week' | 'month';

const API_BASE = 'http://localhost:8000/api';

export default function MainPage() {
  const [user, setUser] = useState<User | null>(null);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [activities, setActivities] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);

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
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    dateFrom = dateTo = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  } else if (viewMode === 'week') {
    const monday = new Date(date);
    monday.setDate(date.getDate() - date.getDay() + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    dateFrom = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    dateTo = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
  } else {
    // Month view
    const year = date.getFullYear();
    const month = date.getMonth();
    
    dateFrom = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    dateTo = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  }

  return { dateFrom, dateTo };
};

  const getDaysForView = () => {
    if (viewMode === 'day') {
      return [new Date(currentDate)];
    } else if (viewMode === 'week') {
      const { dateFrom } = getDateRange();
      const [year, month, day] = dateFrom.split('-').map(Number);
      const monday = new Date(year, month - 1, day);
      
      const days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        days.push(date);
      }
      return days;
    } else {
      // Month view
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const days = [];
      for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
        days.push(new Date(date));
      }
      return days;
    }
  };

  const getTimesheetsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return timesheets.filter(ts => ts.date === dateStr);
  };

  const getDayTotal = (date: Date) => {
    const dayTimesheets = getTimesheetsForDate(date);
    return dayTimesheets.reduce((total, ts) => total + parseFloat(ts.hours_worked || '0'), 0);
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

  const showNotification = (message: string, type = 'success') => {
    if (type === 'success') setSuccess(message);
    else setError(message);
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const editTimesheet = async (id: number, data: any) => {
    try {
      const res = await fetch(`${API_BASE}/timesheets/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (res.ok) {
        showNotification('Timesheet updated successfully');
        loadData();
        setEditingTimesheet(null);
      }
    } catch (error) {
      showNotification('Failed to update timesheet', 'error');
    }
  };

  const deleteTimesheet = async (id: number) => {
    if (!confirm('Delete this timesheet?')) return;
    try {
      const res = await fetch(`${API_BASE}/timesheets/${id}/`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        showNotification('Timesheet deleted successfully');
        loadData();
      }
    } catch (error) {
      showNotification('Failed to delete timesheet', 'error');
    }
  };

  const submitTimesheet = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/timesheets/${id}/submit/`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (res.ok) {
        showNotification('Timesheet submitted successfully');
        loadData();
      }
    } catch (error) {
      showNotification('Failed to submit timesheet', 'error');
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
        showNotification('Timesheet created successfully');
        loadData();
      } else {
        const error = await res.json();
        showNotification('Failed to create timesheet: ' + (error.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      showNotification('Failed to create timesheet: ' + error, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleEditSubmit = (formData: FormData) => {
    if (!editingTimesheet) return;
    
    const data = {
      project: parseInt(formData.get('project') as string),
      activity_type: formData.get('activity_type') as string,
      date: formData.get('date') as string,
      hours_worked: formData.get('hours_worked') as string,
      description: formData.get('description') as string || ''
    };
    editTimesheet(editingTimesheet.id, data);
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
  const daysToShow = getDaysForView();

  return (
    <div className="app">
      <UserSidebar user={user} isAdmin={isAdmin} />

      <div className="main">
        <div className="sheet-header">
          <ViewControls 
            viewMode={viewMode} 
            onViewModeChange={setViewMode} 
          />
          
          <div className="date-nav">
            <button onClick={() => navigate(-1)}>‹</button>
            <span className="date-display">{formatDateHeader()}</span>
            <button onClick={() => navigate(1)}>›</button>
          </div>

          <button className="add-btn" onClick={() => setShowForm(true)}>
            + 
          </button>
        </div>

        {error && <div className="notification error">{error}</div>}
        {success && <div className="notification success">{success}</div>}

        <div className="weekly-calendar">
          {daysToShow.map((date) => {
            const dayTimesheets = getTimesheetsForDate(date);
            const dayTotal = getDayTotal(date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const dateNum = date.getDate();
            
            return (
              <div key={date.toISOString()} className="day-row">
                <div className="day-header">
                  <div className="day-info">
                    <div className="day-name">{dayName}</div>
                    <div className="day-date">{dateNum}</div>
                  </div>
                  <div className="day-total">{dayTotal}h</div>
                </div>
                <div className="day-entries">
                  {dayTimesheets.map((timesheet) => (
                    <div key={timesheet.id} className="timesheet-entry">
                      <div className="entry-project">{timesheet.project_name}</div>
                      <div className="entry-activity">{timesheet.activity_type}</div>
                      <div className="entry-hours">{timesheet.hours_worked}h</div>
                      <div className="entry-actions">
                        {timesheet.status !== 'submitted' && (
                          <>
                            <button onClick={() => setEditingTimesheet(timesheet)} title="Edit">
                              <FontAwesomeIcon icon={faPen} />
                            </button>
                            <button onClick={() => deleteTimesheet(timesheet.id)} title="Delete">
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                            <button onClick={() => submitTimesheet(timesheet.id)} title="Submit">
                              <FontAwesomeIcon icon={faFloppyDisk} />
                            </button>
                          </>
                        )}
                        {timesheet.status === 'submitted' && (
                          <span className="submitted-status">Submitted</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {showForm && (
          <TimesheetForm
            projects={projects}
            activities={activities}
            onProjectChange={loadActivities}
            onSubmit={createTimesheet}
            onCancel={() => setShowForm(false)}
            creating={creating}
            title="Create Timesheet"
            submitText="Create"
          />
        )}

        {editingTimesheet && (
          <TimesheetForm
            projects={projects}
            activities={activities}
            editingTimesheet={editingTimesheet}
            onProjectChange={loadActivities}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingTimesheet(null)}
            creating={false}
            title="Edit Timesheet"
            submitText="Update"
          />
        )}
      </div>
    </div>
  );
}