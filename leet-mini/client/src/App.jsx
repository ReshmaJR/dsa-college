import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import Login from './pages/Login.jsx';
import ProfileSetup from './pages/ProfileSetup.jsx';
import Problems from './pages/Problems.jsx';
import Editor from './pages/Editor.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Stats from './pages/Stats.jsx';
import useAuthStore from './store/auth.js';
import './App.css';

const queryClient = new QueryClient();

function RequireAuth({ children }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function Layout({ children }) {
  const { token, logout } = useAuthStore();
  return (
    <div>
      <nav style={{ display: 'flex', gap: 16, padding: 12, borderBottom: '1px solid #eee' }}>
        <Link to="/problems">Problems</Link>
        <Link to="/editor">Editor</Link>
        <Link to="/stats">Stats</Link>
        <Link to="/leaderboard">Leaderboard</Link>
        {token ? <button onClick={logout}>Logout</button> : <Link to="/login">Login</Link>}
      </nav>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

export default function App() {
  const { loadToken } = useAuthStore();
  useEffect(() => { loadToken(); }, [loadToken]);
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<RequireAuth><Layout><ProfileSetup /></Layout></RequireAuth>} />
          <Route path="/problems" element={<RequireAuth><Layout><Problems /></Layout></RequireAuth>} />
          <Route path="/editor" element={<RequireAuth><Layout><Editor /></Layout></RequireAuth>} />
          <Route path="/leaderboard" element={<RequireAuth><Layout><Leaderboard /></Layout></RequireAuth>} />
          <Route path="/stats" element={<RequireAuth><Layout><Stats /></Layout></RequireAuth>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
