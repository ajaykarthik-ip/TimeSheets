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
    <div className="logout-section">
      <button
        onClick={handleLogout}
        className="logout-btn"
      >
        Logout
      </button>
    </div>
  );
}