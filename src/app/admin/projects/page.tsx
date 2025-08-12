"use client";

import { useState, useEffect } from 'react';

// Types
interface Project {
  id: number;
  name: string;
  billable: boolean;
  status: string;
  status_display: string;
  activity_types_display: string[];
  created_at: string;
  updated_at: string;
}

interface ProjectChoices {
  statuses: { [key: string]: string };
}

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [choices, setChoices] = useState<ProjectChoices>({ statuses: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    billable: true,
    status: 'active',
    activity_types_list: [] as string[]
  });

  // API Base URL
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ||'http://localhost:8000/api';

  // Fetch projects
  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE}/projects/`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    }
  };

  // Fetch choices
  const fetchChoices = async () => {
    try {
      const response = await fetch(`${API_BASE}/projects/choices/`, {
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
        fetchProjects(),
        fetchChoices()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Filter projects
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      let response;
      if (editingProject) {
        // Update project
        response = await fetch(`${API_BASE}/projects/${editingProject.id}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(formData)
        });
      } else {
        // Create new project
        response = await fetch(`${API_BASE}/projects/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(formData)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save project');
      }

      // Refresh data
      await fetchProjects();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      billable: true,
      status: 'active',
      activity_types_list: []
    });
    setShowForm(false);
    setEditingProject(null);
    setError('');
  };

  // Handle edit
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      billable: project.billable,
      status: project.status,
      activity_types_list: project.activity_types_display || []
    });
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete ${project.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/projects/${project.id}/`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      await fetchProjects();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Add activity type
  const addActivityType = () => {
    setFormData({
      ...formData,
      activity_types_list: [...formData.activity_types_list, '']
    });
  };

  // Remove activity type
  const removeActivityType = (index: number) => {
    const newList = formData.activity_types_list.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      activity_types_list: newList
    });
  };

  // Update activity type
  const updateActivityType = (index: number, value: string) => {
    const newList = [...formData.activity_types_list];
    newList[index] = value;
    setFormData({
      ...formData,
      activity_types_list: newList
    });
  };

  if (loading) {
    return <div>Loading projects...</div>;
  }

  return (
    <div>
      <div className="admin-header">
        <h1>Project Management</h1>
        <p>Add, edit, and manage projects</p>
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
            <th>Name</th>
            <th>Billable</th>
            <th>Status</th>
            <th>Activity Types</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map((project) => (
            <tr key={project.id}>
              <td>{project.name}</td>
              <td>
                <span className={`status-badge ${project.billable ? 'status-active' : 'status-inactive'}`}>
                  {project.billable ? 'YES' : 'NO'}
                </span>
              </td>
              <td>
                <span className={`status-badge status-${project.status}`}>
                  {project.status_display || project.status.toUpperCase()}
                </span>
              </td>
              <td>
                {project.activity_types_display && project.activity_types_display.length > 0 ? 
                  project.activity_types_display.join(', ') : 
                  'No activities'
                }
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
                  onClick={() => handleDelete(project)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredProjects.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          No projects found.
        </div>
      )}

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
                  <label>Project Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Client A - Website Redesign"
                  />
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    {Object.entries(choices.statuses).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>
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

              <div className="form-group">
                <label>Activity Types</label>
                <small style={{ display: 'block', marginBottom: '10px', color: '#666' }}>
                  Define the types of activities that can be tracked for this project
                </small>
                
                {formData.activity_types_list.map((activity, index) => (
                  <div key={index} style={{ display: 'flex', marginBottom: '5px', gap: '10px' }}>
                    <input
                      type="text"
                      value={activity}
                      onChange={(e) => updateActivityType(index, e.target.value)}
                      placeholder="e.g., Development, Testing, Design"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => removeActivityType(index)}
                      className="btn btn-danger"
                      style={{ padding: '5px 10px' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addActivityType}
                  className="btn"
                  style={{ marginTop: '10px' }}
                >
                  Add Activity Type
                </button>
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