import { useState, useEffect } from 'react';
import { api, Project, CurrentUser, Timesheet, TimesheetRow } from './Api';

export const useTimesheetLogic = () => {
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
      hasUnsavedChanges: false,
      isExistingTimesheet: false,
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

  // Check if there are unsaved changes
  const hasUnsavedChanges = rows.some(row => row.hasUnsavedChanges);

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
        const key = `${timesheet.project_name}-${timesheet.activity_type}`;
        if (!groupedData[key]) {
          const project = projects.find(p => p.name === timesheet.project_name);
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
          timesheetIds,
          hasUnsavedChanges: false,
          isExistingTimesheet: true, // Mark as existing timesheet
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
          hasUnsavedChanges: false,
          isExistingTimesheet: false,
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

  const updateRow = (id: string, field: keyof TimesheetRow, value: any) => {
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
  };

  // Check if a date is in the future (after today)
  const isDateEditable = (date: Date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today
    return date <= today; // Can edit today and past dates, not future
  };

  // Check if a specific row and day can be edited
  const canEditHours = (row: TimesheetRow, dayIndex: number) => {
    const dateForThisColumn = weekDates[dayIndex];
    const isFutureDate = !isDateEditable(dateForThisColumn);
    const hasExistingData = row.timesheetIds[dayIndex] !== null;
    
    // Cannot edit if it's future date OR if there's existing timesheet data
    return !isFutureDate && !hasExistingData;
  };

  // Updated updateHour function - only allow editing new entries
  const updateHour = (id: string, dayIndex: number, value: number) => {
    const row = rows.find(r => r.id === id);
    if (!row || !canEditHours(row, dayIndex)) {
      if (row?.timesheetIds[dayIndex] !== null) {
        setError('Cannot edit existing timesheet entries.');
      } else {
        setError('Cannot edit timesheets for future dates.');
      }
      return;
    }

    // Validate input
    if (value < 0) value = 0;
    if (value > 24) value = 24;
    
    // Round to nearest 0.25
    value = Math.round(value * 4) / 4;

    // Update local state only - no API calls
    const updated = rows.map((r) => {
      if (r.id === id) {
        const newHours = [...r.hours];
        const oldValue = newHours[dayIndex];
        newHours[dayIndex] = value;
        
        const updatedRow = { 
          ...r, 
          hours: newHours,
          total: newHours.reduce((sum, h) => sum + h, 0),
          hasUnsavedChanges: oldValue !== value || r.hasUnsavedChanges
        };
        
        return updatedRow;
      }
      return r;
    });
    
    setRows(updated);
    setError(''); // Clear any existing errors
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
      hasUnsavedChanges: false,
      isExistingTimesheet: false, // New row is not existing
    };
    setRows([...rows, newRow]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(rows.filter(row => row.id !== id));
  };

  // Submit function to save all changes to backend
  const submitTimesheet = async () => {
    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    // Validate that we have rows with valid data before submitting
    const validRows = rows.filter(row => 
      row.hasUnsavedChanges && 
      row.projectId && 
      row.activity &&
      row.hours.some(h => h > 0)
    );

    if (validRows.length === 0) {
      setError('No valid timesheet entries to submit');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      for (const row of validRows) {
        console.log('Processing row:', {
          id: row.id,
          projectId: row.projectId,
          activity: row.activity,
          hours: row.hours
        });

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
          const hours = row.hours[dayIndex];
          const timesheetId = row.timesheetIds[dayIndex];
          const date = weekDates[dayIndex].toISOString().split('T')[0];

          // Only process new entries (where timesheetId is null) and hours > 0
          if (timesheetId === null && hours > 0) {
            const timesheetData = {
              employee_id: currentUser.employee_id,
              project: row.projectId,
              activity_type: row.activity,
              date: date,
              hours_worked: hours.toString(),
              description: ''
            };

            console.log('Creating timesheet entry:', timesheetData);

            try {
              const result = await api.createTimesheet(timesheetData);
              console.log('Created timesheet:', result);
              
              if (result.timesheet) {
                row.timesheetIds[dayIndex] = result.timesheet.id;
              } else if (result.id) {
                // Sometimes the API might return the timesheet directly
                row.timesheetIds[dayIndex] = result.id;
              }
            } catch (dayError: any) {
              console.error(`Failed to create timesheet for ${date}:`, dayError);
              throw new Error(`Failed to save timesheet for ${date}: ${dayError.message}`);
            }
          }
        }

        // Mark as saved and as existing timesheet
        row.hasUnsavedChanges = false;
        row.isExistingTimesheet = true;
      }

      // Update state to reflect saved status
      setRows([...rows]);
      setError('');
      
      // Show success message
      setTimeout(() => {
        const successMsg = document.createElement('div');
        successMsg.textContent = 'Timesheet saved successfully!';
        successMsg.style.cssText = `
          position: fixed; top: 80px; right: 20px; background: #d4edda; 
          color: #155724; padding: 15px; border-radius: 5px; z-index: 1000;
        `;
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      }, 100);

    } catch (error: any) {
      console.error('Error submitting timesheet:', error);
      setError(error.message || 'Failed to save timesheet');
    } finally {
      setIsSubmitting(false);
    }
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

  return {
    // State
    currentUser,
    projects,
    activities,
    loading,
    error,
    rows,
    weekStartDate,
    comments,
    isSubmitting,
    regularHours,
    overtimeHours,
    billableHours,
    nonBillableHours,
    totalHours,
    isAdmin,
    hasUnsavedChanges,
    weekDates,
    dayNames,
    
    // Functions
    setError,
    updateRow,
    isDateEditable,
    canEditHours,
    updateHour,
    addRow,
    removeRow,
    submitTimesheet,
    navigateWeek,
    formatWeekRange
  };
};