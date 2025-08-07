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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(new FormData(e.currentTarget as HTMLFormElement));
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
            defaultValue={editingTimesheet?.date || new Date().toISOString().split('T')[0]} 
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