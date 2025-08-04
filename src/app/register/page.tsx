"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../auth.css';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const response = await fetch('http://localhost:8000/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Account created successfully! You can now sign in.');
        // Clear form
        setFormData({
          username: '',
          email: '',
          first_name: '',
          last_name: '',
          password: '',
          password_confirm: ''
        });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        // Handle field-specific errors
        if (data.username) {
          setError(`Username: ${data.username[0]}`);
        } else if (data.email) {
          setError(`Email: ${data.email[0]}`);
        } else if (data.password) {
          setError(`Password: ${data.password[0]}`);
        } else if (data.non_field_errors) {
          setError(data.non_field_errors[0]);
        } else {
          setError('Registration failed. Please try again.');
        }
      }
    } catch (err) {
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
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Choose a username"
            />
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