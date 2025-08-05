"use client";

import { useState, useEffect } from 'react';

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

export default function AdminEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [choices, setChoices] = useState<EmployeeChoices>({ roles: {}, departments: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    employee_id: '', // Optional - will be auto-generated if not provided
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    department: '',
    hire_date: '',
    is_active: true
  });

  // API Base URL
  const API_BASE = 'http://localhost:8000/api';

  // Fetch employees
  const fetchEmployees = async () => {
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
  };

  // Fetch managers
  const fetchManagers = async () => {
    try {
      const response = await fetch(`${API_BASE}/employees/managers/`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch managers');
      const data = await response.json();
      setManagers(data.managers || []);
    } catch (err) {
      console.error('Failed to load managers:', err);
    }
  };

  // Fetch choices
  const fetchChoices = async () => {
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
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchEmployees(),
        fetchManagers(),
        fetchChoices()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

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
      // Prepare data - remove empty employee_id for auto-generation
      const submitData: any = {
        ...formData,
        is_active: formData.is_active
      };

      // Remove employee_id if empty (for auto-generation)
      if (!formData.employee_id) {
        delete submitData.employee_id;
      }

      let response;
      if (editingEmployee) {
        // Update employee - remove username/password if empty
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
        // Create new employee
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

      // Refresh data
      await fetchEmployees();
      await fetchManagers(); // Refresh managers in case role changed
      resetForm();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
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
    });
    setShowForm(false);
    setEditingEmployee(null);
    setError('');
  };

  // Handle edit
  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      employee_id: employee.employee_id,
      username: '', // Don't prefill username/password for security
      password: '',
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      hire_date: employee.hire_date,
      is_active: employee.is_active
    });
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
      await fetchManagers(); // Refresh managers list
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div>Loading employees...</div>;
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Employee Management</h1>
        <p>Add, edit, and manage employees</p>
      </div>

      {error && (
        <div style={{ 
          background: '#f8d7da', 
          color: '#721c24', 
          padding: '10px', 
          borderRadius: '5px', 
          marginBottom: '20px' 
        }}>
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
            <th>Business Unit</th>
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
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
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
              <div className="form-row">

                <div className="form-group">
                  <label>Username * {editingEmployee && '(leave empty to keep current)'}</label>
                  <input
                    type="text"
                    required={!editingEmployee}
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
              </div>

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
                  <label>Password * {editingEmployee && '(leave empty to keep current)'}</label>
                  <input
                    type="password"
                    required={!editingEmployee}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    minLength={8}
                  />
                </div>
              </div>

              <div className="form-row">
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
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hire Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.hire_date}
                    onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                  />
                </div>
                {/* <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div> */}
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