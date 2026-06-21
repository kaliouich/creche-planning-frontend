import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';

import { apiClient } from './api/client';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ParentDashboard from './pages/ParentDashboard';
import ChildrenManagement from './pages/ChildrenManagement';
import WeekDetails from './pages/WeekDetails';
import { ScoreAdjustments } from './pages/ScoreAdjustments';
import UsersManagement from './pages/UsersManagement';
import Profile from './pages/Profile';

// Composant Navbar partagé
const Navbar = ({ onLogout, user }: { onLogout: () => void, user: { firstName: string; lastName: string; role: string } }) => (
  <nav className="navbar">
    <div className="container navbar-content">
      <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <img src="/planning/logo.png" alt="Les Fruits de la Passion" style={{ height: '40px', objectFit: 'contain' }} />
          <span style={{ display: 'none' }}>Crèche Planning</span>
        </Link>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {(user.role === 'ADMIN' || user.role === 'PROFESSIONAL') && (
          <Link to="/" className="btn btn-outline" style={{ padding: '0.4rem 1rem', border: 'none' }}>Tableau de bord</Link>
        )}
        {user.role === 'ADMIN' && (
          <Link to="/admin/users" className="btn btn-outline" style={{ padding: '0.4rem 1rem', border: 'none' }}>Utilisateurs</Link>
        )}
        {(user.role === 'ADMIN' || user.role === 'PROFESSIONAL') && (
          <Link to="/profile" className="btn btn-outline" style={{ padding: '0.4rem 1rem', border: 'none' }}>Profil</Link>
        )}
        <span style={{ fontWeight: 500, marginLeft: '1rem' }}>{user.firstName} {user.lastName} ({user.role})</span>
        <button className="btn btn-outline" onClick={onLogout} style={{ padding: '0.4rem 1rem' }}>
          Déconnexion
        </button>
      </div>
    </div>
  </nav>
);

interface UserMeta {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

function App() {
  const [user, setUser] = useState<UserMeta | null>(null);
  const [loading, setLoading] = useState(true);

  // Vérifier la session au chargement
  useEffect(() => {
    const savedUser = localStorage.getItem('userMeta');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('userMeta');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: UserMeta) => {
    setUser(userData);
    // On sauvegarde juste les métadonnées (nom, rôle). Le vrai token est dans le cookie HttpOnly !
    localStorage.setItem('userMeta', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      // Appel du backend pour supprimer les cookies de session côté serveur
      await apiClient.post('/auth/logout');
    } catch {
      // Même si le backend est injoignable, on nettoie le client
    }
    localStorage.removeItem('userMeta');
    setUser(null);
    // Redirection dure pour nettoyer la mémoire
    window.location.href = '/planning/login';
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem' }}>Chargement...</p>
      </div>
    );
  }

  return (
    <BrowserRouter basename="/planning">
      {user && <Navbar onLogout={handleLogout} user={user} />}
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
          />
          
          <Route 
            path="/" 
            element={
              !user ? <Navigate to="/login" /> :
              (user.role === 'ADMIN' || user.role === 'PROFESSIONAL') ? <AdminDashboard /> :
              <ParentDashboard />
            } 
          />

          <Route 
            path="/admin/children" 
            element={
              !user ? <Navigate to="/login" /> :
              (user.role === 'ADMIN' || user.role === 'PROFESSIONAL') ? <ChildrenManagement /> :
              <Navigate to="/" />
            } 
          />

          <Route 
            path="/admin/weeks/:id" 
            element={
              !user ? <Navigate to="/login" /> :
              (user.role === 'ADMIN' || user.role === 'PROFESSIONAL') ? <WeekDetails /> :
              <Navigate to="/" />
            } 
          />
          <Route 
            path="/admin/gestion-perms" 
            element={
              !user ? <Navigate to="/login" /> :
              user.role === 'ADMIN' ? <ScoreAdjustments /> :
              <Navigate to="/" />
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              !user ? <Navigate to="/login" /> :
              user.role === 'ADMIN' ? <UsersManagement /> :
              <Navigate to="/" />
            } 
          />
          <Route 
            path="/profile" 
            element={
              !user ? <Navigate to="/login" /> :
              (user.role === 'ADMIN' || user.role === 'PROFESSIONAL') ? <Profile /> :
              <Navigate to="/" />
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
