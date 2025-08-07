import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faFloppyDisk, faTrash } from '@fortawesome/free-solid-svg-icons';

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

interface DateColumnProps {
  date: Date;
  timesheets: Timesheet[];
  onEdit: (timesheet: Timesheet) => void;
  onDelete: (id: number) => void;
  onSubmit: (id: number) => void;
}

export default function DateColumn({ 
  date, 
  timesheets, 
  onEdit, 
  onDelete, 
  onSubmit 
}: DateColumnProps) {
  const totalHours = timesheets.reduce((sum, ts) => sum + parseFloat(ts.hours_worked), 0);

  return (
    <div className="date-column">
      <div className="date-header">
        <div className="date-info">
          <span className="day">
            {date.toLocaleDateString('en-US', { weekday: 'short' })}
          </span>
          <span className="date-num">{date.getDate()}</span>
        </div>
        {totalHours > 0 && (
          <span className="total-hours">{totalHours}h</span>
        )}
      </div>
      
      <div className="entries">
        {timesheets.map(timesheet => (
          <div key={timesheet.id} className="entry">
            <div className="project">{timesheet.project_name}</div>
            <div className="activity">{timesheet.activity_type}</div>
            <div className="hours">{timesheet.hours_worked}h</div>
            <div 
              className="status" 
              style={{
                fontSize: '12px', 
                color: timesheet.status === 'submitted' ? 'green' : 'orange'
              }}
            >
              {timesheet.status || 'draft'}
            </div>
            <div className="actions">
              {timesheet.can_edit !== false && (
                <button 
                  onClick={() => onEdit(timesheet)} 
                  style={{
                    margin: '2px', 
                    padding: '4px', 
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  title="Edit"
                >
                  <FontAwesomeIcon icon={faPen} />
                </button>
              )}
              {timesheet.status === 'draft' && (
                <>
                  <button 
                    onClick={() => onSubmit(timesheet.id)} 
                    style={{
                      margin: '2px', 
                      padding: '4px', 
                      fontSize: '12px', 
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    title="Submit"
                  >
                    <FontAwesomeIcon icon={faFloppyDisk} />
                  </button>
                  <button 
                    onClick={() => onDelete(timesheet.id)} 
                    style={{
                      margin: '2px', 
                      padding: '4px', 
                      fontSize: '12px', 
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    title="Delete"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}