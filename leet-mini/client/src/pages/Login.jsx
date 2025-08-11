import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/auth.js';

export default function Login() {
  const [email, setEmail] = useState('student@example.com');
  const [password, setPassword] = useState('password');
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setToken } = useAuthStore();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`/api/auth/${mode}`, { email, password });
      setToken(data.token);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '80px auto' }}>
      <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit">Continue</button>
      </form>
      <button style={{ marginTop: 12 }} onClick={()=>setMode(mode==='login'?'register':'login')}>
        Switch to {mode==='login'?'Register':'Login'}
      </button>
    </div>
  );
}