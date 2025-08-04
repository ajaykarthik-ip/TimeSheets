// data/hardcodedData.ts

export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  managerId: number | null;
  role: 'admin' | 'employee';
  status: 'active' | 'inactive';
}

export interface Project {
  id: number;
  code: string;
  name: string;
  billable: boolean;
  status: 'active' | 'inactive';
}

export interface Activity {
  id: number;
  name: string;
  status: 'active' | 'inactive';
}

export interface Timesheet {
  id: number;
  employeeId: number;
  employeeName: string;
  weekEnding: string;
  hours: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
}

export interface Manager {
  id: number;
  name: string;
}

export const employees: Employee[] = [
  { id: 1, name: 'John Smith', email: 'john@company.com', department: 'Development', managerId: 2, role: 'employee', status: 'active' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah@company.com', department: 'Development', managerId: null, role: 'admin', status: 'active' },
  { id: 3, name: 'Mike Davis', email: 'mike@company.com', department: 'Design', managerId: 2, role: 'employee', status: 'active' },
  { id: 4, name: 'Lisa Wilson', email: 'lisa@company.com', department: 'Testing', managerId: 2, role: 'employee', status: 'active' },
];

export const projects: Project[] = [
  { id: 1, code: 'PRJ001', name: 'Client A - Website Redesign', billable: true, status: 'active' },
  { id: 2, code: 'PRJ002', name: 'Client B - Mobile App', billable: true, status: 'active' },
  { id: 3, code: 'PRJ003', name: 'Client C - Database Migration', billable: true, status: 'active' },
  { id: 4, code: 'INT001', name: 'Internal - Training', billable: false, status: 'active' },
  { id: 5, code: 'INT002', name: 'Internal - Meetings', billable: false, status: 'active' },
  { id: 6, code: 'ADM001', name: 'Administrative Tasks', billable: false, status: 'active' },
];

export const activities: Activity[] = [
  { id: 1, name: 'Development', status: 'active' },
  { id: 2, name: 'Testing', status: 'active' },
  { id: 3, name: 'Documentation', status: 'active' },
  { id: 4, name: 'Code Review', status: 'active' },
  { id: 5, name: 'Meeting', status: 'active' },
  { id: 6, name: 'Planning', status: 'active' },
  { id: 7, name: 'Research', status: 'active' },
  { id: 8, name: 'Bug Fixing', status: 'active' },
  { id: 9, name: 'Deployment', status: 'active' },
  { id: 10, name: 'Training', status: 'active' },
];

export const timesheets: Timesheet[] = [
  { id: 1, employeeId: 1, employeeName: 'John Smith', weekEnding: '2024-08-10', hours: 40, status: 'pending', submittedDate: '2024-08-10' },
  { id: 2, employeeId: 3, employeeName: 'Mike Davis', weekEnding: '2024-08-10', hours: 38, status: 'pending', submittedDate: '2024-08-10' },
  { id: 3, employeeId: 4, employeeName: 'Lisa Wilson', weekEnding: '2024-08-03', hours: 40, status: 'approved', submittedDate: '2024-08-03' },
  { id: 4, employeeId: 1, employeeName: 'John Smith', weekEnding: '2024-08-03', hours: 42, status: 'approved', submittedDate: '2024-08-03' },
];

// Helper functions
export const getManagers = (): Manager[] => {
  return employees
    .filter(emp => emp.role === 'admin' || emp.managerId === null)
    .map(emp => ({ id: emp.id, name: emp.name }));
};

// CRUD Functions for Employees
export const addEmployee = (employee: Omit<Employee, 'id'>): Employee => {
  const newId = Math.max(...employees.map(e => e.id)) + 1;
  const newEmployee = { ...employee, id: newId };
  employees.push(newEmployee);
  return newEmployee;
};

export const updateEmployee = (id: number, updates: Partial<Omit<Employee, 'id'>>): Employee | null => {
  const index = employees.findIndex(e => e.id === id);
  if (index !== -1) {
    employees[index] = { ...employees[index], ...updates };
    return employees[index];
  }
  return null;
};

export const deleteEmployee = (id: number): void => {
  const index = employees.findIndex(e => e.id === id);
  if (index !== -1) {
    employees.splice(index, 1);
  }
};

// CRUD Functions for Projects
export const addProject = (project: Omit<Project, 'id'>): Project => {
  const newId = Math.max(...projects.map(p => p.id)) + 1;
  const newProject = { ...project, id: newId };
  projects.push(newProject);
  return newProject;
};

export const updateProject = (id: number, updates: Partial<Omit<Project, 'id'>>): Project | null => {
  const index = projects.findIndex(p => p.id === id);
  if (index !== -1) {
    projects[index] = { ...projects[index], ...updates };
    return projects[index];
  }
  return null;
};

export const deleteProject = (id: number): void => {
  const index = projects.findIndex(p => p.id === id);
  if (index !== -1) {
    projects.splice(index, 1);
  }
};

// CRUD Functions for Activities
export const addActivity = (activity: Omit<Activity, 'id'>): Activity => {
  const newId = Math.max(...activities.map(a => a.id)) + 1;
  const newActivity = { ...activity, id: newId };
  activities.push(newActivity);
  return newActivity;
};

export const updateActivity = (id: number, updates: Partial<Omit<Activity, 'id'>>): Activity | null => {
  const index = activities.findIndex(a => a.id === id);
  if (index !== -1) {
    activities[index] = { ...activities[index], ...updates };
    return activities[index];
  }
  return null;
};

export const deleteActivity = (id: number): void => {
  const index = activities.findIndex(a => a.id === id);
  if (index !== -1) {
    activities.splice(index, 1);
  }
};

// CRUD Functions for Timesheets
export const updateTimesheetStatus = (id: number, status: 'pending' | 'approved' | 'rejected'): Timesheet | null => {
  const index = timesheets.findIndex(t => t.id === id);
  if (index !== -1) {
    timesheets[index].status = status;
    return timesheets[index];
  }
  return null;
};