"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        router.push('/'); // or wherever you want to redirect
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, #0f0f23 0%, #050507 100%)',
      padding: '16px'
    }}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderRadius: '12px',
        padding: '32px',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h1 style={{
          color: 'rgba(255, 255, 255, 0.95)',
          fontSize: '24px',
          fontWeight: '600',
          textAlign: 'center',
          marginBottom: '24px',
          letterSpacing: '-0.01em'
        }}>
          Mobiux Timesheet
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(0, 122, 255, 0.6)';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(0, 122, 255, 0.6)';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            />
          </div>

          {error && (
            <div style={{
              color: 'rgb(255, 69, 58)',
              background: 'rgba(255, 69, 58, 0.15)',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: 'none',
              background: loading 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'linear-gradient(135deg, rgba(0, 122, 255, 0.8) 0%, rgba(88, 86, 214, 0.8) 100%)',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}