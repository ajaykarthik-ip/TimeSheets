"use client";

import React, { useState, useEffect } from 'react';
import './page.css'; 
import LogoutButton from './components/LogoutButton';

type TimesheetRow = {
  id: number
  projectCode: string
  projectName: string
  activity: string
  billable: boolean
  hours: number[]
  total: number
}

const projectOptions = [
  { code: 'PRJ001', name: 'Client A - Website Redesign', billable: true },
  { code: 'PRJ002', name: 'Client B - Mobile App', billable: true },
  { code: 'PRJ003', name: 'Client C - Database Migration', billable: true },
  { code: 'INT001', name: 'Internal - Training', billable: false },
  { code: 'INT002', name: 'Internal - Meetings', billable: false },
  { code: 'ADM001', name: 'Administrative Tasks', billable: false },
]

const activityOptions = [
  'Development',
  'Testing',
  'Documentation',
  'Code Review',
  'Meeting',
  'Planning',
  'Research',
  'Bug Fixing',
  'Deployment',
  'Training'
]

export default function SimplifiedTimesheet() {
  const [rows, setRows] = useState<TimesheetRow[]>([
    {
      id: 1,
      projectCode: '',
      projectName: '',
      activity: '',
      billable: true,
      hours: Array(7).fill(0),
      total: 0,
    },
  ])

  const [weekEndingDate, setWeekEndingDate] = useState<string>('')
  const [comments, setComments] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Calculate totals
  const [regularHours, setRegularHours] = useState<number>(0)
  const [overtimeHours, setOvertimeHours] = useState<number>(0)
  const [billableHours, setBillableHours] = useState<number>(0)
  const [nonBillableHours, setNonBillableHours] = useState<number>(0)
  const [totalHours, setTotalHours] = useState<number>(0)

  // Get current week dates
  const getCurrentWeekDates = () => {
    const today = new Date()
    const currentDay = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - currentDay + 1)
    
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getCurrentWeekDates()
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Set week ending date on component mount
  useEffect(() => {
    const sunday = weekDates[6]
    setWeekEndingDate(sunday.toISOString().split('T')[0])
  }, [])

  const calculateTotals = () => {
    let total = 0
    let billable = 0
    let nonBillable = 0

    rows.forEach(row => {
      const rowTotal = row.hours.reduce((sum, h) => sum + h, 0)
      total += rowTotal
      
      if (row.billable) {
        billable += rowTotal
      } else {
        nonBillable += rowTotal
      }
    })

    setTotalHours(total)
    setBillableHours(billable)
    setNonBillableHours(nonBillable)
    setRegularHours(Math.min(total, 40))
    setOvertimeHours(Math.max(total - 40, 0))
  }

  const updateRow = (id: number, field: keyof TimesheetRow, value: any) => {
    const updated = rows.map((row) => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value }
        
        // Auto-update project code and billable status when project name changes
        if (field === 'projectName') {
          const project = projectOptions.find(p => p.name === value)
          if (project) {
            updatedRow.projectCode = project.code
            updatedRow.billable = project.billable
          } else {
            updatedRow.projectCode = ''
            updatedRow.billable = true
          }
        }
        
        updatedRow.total = updatedRow.hours.reduce((sum, h) => sum + h, 0)
        return updatedRow
      }
      return row
    })
    setRows(updated)
  }

  const updateHour = (id: number, dayIndex: number, value: number) => {
    // Validate input
    if (value < 0) value = 0
    if (value > 24) value = 24
    
    // Round to nearest 0.5
    value = Math.round(value * 2) / 2

    const updated = rows.map((row) => {
      if (row.id === id) {
        const newHours = [...row.hours]
        newHours[dayIndex] = value
        const updatedRow = { ...row, hours: newHours }
        updatedRow.total = newHours.reduce((sum, h) => sum + h, 0)
        return updatedRow
      }
      return row
    })
    setRows(updated)
  }

  const addRow = () => {
    const newRow: TimesheetRow = {
      id: Date.now(),
      projectCode: '',
      projectName: '',
      activity: '',
      billable: true,
      hours: Array(7).fill(0),
      total: 0,
    }
    setRows([...rows, newRow])
  }

  const removeRow = (id: number) => {
    if (rows.length <= 1) return
    setRows(rows.filter(row => row.id !== id))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Validate that at least one row has hours
    const hasHours = rows.some(row => row.hours.some(hour => hour > 0))
    if (!hasHours) {
      alert('Please add hours before submitting')
      setIsSubmitting(false)
      return
    }

    // Validate that rows with hours have project and activity selected
    const invalidRows = rows.filter(row => {
      const rowHasHours = row.hours.some(hour => hour > 0)
      return rowHasHours && (!row.projectName || !row.activity)
    })

    if (invalidRows.length > 0) {
      alert('Please select project and activity for all rows with hours')
      setIsSubmitting(false)
      return
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Success message
      alert('Timesheet submitted successfully!')
      
    } catch (error) {
      alert('Failed to submit timesheet. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate totals whenever rows change
  useEffect(() => {
    calculateTotals()
  }, [rows])

  // Check if day is weekend (Saturday = 5, Sunday = 6)
  const isWeekend = (dayIndex: number) => dayIndex === 5 || dayIndex === 6

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <LogoutButton />

      {/* Left Sidebar - Employee Info */}
      <div style={{
        width: '250px',
        background: '#f0f0f0',
        padding: '20px',
        borderRight: '1px solid #ddd'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Employee Info</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ 
              display: 'block',
              fontWeight: 'bold', 
              color: '#555', 
              fontSize: '12px',
              marginBottom: '5px',
              textTransform: 'uppercase'
            }}>Name</label>
            <span style={{ color: '#333', fontSize: '14px' }}>John Smith</span>
          </div>
          
          <div>
            <label style={{ 
              display: 'block',
              fontWeight: 'bold', 
              color: '#555', 
              fontSize: '12px',
              marginBottom: '5px',
              textTransform: 'uppercase'
            }}>Employee ID</label>
            <span style={{ color: '#333', fontSize: '14px' }}>EMP001</span>
          </div>
          
          <div>
            <label style={{ 
              display: 'block',
              fontWeight: 'bold', 
              color: '#555', 
              fontSize: '12px',
              marginBottom: '5px',
              textTransform: 'uppercase'
            }}>Department</label>
            <span style={{ color: '#333', fontSize: '14px' }}>Software Development</span>
          </div>
          
          <div>
            <label style={{ 
              display: 'block',
              fontWeight: 'bold', 
              color: '#555', 
              fontSize: '12px',
              marginBottom: '5px',
              textTransform: 'uppercase'
            }}>Manager</label>
            <span style={{ color: '#333', fontSize: '14px' }}>Sarah Johnson</span>
          </div>
          
          <div>
            <label style={{ 
              display: 'block',
              fontWeight: 'bold', 
              color: '#555', 
              fontSize: '12px',
              marginBottom: '5px',
              textTransform: 'uppercase'
            }}>Week Ending</label>
            <span style={{ color: '#333', fontSize: '14px' }}>{weekEndingDate}</span>
          </div>
        </div>

        {/* Quick Summary in Sidebar */}
        <div style={{ marginTop: '30px', padding: '15px', background: 'white', borderRadius: '5px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '14px' }}>Week Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Hours:</span>
              <strong>{totalHours.toFixed(1)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Billable:</span>
              <span>{billableHours.toFixed(1)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Non-Billable:</span>
              <span>{nonBillableHours.toFixed(1)}</span>
            </div>
            {overtimeHours > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                <span>Overtime:</span>
                <span>{overtimeHours.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '20px', background: 'white' }}>
        <div className="timesheet-header">
          <h1>Weekly Timesheet</h1>
        </div>

        <div className="table-container">
          <table className="timesheet-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Activity Type</th>
                <th>Billable</th>
                {weekDates.map((date, index) => (
                  <th key={index} className={`day-header ${isWeekend(index) ? 'weekend' : ''}`}>
                    {dayNames[index]}<br/>
                    <span className="date">
                      {date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    {isWeekend(index) && (
                      <>
                        <br/>
                        <span className="holiday-label">Holiday</span>
                      </>
                    )}
                  </th>
                ))}
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="project-name">
                    <select
                      value={row.projectName}
                      onChange={(e) => updateRow(row.id, 'projectName', e.target.value)}
                    >
                      <option value="">Select Project</option>
                      {projectOptions.map((option) => (
                        <option key={option.code} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={row.activity}
                      onChange={(e) => updateRow(row.id, 'activity', e.target.value)}
                    >
                      <option value="">Select Activity</option>
                      {activityOptions.map((activity) => (
                        <option key={activity} value={activity}>
                          {activity}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`billable-status ${row.billable ? 'billable' : 'non-billable'}`}>
                      {row.billable ? 'Yes' : 'No'}
                    </span>
                  </td>
                  {row.hours.map((hour, index) => (
                    <td key={index} className={isWeekend(index) ? 'weekend-cell' : ''}>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={hour || ''}
                        onChange={(e) => updateHour(row.id, index, parseFloat(e.target.value) || 0)}
                        className="hour-input"
                        disabled={isWeekend(index)}
                      />
                    </td>
                  ))}
                  <td className="total-cell">{row.total.toFixed(1)}</td>
                  <td>
                    <button 
                      onClick={() => removeRow(row.id)}
                      className="remove-btn"
                      disabled={rows.length <= 1}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="action-buttons">
          <button onClick={addRow} className="add-btn">
            + Add Row
          </button>
        </div>

        <div className="summary-section">
          <div className="summary-grid">
            <div className="summary-item">
              <label>Regular Hours (≤40):</label>
              <span>{regularHours.toFixed(1)}</span>
            </div>
            <div className="summary-item overtime">
              <label>Overtime Hours (&gt;40):</label>
              <span>{overtimeHours.toFixed(1)}</span>
            </div>
            <div className="summary-item">
              <label>Billable Hours:</label>
              <span>{billableHours.toFixed(1)}</span>
            </div>
            <div className="summary-item">
              <label>Non-Billable Hours:</label>
              <span>{nonBillableHours.toFixed(1)}</span>
            </div>
            <div className="summary-item total">
              <label>Total Hours:</label>
              <span>{totalHours.toFixed(1)} / 40</span>
            </div>
          </div>
        </div>

        <div className="comments-section">
          <label>Comments/Notes:</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add any additional comments or notes..."
          />
        </div>

        <div className="action-buttons" style={{ textAlign: 'center', marginTop: '30px' }}>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || totalHours === 0}
            className="add-btn"
            style={{
              backgroundColor: isSubmitting || totalHours === 0 ? '#ccc' : '#007bff',
              padding: '15px 40px',
              fontSize: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            {isSubmitting && (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Timesheet'}
          </button>
          
          {totalHours === 0 && (
            <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
              Please add hours before submitting
            </p>
          )}
        </div>

        {totalHours > 40 && (
          <div className="warning">
            ⚠️ Warning: Total hours exceed 40. Overtime hours: {overtimeHours.toFixed(1)}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}