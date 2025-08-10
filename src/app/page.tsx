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

type ViewMode = 'week' | 'month';

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

  const [submittingWeek, setSubmittingWeek] = useState(false);

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

    if (viewMode === 'week') {
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
    if (viewMode === 'week') {
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
      // Month view - Get all days including prev/next month for calendar grid
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Get first day of month and what day of week it is
      const firstDay = new Date(year, month, 1);
      const firstDayOfWeek = firstDay.getDay();
      
      // Start from Monday of the week containing the first day
      const startDate = new Date(firstDay);
      startDate.setDate(firstDay.getDate() - (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1));
      
      // Generate 42 days (6 weeks) for calendar grid
      const days = [];
      for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        days.push(date);
      }
      return days;
    }
  };

  const getWeekStartDate = () => {
    if (viewMode !== 'week') return null;
    const { dateFrom } = getDateRange();
    return dateFrom;
  };

  const getWeekDraftCount = () => {
    if (viewMode !== 'week') return 0;
    return timesheets.filter(ts => ts.status === 'draft').length;
  };

  const getWeekSubmittedCount = () => {
    if (viewMode !== 'week') return 0;
    return timesheets.filter(ts => ts.status === 'submitted').length;
  };

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
        loadData();
      } else {
        if (data.can_force_submit) {
          const warningMsg = `Warnings found:\n${data.week_warnings?.join('\n') || ''}\n\nDo you want to submit anyway?`;
          if (confirm(warningMsg)) {
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
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const formatDateHeader = () => {
    if (viewMode === 'week') {
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



  // Helper function to check if date is in current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
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

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

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
            onViewModeChange={handleViewModeChange} 
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

        {viewMode === 'week' ? (
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
                        <div className="entry-status">
                          {timesheet.status === 'submitted' ? (
                            <span className="submitted-status">
                              <FontAwesomeIcon icon={faCheck} /> Submitted
                            </span>
                          ) : (
                            <span className="draft-status">
                              <FontAwesomeIcon icon={faPen} /> Draft
                            </span>
                          )}
                        </div>
                        <div className="entry-actions">
                          {timesheet.status !== 'submitted' && (
                            <button onClick={() => deleteTimesheet(timesheet.id)} title="Delete">
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="monthly-calendar">
            <div className="calendar-header">
              <div className="weekday-header">Mon</div>
              <div className="weekday-header">Tue</div>
              <div className="weekday-header">Wed</div>
              <div className="weekday-header">Thu</div>
              <div className="weekday-header">Fri</div>
              <div className="weekday-header">Sat</div>
              <div className="weekday-header">Sun</div>
            </div>
            <div className="calendar-grid">
              {daysToShow.map((date) => {
                const dayTimesheets = getTimesheetsForDate(date);
                const dayTotal = getDayTotal(date);
                const isOtherMonth = !isCurrentMonth(date);
                
                function setEditingTimesheet(timesheet: Timesheet): void {
                  throw new Error('Function not implemented.');
                }

                return (
                  <div 
                    key={date.toISOString()} 
                    className={`calendar-day ${isOtherMonth ? 'other-month' : ''}`}
                  >
                    <div className="calendar-day-header">
                      <span className="calendar-day-number">{date.getDate()}</span>
                      {dayTotal > 0 && (
                        <span className="calendar-day-total">{dayTotal}h</span>
                      )}
                    </div>
                    <div className="calendar-day-entries">
                      {dayTimesheets.slice(0, 2).map((timesheet) => (
                        <div 
                          key={timesheet.id} 
                          className={`calendar-entry ${timesheet.status === 'submitted' ? 'submitted' : 'draft'}`}
                          onClick={() => setEditingTimesheet(timesheet)}
                          title={`${timesheet.project_name} - ${timesheet.activity_type} (${timesheet.hours_worked}h)`}
                        >
                          <span className="entry-text">
                            {timesheet.project_name} ({timesheet.hours_worked}h)
                          </span>
                        </div>
                      ))}
                      {dayTimesheets.length > 2 && (
                        <div className="more-entries">
                          +{dayTimesheets.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
      </div>
    </div>
  );
}