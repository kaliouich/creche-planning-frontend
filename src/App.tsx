import { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { PageLoader } from './components/ui/PageLoader';
import { apiClient } from './api/client';
import { ToastProvider } from './contexts/ToastContext';

const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const ChildrenManagement = lazy(() => import('./pages/ChildrenManagement'));
const WeekDetails = lazy(() => import('./pages/WeekDetails'));
const ScoreAdjustments = lazy(() => import('./pages/ScoreAdjustments').then(m => ({ default: m.ScoreAdjustments })));
const UsersManagement = lazy(() => import('./pages/UsersManagement'));
const Profile = lazy(() => import('./pages/Profile'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ExchangeBoard = lazy(() => import('./pages/ExchangeBoard'));

// Composant Navbar partagé
const Navbar = ({ onLogout, user }: { onLogout: () => void, user: { firstName: string; lastName: string; role: string } }) => (
  <nav className="navbar" aria-label="Navigation principale">
    <div className="container navbar-content">
      <div className="brand">
        <Link to="/" className="brand-link" aria-label="Retour à l'accueil">
          <img src="/planning/logo.png" alt="Logo Les Fruits de la Passion" className="brand-logo" />
          <span className="sr-only">Crèche Planning</span>
        </Link>
      </div>
      
      <div className="navbar-actions">
        {(user.role === 'ADMIN' || user.role === 'PROFESSIONAL' || user.role === 'PARENT') && (
          <Link to="/" className="btn btn-navbar" aria-label="Aller au tableau de bord">Tableau de bord</Link>
        )}
        {(user.role === 'PARENT') && (
          <Link to="/exchange" className="btn btn-navbar" aria-label="Bourse d'échange">Bourse d'échange</Link>
        )}
        {user.role === 'ADMIN' && (
          <Link to="/admin/users" className="btn btn-navbar" aria-label="Gérer les utilisateurs">Utilisateurs</Link>
        )}
        {(user.role === 'ADMIN' || user.role === 'PROFESSIONAL' || user.role === 'PARENT') && (
          <Link to="/profile" className="btn btn-navbar" aria-label="Voir le profil">Profil</Link>
        )}
        <span className="navbar-user-info" aria-live="polite">
          {user.firstName} {user.lastName} <span className="sr-only">Rôle:</span>({user.role})
        </span>
        <button className="btn btn-navbar" onClick={onLogout} aria-label="Se déconnecter">
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 secondes — évite les re-fetch inutiles lors de la navigation
      retry: 1,
    },
  },
});

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
      <PageLoader text="Vérification de la session..." />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
    <ToastProvider>
    <BrowserRouter basename="/planning">
      {user && <Navbar onLogout={handleLogout} user={user} />}
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <Suspense fallback={
          <div className="flex-center" style={{ minHeight: '50vh' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        }>
          <Routes>
            <Route 
              path="/forgot-password" 
              element={!user ? <ForgotPassword /> : <Navigate to="/" />} 
            />
            <Route 
              path="/reset-password" 
              element={!user ? <ResetPassword /> : <Navigate to="/" />} 
            />
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
              path="/exchange" 
              element={
                !user ? <Navigate to="/login" /> :
                (user.role === 'PARENT' || user.role === 'ADMIN') ? <ExchangeBoard /> :
                <Navigate to="/" />
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
                !user ? <Navigate to="/login" /> : <Profile />
              } 
            />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
    </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
