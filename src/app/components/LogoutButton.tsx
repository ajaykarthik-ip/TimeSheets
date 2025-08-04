"use client";

import { useAuth } from '../context/AuthContext';

export default function LogoutButton() {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  if (!user) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: 'white',
      padding: '10px 15px',
      borderRadius: '5px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 1000
    }}>
      <span style={{ fontSize: '14px', color: '#666' }}>
        Welcome, {user.first_name || user.username}
      </span>
      <button
        onClick={handleLogout}
        style={{
          background: '#dc3545',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '3px',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </div>
  );
}