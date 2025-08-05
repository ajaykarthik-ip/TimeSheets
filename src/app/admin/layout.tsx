"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '../components/LogoutButton'; // Add this import
import './admin.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/employees', label: 'Employees', icon: '👥' },
    { href: '/admin/projects', label: 'Projects', icon: '📁' },
    { href: '/admin/timesheets', label: 'Timesheets', icon: '📋' },
  ];

  return (
    <div className="admin-container">
      <LogoutButton /> {/* Add this line */}
      <div className="admin-sidebar">
        <h2>Admin Panel</h2>
        {/* rest of sidebar content */}
      </div>
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}