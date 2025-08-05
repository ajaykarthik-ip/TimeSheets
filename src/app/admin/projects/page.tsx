"use client";

import { useState } from 'react';
import { projects, addProject, updateProject, deleteProject, type Project } from '../../data/hardcodedData';

export default function AdminProjects() {
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    billable: true,
    status: 'active' as 'active' | 'inactive'
  });

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProject) {
      updateProject(editingProject.id, formData);
    } else {
      addProject(formData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      billable: true,
      status: 'active'
    });
    setShowForm(false);
    setEditingProject(null);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      code: project.code,
      name: project.name,
      billable: project.billable,
      status: project.status
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(id);
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h1>Project Management</h1>
        <p>Add, edit, and manage projects</p>
      </div>

      <div className="actions">
        <input
          type="text"
          placeholder="Search projects..."
          className="search-box"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          Add Project
        </button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            {/* <th>Code</th> */}
            <th>Name</th>
            <th>Billable</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map((project) => (
            <tr key={project.id}>
              {/* <td>{project.code}</td> */}
              <td>{project.name}</td>
              <td>
                <span className={`status-badge ${project.billable ? 'status-active' : 'status-inactive'}`}>
                  {project.billable ? 'YES' : 'NO'}
                </span>
              </td>
              <td>
                <span className={`status-badge status-${project.status}`}>
                  {project.status.toUpperCase()}
                </span>
              </td>
              <td>
                <button 
                  className="btn btn-warning"
                  onClick={() => handleEdit(project)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDelete(project.id)}
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
              <h2>{editingProject ? 'Edit Project' : 'Add Project'}</h2>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Project Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="e.g., PRJ001"
                  />
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

              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Client A - Website Redesign"
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.billable}
                    onChange={(e) => setFormData({...formData, billable: e.target.checked})}
                  />
                  {' '}Billable Project
                </label>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button type="button" className="btn" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingProject ? 'Update' : 'Add'} Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}