"use client";

import React, { useState, useEffect } from 'react';
import './page.css';
import UserSidebar from './components/UserSidebar';
import ViewControls from './components/ViewControls';
import TimesheetForm from './components/TimesheetForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

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
  const [submittingWeek, setSubmittingWeek] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentDate, viewMode]);

  // FIXED: Helper function to create date string in YYYY-MM-DD format
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // FIXED: Helper function to parse date string back to Date object
  const parseDateString = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Helper function to format date for display
  const formatDateForDisplay = (dateStr: string, options: Intl.DateTimeFormatOptions = {}): string => {
    const date = parseDateString(dateStr);
    return date.toLocaleDateString('en-GB', options);
  };

  // Get today's date as string
  const getTodayDateString = () => {
    return formatDateToString(new Date());
  };

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

  // FIXED: Corrected date range calculation
  const getDateRange = () => {
    const date = new Date(currentDate);
    let dateFrom, dateTo;

    if (viewMode === 'day') {
      dateFrom = dateTo = formatDateToString(date);
    } else if (viewMode === 'week') {
      // FIXED: Proper Monday-to-Sunday week calculation
      const currentDay = date.getDay();
      const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
      
      const monday = new Date(date);
      monday.setDate(date.getDate() - daysToMonday);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      dateFrom = formatDateToString(monday);
      dateTo = formatDateToString(sunday);
    } else {
      // Month view
      const year = date.getFullYear();
      const month = date.getMonth();
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      dateFrom = formatDateToString(firstDay);
      dateTo = formatDateToString(lastDay);
    }

    return { dateFrom, dateTo };
  };

  // FIXED: Corrected days calculation
  const getDaysForView = (): string[] => {
    if (viewMode === 'day') {
      return [formatDateToString(currentDate)];
    } else if (viewMode === 'week') {
      const { dateFrom } = getDateRange();
      const startDate = parseDateString(dateFrom);
      
      const days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push(formatDateToString(date));
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
        days.push(formatDateToString(date));
      }
      return days;
    }
  };

  // Get week start date for current view
  const getWeekStartDate = () => {
    if (viewMode !== 'week') return null;
    const { dateFrom } = getDateRange();
    return dateFrom;
  };

  // Get draft count for current week
  const getWeekDraftCount = () => {
    if (viewMode !== 'week') return 0;
    return timesheets.filter(ts => ts.status === 'draft').length;
  };

  // Get submitted count for current week
  const getWeekSubmittedCount = () => {
    if (viewMode !== 'week') return 0;
    return timesheets.filter(ts => ts.status === 'submitted').length;
  };

  // Submit entire week
  const submitWeek = async () => {
    const weekStartDate = getWeekStartDate();
    if (!weekStartDate) {
      showNotification('Week submission only available in week view', 'error');
      return;
    }

    const draftCount = getWeekDraftCount();
    if (draftCount === 0) {
      showNotification('No draft timesheets to submit for this week', 'error');
      return;
    }

    if (!confirm(`Submit ${draftCount} draft timesheet(s) for this week?`)) {
      return;
    }

    setSubmittingWeek(true);
    try {
      const res = await fetch(`${API_BASE}/timesheets/submit-week/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          week_start_date: weekStartDate,
          force_submit: false
        })
      });

      const data = await res.json();

      if (res.ok) {
        showNotification(`Week submitted successfully! ${data.submitted_count} timesheets submitted.`);
        loadData(); // Reload to show updated status
      } else {
        if (data.can_force_submit) {
          // Show warnings and ask if user wants to force submit
          const warningMsg = `Warnings found:\n${data.week_warnings?.join('\n') || ''}\n\nDo you want to submit anyway?`;
          if (confirm(warningMsg)) {
            // Retry with force_submit
            const forceRes = await fetch(`${API_BASE}/timesheets/submit-week/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                week_start_date: weekStartDate,
                force_submit: true
              })
            });

            if (forceRes.ok) {
              const forceData = await forceRes.json();
              showNotification(`Week submitted with warnings! ${forceData.submitted_count} timesheets submitted.`);
              loadData();
            } else {
              const forceError = await forceRes.json();
              showNotification(`Failed to submit week: ${forceError.error}`, 'error');
            }
          }
        } else {
          showNotification(`Failed to submit week: ${data.error}`, 'error');
        }
      }
    } catch (error) {
      showNotification('Failed to submit week: ' + error, 'error');
    } finally {
      setSubmittingWeek(false);
    }
  };

  const getTimesheetsForDate = (dateStr: string) => {
    return timesheets.filter(ts => ts.date === dateStr);
  };

  const getDayTotal = (dateStr: string) => {
    const dayTimesheets = getTimesheetsForDate(dateStr);
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

  // FIXED: Improved date header formatting
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
      const startDate = parseDateString(dateFrom);
      const endDate = parseDateString(dateTo);
      
      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
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
        showNotification('Timesheet draft created successfully');
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
  const weekDraftCount = getWeekDraftCount();
  const weekSubmittedCount = getWeekSubmittedCount();

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

          <div className="header-actions">
            <button className="add-btn" onClick={() => setShowForm(true)}>
              + 
            </button>
            
            {/* Weekly Submit Button - Only show in week view */}
            {viewMode === 'week' && (
              <button 
                className="submit-week-btn" 
                onClick={submitWeek}
                disabled={submittingWeek || weekDraftCount === 0}
                title={weekDraftCount === 0 ? 'No drafts to submit' : `Submit ${weekDraftCount} draft(s)`}
              >
                {submittingWeek ? (
                  'Submitting...'
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} />
                    Submit Week ({weekDraftCount})
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Week Summary - Only show in week view */}
        {/* {viewMode === 'week' && (
          <div className="week-summary">
            <span className="summary-item">
              <FontAwesomeIcon icon={faPen} style={{color: '#ffc107'}} />
              {weekDraftCount} Draft(s)
            </span>
            <span className="summary-item">
              <FontAwesomeIcon icon={faCheck} style={{color: '#28a745'}} />
              {weekSubmittedCount} Submitted
            </span>
            {weekDraftCount > 0 && (
              <span className="summary-warning">
                <FontAwesomeIcon icon={faExclamationTriangle} style={{color: '#dc3545'}} />
                Week not submitted yet
              </span>
            )}
          </div>
        )} */}

        {error && <div className="notification error">{error}</div>}
        {success && <div className="notification success">{success}</div>}

        <div className="weekly-calendar">
          {daysToShow.map((dateStr) => {
            const dayTimesheets = getTimesheetsForDate(dateStr);
            const dayTotal = getDayTotal(dateStr);
            
            // FIXED: Proper date display
            const displayDate = parseDateString(dateStr);
            const dayName = displayDate.toLocaleDateString('en-GB', { 
              weekday: 'long'
            });
            const monthDay = displayDate.toLocaleDateString('en-GB', { 
              month: 'short', 
              day: 'numeric',
              ...(viewMode === 'month' && { year: 'numeric' })
            });
            
            return (
              <div key={dateStr} className="day-row">
                <div className="day-header">
                  <div className="day-info">
                    <div className="day-name">{dayName}</div>
                    <div className="day-date">{monthDay}</div>
                    {/* Removed debug info - dates should now match */}
                  </div>
                  <div className="day-total">{dayTotal}h</div>
                </div>
                <div className="day-entries">
                  {dayTimesheets.map((timesheet) => (
                    <div key={timesheet.id} className="timesheet-entry">
                      <div className="entry-project">{timesheet.project_name}</div>
                      <div className="entry-activity">{timesheet.activity_type}</div>
                      <div className="entry-hours">{timesheet.hours_worked}h</div>
                      <div className="entry-status">
                        {timesheet.status === 'submitted' ? (
                          <span className="submitted-status">
                            <FontAwesomeIcon icon={faCheck} /> Submitted
                          </span>
                        ) : (
                          <span className="draft-status">
                            {/* <FontAwesomeIcon icon={faPen} /> Draft */}
                          </span>
                        )}
                      </div>
                      {/* Show stored date for verification - should match display now */}
                      <div className="entry-date-stored" style={{fontSize: '0.8em', color: '#666'}}>
                        Date: {timesheet.date}
                      </div>
                      <div className="entry-actions">
                        {timesheet.status !== 'submitted' && (
                          <>

                            <button onClick={() => deleteTimesheet(timesheet.id)} title="Delete">
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </>
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
            title="Create Timesheet Draft"
            submitText="Save as Draft"
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
            title="Edit Timesheet Draft"
            submitText="Update Draft"
          />
        )}
      </div>
    </div>
  );
}