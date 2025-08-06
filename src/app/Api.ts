// api.ts - API Service Layer
export interface Project {
  id: number;
  name: string;
  billable: boolean;
}

export interface CurrentUser {
  employee_id: string;
  employee_name: string;
  department: string;
  role: string;
  is_active: boolean;
}

export interface Timesheet {
  id: number;
  project: number;
  project_name: string;
  activity_type: string;
  date: string;
  hours_worked: string;
  description?: string;
}

export type TimesheetRow = {
  id: string;
  projectId: number;
  projectName: string;
  activity: string;
  billable: boolean;
  hours: number[];
  total: number;
  timesheetIds: (number | null)[];
  hasUnsavedChanges: boolean;
  isExistingTimesheet: boolean;
}

const BASE_URL = 'http://localhost:8000/api';

export const api = {
  async getCurrentUser(): Promise<CurrentUser> {
    const response = await fetch(`${BASE_URL}/timesheets/current-user/`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Not authenticated');
    return response.json();
  },

  async getProjects(): Promise<{ projects: Project[] }> {
    const response = await fetch(`${BASE_URL}/projects/active/`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  },

  async getProjectActivities(projectId: number): Promise<{ activity_types: string[] }> {
    const response = await fetch(`${BASE_URL}/timesheets/project/${projectId}/activities/`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch activities');
    return response.json();
  },

  async getMyTimesheets(params: Record<string, string> = {}): Promise<{ timesheets: Timesheet[] }> {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${BASE_URL}/timesheets/my-timesheets/?${queryString}`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch timesheets');
    return response.json();
  },

  async createTimesheet(data: any): Promise<any> {
    console.log('Creating timesheet with data:', data);
    const response = await fetch(`${BASE_URL}/timesheets/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    
    let result;
    try {
      result = await response.json();
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log('API Response:', { status: response.status, result });
    
    if (!response.ok) {
      const errorMessage = result.error || result.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error('API Error:', errorMessage, result);
      throw new Error(errorMessage);
    }
    return result;
  },

  async updateTimesheet(id: number, data: any): Promise<any> {
    const response = await fetch(`${BASE_URL}/timesheets/${id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to update timesheet');
    return result;
  },

  async deleteTimesheet(id: number): Promise<{ message: string }> {
    const response = await fetch(`${BASE_URL}/timesheets/${id}/`, {
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