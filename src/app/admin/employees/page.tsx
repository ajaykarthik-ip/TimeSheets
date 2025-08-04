"use client";

import { useState } from 'react';
import { employees, getManagers, addEmployee, updateEmployee, deleteEmployee, type Employee } from '../../data/hardcodedData';

export default function AdminEmployees() {
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    managerId: '',
    role: 'employee' as 'admin' | 'employee',
    status: 'active' as 'active' | 'inactive'
  });

  const managers = getManagers();
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const employeeData = {
      ...formData,
      managerId: formData.managerId ? parseInt(formData.managerId) : null
    };

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, employeeData);
    } else {
      addEmployee(employeeData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      department: '',
      managerId: '',
      role: 'employee',
      status: 'active'
    });
    setShowForm(false);
    setEditingEmployee(null);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      department: employee.department,
      managerId: employee.managerId?.toString() || '',
      role: employee.role,
      status: employee.status
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      deleteEmployee(id);
    }
  };

  const getManagerName = (managerId: number | null) => {
    if (!managerId) return 'None';
    const manager = employees.find(emp => emp.id === managerId);
    return manager ? manager.name : 'Unknown';
  };

  return (
    <div>
      <div className="admin-header">
        <h1>Employee Management</h1>
        <p>Add, edit, and manage employees</p>
      </div>

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
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Manager</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.name}</td>
              <td>{employee.email}</td>
              <td>{employee.department}</td>
              <td>{getManagerName(employee.managerId)}</td>
              <td>
                <span className={`status-badge status-${employee.role}`}>
                  {employee.role.toUpperCase()}
                </span>
              </td>
              <td>
                <span className={`status-badge status-${employee.status}`}>
                  {employee.status.toUpperCase()}
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
                  onClick={() => handleDelete(employee.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
                  <label>Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Manager</label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData({...formData, managerId: e.target.value})}
                  >
                    <option value="">No Manager</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'employee'})}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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