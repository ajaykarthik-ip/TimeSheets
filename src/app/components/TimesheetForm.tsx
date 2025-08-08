import React, { useState } from 'react';

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

interface TimesheetFormProps {
  projects: Project[];
  activities: string[];
  editingTimesheet?: Timesheet;
  onProjectChange: (projectId: number) => void;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  creating: boolean;
  title: string;
  submitText: string;
}

export default function TimesheetForm({
  projects,
  activities,
  editingTimesheet,
  onProjectChange,
  onSubmit,
  onCancel,
  title,
  submitText
}: TimesheetFormProps) {
  const [creating, setCreating] = useState(false);

  // Helper function to format date for input (avoids timezone issues)
  const formatDateForInput = (dateString: string) => {
    if (!dateString) {
      // Return today's date in YYYY-MM-DD format
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // If it's already in YYYY-MM-DD format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    // If it's a different format, parse and convert
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    // Ensure date is in correct format
    const dateValue = formData.get('date') as string;
    if (dateValue) {
      formData.set('date', dateValue); // Keep the YYYY-MM-DD format
    }
    
    onSubmit(formData);
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value) {
      onProjectChange(parseInt(e.target.value));
    }
  };

  const getProjectIdByName = (projectName: string) => {
    return projects.find(p => p.name === projectName)?.id || '';
  };

  return (
    <div className="form-overlay">
      <form className="create-form" onSubmit={handleSubmit}>
        <h3>{title}</h3>
        
        <label>
          Project:
          <select 
            name="project" 
            required 
            onChange={handleProjectChange}
            defaultValue={editingTimesheet ? getProjectIdByName(editingTimesheet.project_name) : ''}
          >
            <option value="">Select Project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Activity:
          <select 
            name="activity_type" 
            required
            defaultValue={editingTimesheet?.activity_type || ''}
          >
            <option value="">Select Activity</option>
            {activities.map(activity => (
              <option key={activity} value={activity}>
                {activity}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date:
          <input 
            type="date" 
            name="date" 
            required 
            defaultValue={formatDateForInput(editingTimesheet?.date || '')}
          />
        </label>

        <label>
          Hours:
          <input 
            type="number" 
            name="hours_worked" 
            step="0.25" 
            min="0.25" 
            max="24" 
            required 
            defaultValue={editingTimesheet?.hours_worked || ''}
          />
        </label>

        <label>
          Description (optional):
          <textarea 
            name="description" 
            rows={3}
            defaultValue={editingTimesheet?.description || ''}
            placeholder="Optional: Describe what you worked on..."
          />
        </label>

        <div className="form-buttons">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" disabled={creating}>
            {creating ? 'Processing...' : submitText}
          </button>
        </div>
      </form>
    </div>
  );
}