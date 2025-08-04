"use client";

import React, { useState, useEffect } from 'react';
import './page.css'; 
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
        
        // Auto-update project name and billable status when project code changes
        if (field === 'projectCode') {
          const project = projectOptions.find(p => p.code === value)
          if (project) {
            updatedRow.projectName = project.name
            updatedRow.billable = project.billable
          } else {
            updatedRow.projectName = ''
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

  // Calculate totals whenever rows change
  useEffect(() => {
    calculateTotals()
  }, [rows])

  // Check if day is weekend (Saturday = 5, Sunday = 6)
  const isWeekend = (dayIndex: number) => dayIndex === 5 || dayIndex === 6

  return (
    <div className="timesheet-container">
      {/* Header Section */}
      <div className="timesheet-header">
        <h1>Employee Weekly Timesheet</h1>
      </div>

      {/* Employee Information */}
      <div className="employee-info">
        <div className="info-grid">
          <div>
            <label>Employee Name:</label>
            <span>John Smith</span>
          </div>
          <div>
            <label>Employee ID:</label>
            <span>EMP001</span>
          </div>
          <div>
            <label>Department:</label>
            <span>Software Development</span>
          </div>
          <div>
            <label>Manager:</label>
            <span>Sarah Johnson</span>
          </div>
          <div>
            <label>Week Ending:</label>
            <span>{weekEndingDate}</span>
          </div>
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="table-container">
        <table className="timesheet-table">
          <thead>
            <tr>
              <th>Project Code</th>
              <th>Project Name</th>
              <th>Activity Type</th>
              <th>Billable</th>
              {weekDates.map((date, index) => (
                <th key={index} className={`day-header ${isWeekend(index) ? 'weekend' : ''}`}>
                  {dayNames[index]}<br/>
                  <span className="date">{date.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</span>
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
                <td>
                  <select
                    value={row.projectCode}
                    onChange={(e) => updateRow(row.id, 'projectCode', e.target.value)}
                  >
                    <option value="">Select</option>
                    {projectOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.code}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="project-name">{row.projectName}</td>
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

      {/* Action Buttons */}
      <div className="action-buttons">
        <button onClick={addRow} className="add-btn">
          + Add Row
        </button>
      </div>

      {/* Summary Section */}
      <div className="summary-section">
        <div className="summary-grid">
          <div className="summary-item">
            <label>Regular Hours (≤40):</label>
            <span>{regularHours.toFixed(1)}</span>
          </div>
          <div className="summary-item overtime">
            <label>Overtime Hours ({'>'}40):</label>
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

      {/* Comments Section */}
      <div className="comments-section">
        <label>Comments/Notes:</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Add any additional comments or notes..."
        />
      </div>

      {/* Warnings */}
      {totalHours > 40 && (
        <div className="warning">
          ⚠️ Warning: Total hours exceed 40. Overtime hours: {overtimeHours.toFixed(1)}
        </div>
      )}
    </div>
  )
}