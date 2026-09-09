'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      employeeId,
      password
    });

    if (res?.error) {
      setError('Invalid Employee ID or Password');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="container flex flex-col items-center justify-center">
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>New Duke & Duchess</h1>
          <h2 style={{ fontSize: '1.125rem', color: 'var(--text-muted)', fontWeight: 400, marginTop: '0.5rem' }}>Staff Login</h2>
        </div>
        
        {error && <div style={{ color: 'var(--status-absent)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label" htmlFor="employeeId">Employee ID / Mobile Number</label>
            <input 
              id="employeeId"
              className="input-field" 
              type="text" 
              value={employeeId} 
              onChange={(e) => setEmployeeId(e.target.value)} 
              required
            />
          </div>
          
          <div className="input-group">
            <label className="input-label" htmlFor="password">Password / PIN</label>
            <input 
              id="password"
              className="input-field" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
            />
          </div>

          <button type="submit" className="btn-primary">
            Login
          </button>
        </form>

        <div className="text-center" style={{ marginTop: '1.5rem' }}>
          <a href="#" style={{ fontSize: '0.875rem' }}>Forgot Password?</a>
        </div>
      </div>
    </div>
  );
}
