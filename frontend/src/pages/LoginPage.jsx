import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = (role) => {
    console.log('Selected role:', role);
    navigate('/dashboard');
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-icon large"><span>🏪</span></div>
          <h1>Smart Bakery</h1>
          <p>Access the inventory and waste intelligence system</p>
        </div>

        <div className="role-grid">
          <button type="button" className="role-button" onClick={() => handleLogin('staff')}>
            Floor Staff
          </button>
          <button type="button" className="role-button primary" onClick={() => handleLogin('manager')}>
            Manager / Owner
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
