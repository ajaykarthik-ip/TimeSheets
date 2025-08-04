"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Pages that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is stored in localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          // Verify with backend that session is still valid
          const response = await fetch('http://localhost:8000/api/auth/profile/', {
            credentials: 'include',
          });

          if (response.ok) {
            setUser(userData);
          } else {
            // Session expired, clear stored user
            localStorage.removeItem('user');
            if (!PUBLIC_ROUTES.includes(pathname)) {
              router.push('/login');
            }
          }
        } else if (!PUBLIC_ROUTES.includes(pathname)) {
          // No user and trying to access protected route
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('user');
        if (!PUBLIC_ROUTES.includes(pathname)) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:8000/api/auth/logout/', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setUser(null);
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Loading...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}