import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Baby } from 'lucide-react';
import { apiClient } from './api/client';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ParentDashboard from './pages/ParentDashboard';
import ChildrenManagement from './pages/ChildrenManagement';
import WeekDetails from './pages/WeekDetails';
import { ScoreAdjustments } from './pages/ScoreAdjustments';

// Composant Navbar partagé
const Navbar = ({ onLogout, user }: { onLogout: () => void, user: { firstName: string; lastName: string; role: string } }) => (
  <nav className="navbar">
    <div className="container navbar-content">
      <div className="brand">
        <Baby size={32} />
        <span>Crèche Planning</span>
      </div>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ fontWeight: 500 }}>{user.firstName} {user.lastName} ({user.role})</span>
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
    window.location.href = '/login';
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
              user.role === 'ADMIN' ? <AdminDashboard /> :
              <ParentDashboard />
            } 
          />

          <Route 
            path="/admin/children" 
            element={
              !user ? <Navigate to="/login" /> :
              user.role === 'ADMIN' ? <ChildrenManagement /> :
              <Navigate to="/" />
            } 
          />

          <Route 
            path="/admin/weeks/:id" 
            element={
              !user ? <Navigate to="/login" /> :
              user.role === 'ADMIN' ? <WeekDetails /> :
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
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
