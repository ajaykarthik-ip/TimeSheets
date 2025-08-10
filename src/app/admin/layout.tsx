"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './admin.css';
import LogoutButton from '../components/LogoutButton'; // Adjust the import path as necessary
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '' },
    { href: '/admin/employees', label: 'Employees', icon: '' },
    { href: '/admin/projects', label: 'Projects', icon: '' },
  ];

  return (
    <div className="admin-container">
      <div className="admin-sidebar">
        <h2>Admin Panel</h2>
              <LogoutButton /> {/* Add this line */}

        <ul className="admin-nav">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link 
                href={item.href}
                className={pathname === item.href ? 'active' : ''}
              >
                {item.icon} {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/" style={{ color: '#999', marginTop: '20px', display: 'block' }}>
              ← Back to Employee View
            </Link>
          </li>
        </ul>
      </div>
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}