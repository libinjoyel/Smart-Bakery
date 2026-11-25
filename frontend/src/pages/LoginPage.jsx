import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Lock, User } from 'lucide-react';
import { useBakery } from '../contexts/BakeryContext';

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useBakery();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setError('Invalid username or password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(trimmedUser, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-icon large" style={{ margin: '0 auto 12px', display: 'grid', placeItems: 'center' }}>
            <ChefHat size={32} />
          </div>
          <h1>Smart Bakery</h1>
          <p>Sign in to access your dashboard</p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Username
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={submitting}
                required
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </label>

          <label>
            Password
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={submitting}
                required
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </label>

          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary-button action-button"
            disabled={submitting}
            style={{ width: '100%', marginTop: '8px', padding: '14px' }}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
