"use client";

import { useState, useEffect, useCallback } from 'react';

// Types
interface Employee {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  hire_date: string;
  is_active: boolean;
  hourly_rate?: string;
  manager?: number | null;
  manager_name?: string | null;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

interface Manager {
  id: number;
  employee_id: string;
  full_name: string;
}

interface EmployeeChoices {
  roles: { [key: string]: string };
  departments: { [key: string]: string };
}

interface SubmitData {
  employee_id?: string;
  username?: string;
  password?: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department: string;
  hire_date: string;
  is_active: boolean;
}

// Initial form state
const initialFormData = {
  employee_id: '',
  username: '',
  password: '',
  first_name: '',
  last_name: '',
  email: '',
  role: '',
  department: '',
  hire_date: '',
  is_active: true
};

export default function AdminEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [choices, setChoices] = useState<EmployeeChoices>({ roles: {}, departments: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(initialFormData);

  // API Base URL
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ||'http://localhost:8000/api';

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/employees/`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (err) {
      setError('Failed to load employees');
      console.error(err);
    }
  }, [API_BASE]);

  // Fetch managers (keeping for future use)
  const fetchManagers = useCallback(async (): Promise<Manager[]> => {
    try {
      const response = await fetch(`${API_BASE}/employees/managers/`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch managers');
      const data = await response.json();
      return data.managers || [];
    } catch (err) {
      console.error('Failed to load managers:', err);
      return [];
    }
  }, [API_BASE]);

  // Fetch choices
  const fetchChoices = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/employees/choices/`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch choices');
      const data = await response.json();
      setChoices(data);
    } catch (err) {
      console.error('Failed to load choices:', err);
    }
  }, [API_BASE]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchEmployees(),
        fetchManagers(), // Keep this call for future use
        fetchChoices()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchEmployees, fetchManagers, fetchChoices]);

  // Filter employees
  const filteredEmployees = employees.filter(emp => 
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const submitData: SubmitData = {
        ...formData,
        is_active: formData.is_active
      };

      if (!formData.employee_id) {
        delete submitData.employee_id;
      }

      let response;
      if (editingEmployee) {
        if (!submitData.username) delete submitData.username;
        if (!submitData.password) delete submitData.password;
        
        response = await fetch(`${API_BASE}/employees/${editingEmployee.id}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(submitData)
        });
      } else {
        response = await fetch(`${API_BASE}/employees/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(submitData)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save employee');
      }

      await fetchEmployees();
      // Refresh managers if needed in the future
      await fetchManagers();
      resetForm();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({ ...initialFormData });
    setShowForm(false);
    setEditingEmployee(null);
    setError('');
  };

  // Handle edit
  const handleEdit = (employee: Employee) => {
    console.log('Editing employee:', employee); // Debug log
    setEditingEmployee(employee);
    
    // Parse full_name into first_name and last_name if they don't exist separately
    let firstName = employee.first_name || '';
    let lastName = employee.last_name || '';
    
    if (!firstName && !lastName && employee.full_name) {
      const nameParts = employee.full_name.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }
    
    const newFormData = {
      employee_id: employee.employee_id || '',
      username: '', // Only used for new employees
      password: '', // Only used for new employees
      first_name: firstName,
      last_name: lastName,
      email: employee.email || '',
      role: employee.role || '',
      department: employee.department || '',
      hire_date: employee.hire_date || '',
      is_active: employee.is_active ?? true
    };
    
    console.log('Setting form data:', newFormData); // Debug log
    setFormData(newFormData);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Are you sure you want to delete ${employee.full_name}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/employees/${employee.id}/`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      await fetchEmployees();
      await fetchManagers();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete employee');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading employees...</div>;
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Employee Management</h1>
        <p>Add, edit, and manage employees</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="actions">
        <input
          type="text"
          placeholder="Search employees..."
          className="search-box"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          Add Employee
        </button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.employee_id}</td>
              <td>{employee.full_name}</td>
              <td>{employee.email}</td>
              <td>{choices.departments[employee.department] || employee.department}</td>
              <td>
                <span className={`status-badge status-${employee.role}`}>
                  {choices.roles[employee.role] || employee.role.toUpperCase()}
                </span>
              </td>
              <td>
                <span className={`status-badge ${employee.is_active ? 'status-active' : 'status-inactive'}`}>
                  {employee.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </td>
              <td>
                <button 
                  className="btn btn-warning"
                  onClick={() => handleEdit(employee)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDelete(employee)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredEmployees.length === 0 && !loading && (
        <div className="empty-state">
          No employees found.
        </div>
      )}

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h2>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {!editingEmployee && (
                <>
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder="Enter username"
                    />
                  </div>

                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      minLength={8}
                      placeholder="Enter password (min 8 characters)"
                    />
                  </div>
                </>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="">Select Role</option>
                    {Object.entries(choices.roles).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department *</label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  >
                    <option value="">Select Department</option>
                    {Object.entries(choices.departments).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Hire Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.hire_date}
                    onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button type="button" className="btn" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingEmployee ? 'Update' : 'Add'} Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}