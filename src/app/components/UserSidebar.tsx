import React from 'react';
import LogoutButton from './LogoutButton';

interface User {
  employee_id: string;
  employee_name: string;
  department: string;
  role: string;
}

interface UserSidebarProps {
  user: User;
  isAdmin: boolean;
}

export default function UserSidebar({ user, isAdmin }: UserSidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <div>
          <h2>Mobiux - Timesheet</h2>
          <div className="user-info">
            <p><strong>Name:</strong> {user.employee_name}</p>
            <p><strong>ID:</strong> {user.employee_id}</p>
            <p><strong>Department:</strong> {user.department}</p>
            <p><strong>Role:</strong> {user.role}</p>
          </div>
          
          {isAdmin && (
            <button 
              className="admin-btn" 
              onClick={() => window.location.href = '/admin'}
            >
              Admin Panel
            </button>
          )}
        </div>

        <div className="logout-container">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}