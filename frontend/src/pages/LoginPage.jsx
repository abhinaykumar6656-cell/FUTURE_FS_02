import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <h1>CRM Admin Login</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          {error && <div className="alert error">{error}</div>}
          <button type="submit">Sign in</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
