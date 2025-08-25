"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import '../auth.css';

// Get API base URL from environment
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// Define Google API types (keeping for future use)
interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleInitializeConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select: boolean;
}

interface GoogleButtonConfig {
  theme: string;
  size: string;
  width: string;
  text: string;
}

interface GoogleAccounts {
  id: {
    initialize: (config: GoogleInitializeConfig) => void;
    renderButton: (element: HTMLElement | null, config: GoogleButtonConfig) => void;
  };
}

// Declare Google API types
declare global {
  interface Window {
    google: {
      accounts: GoogleAccounts;
    };
    googleLoginCallback: (response: GoogleCredentialResponse) => void;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  // ✅ FIXED: Match backend expected fields
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    designation: 'employee', // Default designation
    password: '',
    password_confirm: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google OAuth handler (disabled for now, keeping for future)
  const handleGoogleLogin = useCallback(async (response: GoogleCredentialResponse) => {
    setGoogleLoading(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Implement Google OAuth when backend supports it
      setError('Google OAuth not implemented yet');
    } catch (err) {
      console.error('Google registration error:', err);
      setError('Google registration is not available yet');
    } finally {
      setGoogleLoading(false);
    }
  }, []);

  // Initialize Google OAuth (commented out for now)
  useEffect(() => {
    // TODO: Uncomment when Google OAuth is implemented in backend
    /*
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

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signup_with',
          }
        );
      }
    };

    return () => {
      document.head.removeChild(script);
    };
    */
  }, [handleGoogleLogin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Client-side validation
    if (formData.password !== formData.password_confirm) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      // ✅ FIXED: Prepare data to match backend expectations
      const registrationData = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        designation: formData.designation,
        password: formData.password
        // Remove password_confirm as backend doesn't expect it
      };

      console.log('📝 Register: Sending data:', { ...registrationData, password: '[HIDDEN]' });

      // ✅ FIXED: Use correct backend endpoint
      const response = await fetch(`${API_BASE}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();
      console.log('📡 Register: Response:', data);

      if (response.ok) {
        setSuccess('Account created successfully! You can now sign in.');
        console.log('✅ Registration successful:', data);
        
        // Clear form
        setFormData({
          email: '',
          first_name: '',
          last_name: '',
          designation: 'employee',
          password: '',
          password_confirm: ''
        });
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        // ✅ FIXED: Handle backend error format
        console.log('❌ Registration failed:', data);
        
        if (data.error) {
          setError(data.error);
        } else if (data.email) {
          setError(`Email: ${Array.isArray(data.email) ? data.email[0] : data.email}`);
        } else if (data.password) {
          setError(`Password: ${Array.isArray(data.password) ? data.password[0] : data.password}`);
        } else {
          setError('Registration failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('💥 Registration error:', err);
      setError('Network error. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join our timesheet management system</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        {/* Google Sign-In Button (disabled for now) */}
        <div className="google-signin-section" style={{ display: 'none' }}>
          <div 
            id="google-signin-button"
            style={{ marginBottom: '20px' }}
          ></div>
          {googleLoading && (
            <div className="loading" style={{ marginBottom: '15px' }}>
              <div className="spinner"></div>
              Creating account with Google...
            </div>
          )}
        </div>

        {/* Divider (hidden when Google is disabled) */}
        <div className="auth-divider" style={{ display: 'none' }}>
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                placeholder="Enter first name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                placeholder="Enter last name"
              />
            </div>
          </div>

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
            />
          </div>

          {/* ✅ ADDED: Designation field to match backend */}
          <div className="form-group">
            <label htmlFor="designation">Designation</label>
            <select
              id="designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              required
            >
              <option value="employee">Employee</option>
              <option value="senior_employee">Senior Employee</option>
              <option value="team_lead">Team Lead</option>
              <option value="manager">Manager</option>
              <option value="senior_manager">Senior Manager</option>
              <option value="director">Director</option>
            </select>
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
              placeholder="Enter password (min 8 characters)"
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password_confirm">Confirm Password</label>
            <input
              type="password"
              id="password_confirm"
              name="password_confirm"
              value={formData.password_confirm}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
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
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Already have an account?{' '}
            <Link href="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}