"use client";

import React, { useState, useEffect, useCallback } from 'react';
import './page.css';
import UserSidebar from './components/UserSidebar';
import ViewControls from './components/ViewControls';
import TimesheetForm from './components/TimesheetForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faCheck } from '@fortawesome/free-solid-svg-icons';

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

interface TimesheetFormData {
  employee_id: string;
  project: number;
  activity_type: string;
  date: string;
  hours_worked: string;
  description: string;
}

type ViewMode = 'day' | 'week' | 'month';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// 🧪 CORS TEST COMPONENT - ADD THIS
function CORSTestComponent() {
  const [testResult, setTestResult] = useState('Not tested yet');
  const [loading, setLoading] = useState(false);

  const testCORS = async () => {
    setLoading(true);
    setTestResult('Testing...');

    try {
      const response = await fetch('https://timesheets-backend-sdmk.onrender.com/api/auth/cors-test/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'frontend-cors-test', timestamp: new Date().toISOString() })
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ SUCCESS: ${JSON.stringify(data, null, 2)}`);
        console.log('✅ CORS Test Success:', data);
      } else {
        setTestResult(`❌ HTTP ERROR: ${response.status} ${response.statusText}`);
        console.error('❌ CORS Test HTTP Error:', response.status);
      }
    } catch (error) {
      setTestResult(`❌ NETWORK ERROR: ${error}`);
      console.error('❌ CORS Test Network Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '2px solid #333',
      borderRadius: '8px',
      padding: '15px',
      maxWidth: '400px',
      maxHeight: '300px',
      overflow: 'auto',
      zIndex: 9999,
      fontSize: '12px',
      fontFamily: 'monospace'
    }}>
      <h4>CORS Test</h4>
      <button 
        onClick={testCORS} 
        disabled={loading}
        style={{
          background: '#007bff',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '10px'
        }}
      >
        {loading ? 'Testing...' : 'Test CORS'}
      </button>
      <pre style={{ 
        whiteSpace: 'pre-wrap', 
        wordBreak: 'break-word',
        background: '#f5f5f5',
        padding: '8px',
        borderRadius: '4px',
        margin: 0
      }}>
        {testResult}
      </pre>
    </div>
  );
}

// ✅ Helper function for consistent API calls with logging
const makeAPICall = async (url: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  console.log(`🔗 API Call: ${options.method || 'GET'} ${url}`);
  console.log('🍪 Cookies being sent:', document.cookie);
  
  try {
    const response = await fetch(url, mergedOptions);
    console.log(`📡 API Response: ${response.status} for ${url}`);
    console.log('📡 Response headers:', [...response.headers.entries()]);
    
    return response;
  } catch (error) {
    console.error(`💥 API Error for ${url}:`, error);
    throw error;
  }
};

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

  // Helper function to create date string in YYYY-MM-DD format
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to parse date string back to Date object
  const parseDateString = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Get today's date as string
  const getTodayDateString = () => {
    return formatDateToString(new Date());
  };

  // Corrected date range calculation
  const getDateRange = useCallback(() => {
    const date = new Date(currentDate);
    let dateFrom, dateTo;

    if (viewMode === 'day') {
      dateFrom = dateTo = formatDateToString(date);
    } else if (viewMode === 'week') {
      // Proper Monday-to-Sunday week calculation
      const currentDay = date.getDay();
      const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
      
      const monday = new Date(date);
      monday.setDate(date.getDate() - daysToMonday);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      dateFrom = formatDateToString(monday);
      dateTo = formatDateToString(sunday);
    } else {
      // Month view - extend to cover full calendar grid (6 weeks)
      const year = date.getFullYear();
      const month = date.getMonth();
      
      // First day of the month
      const firstDayOfMonth = new Date(year, month, 1);
      
      // Last day of the month
      const lastDayOfMonth = new Date(year, month + 1, 0);
      
      // Find the Monday of the week containing the first day
      const firstDayWeekday = firstDayOfMonth.getDay();
      const daysToFirstMonday = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
      const calendarStart = new Date(firstDayOfMonth);
      calendarStart.setDate(firstDayOfMonth.getDate() - daysToFirstMonday);
      
      // Find the Sunday of the week containing the last day
      const lastDayWeekday = lastDayOfMonth.getDay();
      const daysToLastSunday = lastDayWeekday === 0 ? 0 : 7 - lastDayWeekday;
      const calendarEnd = new Date(lastDayOfMonth);
      calendarEnd.setDate(lastDayOfMonth.getDate() + daysToLastSunday);
      
      dateFrom = formatDateToString(calendarStart);
      dateTo = formatDateToString(calendarEnd);
    }

    return { dateFrom, dateTo };
  }, [currentDate, viewMode]);

  // ✅ FIXED: Enhanced loadData with proper error handling and logging
  const loadData = useCallback(async () => {
    console.log('📊 MainPage: Starting data load...');
    console.log('🍪 MainPage: Current cookies:', document.cookie);
    
    try {
      if (!user) {
        console.log('👤 MainPage: Loading user data...');
        
        try {
          const userRes = await makeAPICall(`${API_BASE}/timesheets/current-user/`);
          
          if (userRes.ok) {
            const userData = await userRes.json();
            console.log('✅ MainPage: User data loaded:', userData);
            setUser(userData);
          } else {
            console.log('❌ MainPage: Failed to load user data - Status:', userRes.status);
            const errorText = await userRes.text();
            console.log('❌ MainPage: User API error response:', errorText);
          }
        } catch (userError) {
          console.error('💥 MainPage: User API call failed:', userError);
        }

        console.log('🏗️ MainPage: Loading projects...');
        
        try {
          const projectsRes = await makeAPICall(`${API_BASE}/projects/active/`);
          
          if (projectsRes.ok) {
            const projectsData = await projectsRes.json();
            console.log('✅ MainPage: Projects loaded:', projectsData);
            setProjects(projectsData.projects || []);
          } else {
            console.log('❌ MainPage: Failed to load projects - Status:', projectsRes.status);
            const errorText = await projectsRes.text();
            console.log('❌ MainPage: Projects API error response:', errorText);
          }
        } catch (projectsError) {
          console.error('💥 MainPage: Projects API call failed:', projectsError);
        }
      }

      console.log('📅 MainPage: Loading timesheets...');
      const { dateFrom, dateTo } = getDateRange();
      console.log('📅 MainPage: Date range:', { dateFrom, dateTo });
      
      const timesheetUrl = `${API_BASE}/timesheets/my-timesheets/?date_from=${dateFrom}&date_to=${dateTo}`;
      console.log('🔗 MainPage: Timesheet URL:', timesheetUrl);
      
      try {
        const timesheetRes = await makeAPICall(timesheetUrl);
        
        if (timesheetRes.ok) {
          const timesheetData = await timesheetRes.json();
          console.log('✅ MainPage: Timesheets loaded:', timesheetData);
          setTimesheets(timesheetData.timesheets || []);
        } else {
          console.log('❌ MainPage: Failed to load timesheets - Status:', timesheetRes.status);
          const errorText = await timesheetRes.text();
          console.log('❌ MainPage: Timesheets API error response:', errorText);
        }
      } catch (timesheetError) {
        console.error('💥 MainPage: Timesheets API call failed:', timesheetError);
      }

    } catch (error) {
      console.error('💥 MainPage: Failed to load data:', error);
    } finally {
      console.log('✅ MainPage: Data load complete');
      setLoading(false);
    }
  }, [user, getDateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get calendar grid for month view (6 weeks x 7 days = 42 days)
  const getMonthCalendarGrid = (): Array<Array<{ date: string; isCurrentMonth: boolean; isToday: boolean }>> => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = getTodayDateString();
    
    // First day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    
    // Find the Monday of the week containing the first day
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysToFirstMonday = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
    const calendarStart = new Date(firstDayOfMonth);
    calendarStart.setDate(firstDayOfMonth.getDate() - daysToFirstMonday);
    
    const weeks = [];
    const currentCalendarDate = new Date(calendarStart);
    
    // Generate 6 weeks
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      
      // Generate 7 days for each week
      for (let day = 0; day < 7; day++) {
        const dateStr = formatDateToString(currentCalendarDate);
        const isCurrentMonth = currentCalendarDate.getMonth() === month;
        const isToday = dateStr === today;
        
        weekDays.push({
          date: dateStr,
          isCurrentMonth,
          isToday
        });
        
        currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
      }
      
      weeks.push(weekDays);
    }
    
    return weeks;
  };

  // Corrected days calculation
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
      // Month view - return all dates in the calendar grid
      const grid = getMonthCalendarGrid();
      return grid.flat().map(day => day.date);
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

  // ✅ FIXED: Submit entire week with proper API call
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
      const res = await makeAPICall(`${API_BASE}/timesheets/submit-week/`, {
        method: 'POST',
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
            const forceRes = await makeAPICall(`${API_BASE}/timesheets/submit-week/`, {
              method: 'POST',
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
      console.error('💥 Submit week error:', error);
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

  // Improved date header formatting
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

  // ✅ FIXED: Load activities with proper API call
  const loadActivities = async (projectId: number) => {
    try {
      console.log('🎯 Loading activities for project:', projectId);
      const res = await makeAPICall(`${API_BASE}/timesheets/project/${projectId}/activities/`);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Activities loaded:', data);
        setActivities(data.activity_types || []);
      } else {
        console.log('❌ Failed to load activities');
        const errorText = await res.text();
        console.log('❌ Activities error:', errorText);
      }
    } catch (error) {
      console.error('💥 Failed to load activities:', error);
    }
  };

  const showNotification = (message: string, type = 'success') => {
    console.log(`📢 Notification (${type}):`, message);
    if (type === 'success') setSuccess(message);
    else setError(message);
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  // ✅ FIXED: Edit timesheet with proper API call
  const editTimesheet = async (id: number, data: TimesheetFormData) => {
    try {
      console.log('✏️ Editing timesheet:', id, data);
      const res = await makeAPICall(`${API_BASE}/timesheets/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        showNotification('Timesheet updated successfully');
        loadData();
        setEditingTimesheet(null);
      } else {
        const errorData = await res.json();
        console.log('❌ Edit timesheet error:', errorData);
        showNotification('Failed to update timesheet', 'error');
      }
    } catch (error) {
      console.error('💥 Edit timesheet error:', error);
      showNotification('Failed to update timesheet', 'error');
    }
  };

  // ✅ FIXED: Delete timesheet with proper API call
  const deleteTimesheet = async (id: number) => {
    if (!confirm('Delete this timesheet?')) return;
    
    try {
      console.log('🗑️ Deleting timesheet:', id);
      const res = await makeAPICall(`${API_BASE}/timesheets/${id}/`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        showNotification('Timesheet deleted successfully');
        loadData();
      } else {
        const errorData = await res.text();
        console.log('❌ Delete timesheet error:', errorData);
        showNotification('Failed to delete timesheet', 'error');
      }
    } catch (error) {
      console.error('💥 Delete timesheet error:', error);
      showNotification('Failed to delete timesheet', 'error');
    }
  };

  // ✅ FIXED: Create timesheet with proper API call
  const createTimesheet = async (formData: FormData) => {
    if (!user) {
      console.log('❌ No user found for timesheet creation');
      return;
    }
    
    setCreating(true);
    
    try {
      const data: TimesheetFormData = {
        employee_id: user.employee_id,
        project: parseInt(formData.get('project') as string),
        activity_type: formData.get('activity_type') as string,
        date: formData.get('date') as string,
        hours_worked: formData.get('hours_worked') as string,
        description: formData.get('description') as string || ''
      };

      console.log('📝 Creating timesheet:', data);

      const res = await makeAPICall(`${API_BASE}/timesheets/`, {
        method: 'POST',
        body: JSON.stringify(data)
      });

      if (res.ok) {
        setShowForm(false);
        showNotification('Timesheet draft created successfully');
        loadData();
      } else {
        const errorData = await res.json();
        console.log('❌ Create timesheet error:', errorData);
        showNotification('Failed to create timesheet: ' + (errorData.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('💥 Create timesheet error:', error);
      showNotification('Failed to create timesheet: ' + error, 'error');
    } finally {
      setCreating(false);
    }
  };


  // Render monthly calendar view like Google Calendar
  const renderMonthlyView = () => {
    const calendarGrid = getMonthCalendarGrid();
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div className="monthly-calendar">
        {/* Weekday headers */}
        <div className="calendar-header">
          {weekdays.map(day => (
            <div key={day} className="weekday-header">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="calendar-grid">
          {calendarGrid.map((week, weekIndex) => (
            week.map((day, dayIndex) => {
              const dayTimesheets = getTimesheetsForDate(day.date);
              const dayTotal = getDayTotal(day.date);
              const displayDate = parseDateString(day.date);

              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''}`}
                >
                  <div className="calendar-day-header">
                    <span className="calendar-day-number">
                      {displayDate.getDate()}
                    </span>
                    {dayTotal > 0 && (
                      <span className="calendar-day-total">
                        {dayTotal}h
                      </span>
                    )}
                  </div>

                  <div className="calendar-day-entries">
                    {dayTimesheets.slice(0, 3).map((timesheet) => (
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
                    
                    {dayTimesheets.length > 3 && (
                      <div className="more-entries">
                        +{dayTimesheets.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ))}
        </div>
      </div>
    );
  };

  // Render weekly view (existing logic)
  const renderWeeklyView = () => {
    const daysToShow = getDaysForView();

    return (
      <div className="weekly-calendar">
        {daysToShow.map((dateStr) => {
          const dayTimesheets = getTimesheetsForDate(dateStr);
          const dayTotal = getDayTotal(dateStr);
          
          // Proper date display
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
                        <span className="draft">
                          {/* <FontAwesomeIcon icon={faPen} /> Draft */}
                        </span>
                      )}
                    </div>
                    <div className="entry-date-stored">
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
    );
  };

  if (loading) {
    console.log('⏳ MainPage: Showing loading state');
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    console.log('🚫 MainPage: No user found, showing login prompt');
    return (
      <div className="container">
        <h2>Please log in</h2>
        <button onClick={() => window.location.href = '/login'}>Login</button>
      </div>
    );
  }

  console.log('✅ MainPage: Rendering main page for user:', user);
  
  const isAdmin = user.role === 'admin' || user.role === 'manager';
  const weekDraftCount = getWeekDraftCount();

  return (
    <div className="app">
      {/* 🧪 ADD CORS TEST COMPONENT HERE - TEMPORARY */}
      <CORSTestComponent />
      
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

        {error && <div className="notification error">{error}</div>}
        {success && <div className="notification success">{success}</div>}

        {/* Render different views based on viewMode */}
        {viewMode === 'month' ? renderMonthlyView() : renderWeeklyView()}

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