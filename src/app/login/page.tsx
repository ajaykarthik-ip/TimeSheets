"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import '../auth.css';

// Get API base URL from environment
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// Declare Google API types
declare global {
  interface Window {
    google: any;
    googleLoginCallback: (response: any) => void;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Initialize Google OAuth
  useEffect(() => {
    // Load Google OAuth script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: '10454239385-8adqedafr5vo5camkr5re7e9mc4qf3jc.apps.googleusercontent.com',
          callback: handleGoogleLogin,
          auto_select: false,
        });

        // Render the Google Sign-In button
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
          }
        );
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleGoogleLogin = async (response: any) => {
    setGoogleLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/auth/google-login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          token: response.credential
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Use AuthContext login method
        login(data.user);
        // Show success message if account was created
        if (data.created) {
          alert('Account created successfully with Google!');
        }
        // Redirect to timesheet page
        router.push('/');
      } else {
        setError(data.error || data.details || 'Google login failed');
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError('Network error during Google login. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  console.log('🔐 Login: Starting login process...');
  console.log('📝 Login: Form data:', { email: formData.email, password: '[HIDDEN]' });
  console.log('🍪 Login: Cookies before login:', document.cookie);

  try {
    const response = await fetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ✅ CRITICAL: Include cookies
      body: JSON.stringify(formData),
    });

    console.log('📡 Login: Response status:', response.status);
    console.log('📡 Login: Response headers:', [...response.headers.entries()]);
    
    const data = await response.json();
    console.log('📡 Login: Response data:', data);

    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('🍪 All cookies after login:', document.cookie);
      
      // Use AuthContext login method
      login(data.user);
      console.log('🔄 Redirecting to main page...');
      // Redirect to timesheet page
      router.push('/');
    } else {
      console.log('❌ Login failed:', data);
      setError(data.detail || data.email?.[0] || data.password?.[0] || 'Login failed');
    }
  } catch (err) {
    console.error('💥 Login error:', err);
    setError('Network error. Please check if the backend server is running.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your timesheet account</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Google Sign-In Button */}
        <div className="google-signin-section">
          <div 
            id="google-signin-button"
            style={{ marginBottom: '20px' }}
          ></div>
          {googleLoading && (
            <div className="loading" style={{ marginBottom: '15px' }}>
              <div className="spinner"></div>
              Signing in with Google...
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              className={error ? 'error' : ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              className={error ? 'error' : ''}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Don't have an account?{' '}
            <Link href="/register">Create one here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}