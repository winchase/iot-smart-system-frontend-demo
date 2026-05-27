import React, { useMemo, useState } from 'react';
import { loginUser, registerUser } from '../../services/authService.js';
import './AuthPage.css';

function UserCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

export default function AuthPage({ mode = 'login', onModeChange, onAuthSuccess }) {
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [status, setStatus] = useState('ready');
  const [error, setError] = useState('');

  const title = isRegister ? 'Create account' : 'Sign in';
  const subtitle = isRegister
    ? 'Create an account to manage your IoT monitoring dashboard.'
    : 'Sign in to continue working with your IoT monitoring dashboard.';

  const submitLabel = useMemo(() => {
    if (status === 'pending') {
      return isRegister ? 'Creating account...' : 'Signing in...';
    }

    return isRegister ? 'Create account' : 'Sign in';
  }, [isRegister, status]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('pending');
    setError('');

    try {
      const user = isRegister
        ? await registerUser(form)
        : await loginUser({ email: form.email, password: form.password });

      setStatus('ready');
      onAuthSuccess?.(user);
    } catch (submitError) {
      setStatus('error');
      setError(submitError.message || 'Authentication failed');
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-card__icon">
          <UserCircleIcon />
        </div>

        <div className="auth-card__header">
          <p className="auth-card__eyebrow">Air Quality Analyzer</p>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        {error ? <div className="auth-card__error">{error}</div> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister ? (
            <label className="auth-form__field">
              <span>Username</span>
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={updateField}
                placeholder="Sergey"
                required
              />
            </label>
          ) : null}

          <label className="auth-form__field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              placeholder="sergey@example.com"
              required
            />
          </label>

          <label className="auth-form__field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              placeholder="Minimum 8 characters"
              minLength={6}
              required
            />
          </label>

          <button className="auth-form__submit" type="submit" disabled={status === 'pending'}>
            {submitLabel}
          </button>
        </form>

        <div className="auth-card__switch">
          {isRegister ? 'Already have an account?' : 'Do not have an account yet?'}
          <button
            type="button"
            onClick={() => onModeChange?.(isRegister ? 'login' : 'register')}
          >
            {isRegister ? 'Sign in' : 'Create account'}
          </button>
        </div>
      </div>
    </section>
  );
}
