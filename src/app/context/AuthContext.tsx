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

// Get API base URL from environment
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 AuthContext: Starting auth check...');
      console.log('📍 Current pathname:', pathname);
      console.log('🍪 Current cookies:', document.cookie);
      
      try {
        // Check if user is stored in localStorage
        const storedUser = localStorage.getItem('user');
        console.log('💾 Stored user:', storedUser ? 'Found' : 'None');
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          console.log('👤 Stored user data:', userData);
          
          try {
            // Verify with backend that session is still valid
            console.log('🔗 Verifying session with backend...');
            const response = await fetch(`${API_BASE}/auth/profile/`, {
              credentials: 'include', // ✅ CRITICAL: Include cookies
              headers: {
                'Content-Type': 'application/json',
              },
            });

            console.log('📡 Profile API response status:', response.status);
            console.log('📡 Profile API response headers:', response.headers);
            
            if (response.ok) {
              const profileData = await response.json();
              console.log('✅ Session valid, profile data:', profileData);
              setUser(userData);
            } else {
              console.log('❌ Session expired, clearing stored user');
              // Session expired, clear stored user
              localStorage.removeItem('user');
              if (!PUBLIC_ROUTES.includes(pathname)) {
                console.log('🔄 Redirecting to login...');
                router.push('/login');
              }
            }
          } catch (fetchError) {
            console.log('⚠️ Backend unreachable:', fetchError);
            console.log('🔄 Keeping stored user for now');
            // Backend is unreachable (deployment, network issues, etc.)
            // Keep the stored user when backend is temporarily unavailable
            setUser(userData);
          }
        } else if (!PUBLIC_ROUTES.includes(pathname)) {
          console.log('🚫 No user and trying to access protected route');
          // No user and trying to access protected route
          router.push('/login');
        }
      } catch (error) {
        console.error('💥 Auth check failed:', error);
        // Only clear user data if we're sure there's an authentication issue
        if (!PUBLIC_ROUTES.includes(pathname)) {
          router.push('/login');
        }
      } finally {
        console.log('✅ Auth check complete');
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  const login = (userData: User) => {
    console.log('🔐 AuthContext: Logging in user:', userData);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('💾 User data saved to localStorage');
  };

  const logout = async () => {
    console.log('🚪 AuthContext: Logging out...');
    try {
      const response = await fetch(`${API_BASE}/auth/logout/`, {
        method: 'POST',
        credentials: 'include', // ✅ CRITICAL: Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('📡 Logout API response status:', response.status);
    } catch (error) {
      console.error('⚠️ Logout error:', error);
      // Continue with logout even if backend request fails
    }
    
    setUser(null);
    localStorage.removeItem('user');
    console.log('✅ User logged out, redirecting to login');
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