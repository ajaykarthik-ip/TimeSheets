"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

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
  const [googleInitialized, setGoogleInitialized] = useState(false);

  // Initialize Google OAuth
  useEffect(() => {
    const initializeGoogle = () => {
      // Load Google OAuth script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.google) {
          try {
            window.google.accounts.id.initialize({
              client_id: '10454239385-8adqedafr5vo5camkr5re7e9mc4qf3jc.apps.googleusercontent.com',
              callback: handleGoogleLogin,
              auto_select: false,
              cancel_on_tap_outside: true,
              use_fedcm_for_prompt: false, // Disable FedCM to avoid the error
            });
            setGoogleInitialized(true);
            console.log('Google Sign-In initialized successfully');
          } catch (error) {
            console.error('Error initializing Google Sign-In:', error);
            setError('Failed to initialize Google Sign-In');
          }
        }
      };

      script.onerror = () => {
        console.error('Failed to load Google Sign-In script');
        setError('Failed to load Google Sign-In');
      };

      document.head.appendChild(script);

      return () => {
        try {
          document.head.removeChild(script);
        } catch (e) {
          // Script already removed
        }
      };
    };

    const cleanup = initializeGoogle();
    return cleanup;
  }, []);

  const handleGoogleLogin = async (response: any) => {
    console.log('Google login response:', response);
    setGoogleLoading(true);
    setError('');

    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      const res = await fetch('http://localhost:8000/api/auth/google-login/', {
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
        login(data.user);
        if (data.created) {
          alert('Account created successfully with Google!');
        }
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

  const handleGoogleButtonClick = () => {
    if (!googleInitialized) {
      setError('Google Sign-In is still loading. Please wait...');
      return;
    }

    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        // Clear any previous errors
        setError('');
        
        // Alternative method - render the button directly
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with'
          }
        );
        
        // Or use prompt method
        // window.google.accounts.id.prompt();
      } catch (error) {
        console.error('Error triggering Google Sign-In:', error);
        setError('Error starting Google Sign-In. Please refresh and try again.');
      }
    } else {
      setError('Google Sign-In not available. Please refresh the page.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user);
        router.push('/');
      } else {
        setError(data.detail || data.email?.[0] || data.password?.[0] || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">Mobiux Timesheets</div>
          <p>Sign in to your account</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="google-signin-section">
          {/* Hidden div for Google button rendering */}
          <div id="google-signin-button" style={{ display: 'none' }}></div>
          
          <button 
            className="google-button"
            onClick={handleGoogleButtonClick}
            disabled={googleLoading || !googleInitialized}
          >
            {googleLoading ? (
              <div className="loading">
                <div className="spinner" style={{ borderTopColor: '#007aff' }}></div>
                Signing in...
              </div>
            ) : !googleInitialized ? (
              <div className="loading">
                <div className="spinner" style={{ borderTopColor: '#007aff' }}></div>
                Loading...
              </div>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
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
            Don't have an account? <Link href="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}